import { html, render } from "lit-html";
import { classMap } from "lit-html/directives/class-map.js";

import { dsvFormat } from "d3-dsv";
import { embed } from "genome-spy";

import { parseSamHeader } from "./sam";
import createSpec from "./spec-generator";
import { readFileAsync, iterateLines, waitForAnimationFrame } from "./utils";

import "./style.scss";

const GENOMES = ["hg38", "hg19"];

/**
 * @typedef {object} UploadedFile
 * @prop {string} name
 * @prop {object[]} data
 */

/**
 * @typedef {object} FileType
 * @prop {string} name
 * @prop {string} title
 * @prop {string} example
 * @prop {string} [column]
 */

/**
 * @type {Record.<string, FileType>}
 */
export const FILE_TYPES = {
    HETS: {
        name: "HETS",
        title: "Allelic counts",
        example: "tumor.hets.tsv",
        column: "REF_COUNT"
    },
    CR: {
        name: "CR",
        title: "Denoised copy ratios",
        example: "tumor.denoisedCR.tsv",
        column: "LOG2_COPY_RATIO"
    },
    SEG: {
        name: "SEG",
        title: "Modeled segments",
        example: "tumor.modelFinal.seg",
        column: "LOG2_COPY_RATIO_POSTERIOR_50"
    },
    DICT: {
        name: "DICT",
        title: "Sequence dictionary",
        example: "GRCh38.d1.vd1.fa.dict",
        column: undefined
    }
};

/**
 *
 * @param {string} textContent
 */
function detectFileType(textContent) {
    const headerLine = findTsvHeader(textContent);
    if (typeof headerLine === "string" && headerLine !== "") {
        const columns = headerLine.split("\t");
        for (const type of Object.values(FILE_TYPES)) {
            if (type.column && columns.includes(type.column)) {
                return type;
            }
        }
    } else if (textContent[0] === "@") {
        // Assume a dict file. TODO: Make more robust
        return FILE_TYPES.DICT;
    }
}

/**
 * Finds the header line from a DSV file. Skips comment lines and returns the first
 * actual line.
 *
 * @param {string} text
 */
function findTsvHeader(text, commentPrefix = "@") {
    for (const line of iterateLines(text)) {
        if (typeof commentPrefix === "string" && line[0] !== commentPrefix) {
            return line;
        }
    }
}

function parseContigs(textContent) {
    const header = parseSamHeader(textContent);

    if (!header.SQ) {
        throw new Error("The SAM header has no sequence dictionary!");
    }

    return header.SQ.map(record => ({
        name: record.SN,
        size: +record.LN
    }));
}

class SegmentModelSpy {
    constructor() {
        /** @type {Map<object, UploadedFile} */
        this.files = new Map();
        this.genome = GENOMES[0];

        this.dragging = false;
        this.genomeSpyLaunched = false;

        this.render();
    }

    _getMainTemplate() {
        const getTableRow = type => {
            const file = this.files.get(type);

            return html`
                <tr>
                    <td>${type.title}</td>
                    ${file
                        ? html`
                              <td class="status okay">
                                  <span class="icon">&#x2714;</span>
                              </td>
                              <td>
                                  ${file.name}
                              </td>
                              <td>
                                  ${file.data
                                      ? `${file.data.length} records`
                                      : "Parsing..."}
                              </td>
                          `
                        : html`
                              <td class="status">
                                  <span class="icon">&#x2717;</span>
                              </td>
                              <td>
                                  Missing.
                                  <span class="example-file"
                                      >Example: ${type.example}</span
                                  >
                              </td>
                              <td></td>
                          `}
                </tr>
            `;
        };

        const getGenomeButtons = () => html`
            <div class="btn-group" role="group">
                ${GENOMES.map(
                    g => html`
                        <button
                            type="button"
                            @click=${() => this.selectGenome(g)}
                            class="btn btn-secondary ${this.genome === g
                                ? "active"
                                : ""}"
                        >
                            ${g}
                        </button>
                    `
                )}
                <button
                    type="button"
                    @click=${() => this.selectGenome(undefined)}
                    class="btn btn-secondary ${!this.genome ? "active" : ""}"
                >
                    .dict file
                </button>
            </div>
        `;

        const getFileBox = () => html`
            <div
                @dragenter=${this.drag}
                @dragover=${this.drag}
                @dragleave=${this.drag}
                @drop=${this.drop}
                class=${classMap({
                    "drop-zone": true,
                    dragging: this.dragging,
                    "active-panel": !this.genomeSpyLaunched
                })}
            >
                <div class="file-box">
                    <h2>
                        1. Choose a genome assembly or a sequence dictionary
                    </h2>

                    <p>
                        Choosing a genome assembly instead of a sequence
                        dictionary activates cytoband, GC content, and RefSeq
                        gene tracks.
                    </p>

                    ${getGenomeButtons()}

                    <h2>2. Select files</h2>

                    <p>
                        Please provide at least one of the following files to
                        start visualizing. File types are detected from the TSV
                        header row.
                    </p>

                    <p>
                        N.B. All data processing takes place in your web
                        browser. Nothing is uploaded anywhere.
                    </p>

                    <table class="file-table">
                        ${Object.values(FILE_TYPES)
                            .filter(
                                type => type !== FILE_TYPES.DICT || !this.genome
                            )
                            .map(getTableRow)}
                    </table>

                    <input
                        type="file"
                        multiple
                        accept=".tsv,.seg"
                        id="fileInput"
                        @change=${this.filesChosen}
                        style="display:none"
                    />

                    <div class="upload-button-wrapper">
                        <button
                            class="btn"
                            style="margin-right: 1em"
                            @click=${e => {
                                document.getElementById("fileInput").click();
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                        >
                            Choose files
                        </button>
                        or drag and drop here.
                    </div>

                    <h2>3. Explore the data</h2>

                    Zoom with the mouse wheel or touchpad, pan by dragging or
                    with the touchpad. Hover an item to get details.

                    <div class="buttons">
                        <button
                            ?disabled=${!this.isReadyToVisualize()}
                            @click=${this.visualize}
                            class="btn btn-lg"
                        >
                            Let's visualize!
                        </button>
                    </div>
                </div>
            </div>
        `;

        return html`
            ${getFileBox()}

            <div
                id="genome-spy-container"
                class=${classMap({ "active-panel": !!this.genomeSpyLaunched })}
            ></div>
        `;
    }

    _getToolbarTemplate() {
        // TODO: Fix the xScale hack. Provide an "initialized" property
        return html`
            <div class="buttons ${this.genomeSpy ? "visible" : "hidden"}">
                <button @click=${this.closeVisualization}>
                    &#x21D0; Back to files
                </button>
            </div>
        `;
    }

    drag(e) {
        e.stopPropagation();
        e.preventDefault();
        if (e.type === "dragleave") {
            this.dragging = false;
            this.render();
        } else {
            this.dragging = true;
            this.render();
        }
    }

    drop(e) {
        e.stopPropagation();
        e.preventDefault();
        this.dragging = false;

        const dt = e.dataTransfer;
        const files = dt.files;

        this.handleFiles(files);
    }

    isReadyToVisualize() {
        // Ugh, an immutable Map would be awesome!
        const sampleFiles = new Map(
            [...this.files.entries()].filter(
                entry => entry[0] !== FILE_TYPES.DICT
            )
        );

        return (
            sampleFiles.size > 0 &&
            [...sampleFiles.values()].every(f => f.data) &&
            (this.genome || this.files.has(FILE_TYPES.DICT))
        );
    }

    render() {
        render(this._getMainTemplate(), document.querySelector("main"), {
            eventContext: this
        });
        render(
            this._getToolbarTemplate(),
            document.querySelector("header .toolbar"),
            {
                eventContext: this
            }
        );
    }

    async visualize() {
        this.closeVisualization();

        const spec = createSpec(this.files, this.genome);
        this.genomeSpyLaunched = true;
        this.render();

        this.genomeSpy = await embed(
            document.querySelector("#genome-spy-container"),
            spec,
            { bare: true }
        );

        this.render();
    }

    closeVisualization() {
        if (this.genomeSpy) {
            this.genomeSpy.destroy();
            this.genomeSpy = undefined;
        }
        this.genomeSpyLaunched = false;
        this.render();
    }

    selectGenome(genome) {
        this.genome = genome;
        this.render();
    }

    /**
     *
     * @param {InputEvent} event
     */
    filesChosen(event) {
        this.handleFiles(event.target.files);
    }

    async handleFiles(files) {
        const toNumber = str => (str !== "" ? +str : null);

        // Explicit conversion functions are faster than vega-loader's type conversions
        const converters = {
            [FILE_TYPES.HETS.name]: d => {
                const alt = +d.ALT_COUNT,
                    ref = +d.REF_COUNT;
                return {
                    contig: d.CONTIG,
                    pos: +d.POSITION,
                    baf: alt / (ref + alt)
                };
            },

            [FILE_TYPES.CR.name]: d => {
                const start = +d.START,
                    end = +d.END;
                return {
                    contig: d.CONTIG,
                    start,
                    end,
                    pos: (start - 1 + end) / 2, // midpoint in zero-based half-open coordinates
                    logR: toNumber(d.LOG2_COPY_RATIO)
                };
            },

            [FILE_TYPES.SEG.name]: d => ({
                contig: d.CONTIG,
                start: +d.START,
                end: +d.END,
                NUM_POINTS_COPY_RATIO: +d.NUM_POINTS_COPY_RATIO,
                NUM_POINTS_ALLELE_FRACTION: +d.NUM_POINTS_ALLELE_FRACTION,
                LOG2_COPY_RATIO_POSTERIOR_10: +d.LOG2_COPY_RATIO_POSTERIOR_10,
                LOG2_COPY_RATIO_POSTERIOR_50: toNumber(
                    d.LOG2_COPY_RATIO_POSTERIOR_50
                ),
                LOG2_COPY_RATIO_POSTERIOR_90: +d.LOG2_COPY_RATIO_POSTERIOR_90,
                MINOR_ALLELE_FRACTION_POSTERIOR_10: +d.MINOR_ALLELE_FRACTION_POSTERIOR_10,
                MINOR_ALLELE_FRACTION_POSTERIOR_50: toNumber(
                    d.MINOR_ALLELE_FRACTION_POSTERIOR_50
                ),
                MINOR_ALLELE_FRACTION_POSTERIOR_90: +d.MINOR_ALLELE_FRACTION_POSTERIOR_90
            })
        };

        const pendingFiles = [];

        for (const file of files) {
            const textContent = await readFileAsync(file);
            const type = detectFileType(textContent);
            if (type) {
                pendingFiles.push({ file, textContent, type });
                this.files.set(type, { name: file.name, data: null });
            } else {
                alert(`Cannot recognise this file: ${file.name}.`);
            }

            // Automatically disable genome assmbly if user adds a dict file
            if (type === FILE_TYPES.DICT) {
                this.genome = undefined;
            }
        }

        for (const pendingFile of pendingFiles) {
            this.render();
            // Give the browser some time to update the UI
            await waitForAnimationFrame();

            let parsed;

            if (pendingFile.type !== FILE_TYPES.DICT) {
                parsed = dsvFormat("\t", { comment: "@" }).parse(
                    pendingFile.textContent,
                    converters[pendingFile.type.name]
                );
            } else {
                parsed = parseContigs(pendingFile.textContent);
            }

            this.files.set(pendingFile.type, {
                name: pendingFile.file.name,
                data: parsed
            });
        }

        await waitForAnimationFrame();
        this.render();

        // Let's jump straight into visualization if all the file types were added at the same time
        if (
            new Set(
                pendingFiles
                    .map(pf => pf.type)
                    .filter(pf => pf.type !== FILE_TYPES.DICT)
            ).size === 3 &&
            this.isReadyToVisualize()
        ) {
            this.visualize();
        }
    }
}

const smp = new SegmentModelSpy();
