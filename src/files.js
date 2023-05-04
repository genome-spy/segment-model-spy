/**
 * @typedef {object} FileType
 * @prop {string} name
 * @prop {string} title
 * @prop {string} example
 * @prop {string} [column]
 */

import { parseSamHeader } from "./sam";
import { iterateLines } from "./utils";

/**
 * @type {Record<string, FileType>}
 */
export const FILE_TYPES = {
    HETS: {
        name: "HETS",
        title: "Allelic counts",
        example: "tumor.hets.tsv",
        column: "REF_COUNT",
    },
    CR: {
        name: "CR",
        title: "Denoised copy ratios",
        example: "tumor.denoisedCR.tsv",
        column: "LOG2_COPY_RATIO",
    },
    SEG: {
        name: "SEG",
        title: "Modeled segments",
        example: "tumor.modelFinal.seg",
        column: "LOG2_COPY_RATIO_POSTERIOR_50",
    },
    DICT: {
        name: "DICT",
        title: "Sequence dictionary",
        example: "GRCh38.d1.vd1.fa.dict",
        column: undefined,
    },
};

/**
 *
 * @param {string} textContent
 */
export function detectFileType(textContent) {
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

/**
 * @param {string} textContent
 */
function parseContigs(textContent) {
    const header = parseSamHeader(textContent);

    if (!header.SQ) {
        throw new Error("The SAM header has no sequence dictionary!");
    }

    return header.SQ.map((/** @type {any} */ record) => ({
        name: record.SN,
        size: +record.LN,
    }));
}

const toNumber = (/** @type {string} */ str) => (str !== "" ? +str : null);

/**
 * Explicit conversion functions are faster than vega-loader's type conversions
 * @type {Record<string, (d: Record<string, any>) => Record<string, any>>}
 */
export const converters = {
    [FILE_TYPES.HETS.name]: (d) => {
        const alt = +d.ALT_COUNT,
            ref = +d.REF_COUNT;
        return {
            contig: d.CONTIG,
            pos: +d.POSITION,
            baf: alt / (ref + alt),
        };
    },

    [FILE_TYPES.CR.name]: (d) => {
        const start = +d.START,
            end = +d.END;
        return {
            contig: d.CONTIG,
            start,
            end,
            pos: (start - 1 + end) / 2, // midpoint in zero-based half-open coordinates
            logR: toNumber(d.LOG2_COPY_RATIO),
        };
    },

    [FILE_TYPES.SEG.name]: (d) => ({
        contig: d.CONTIG,
        start: +d.START,
        end: +d.END,
        NUM_POINTS_COPY_RATIO: +d.NUM_POINTS_COPY_RATIO,
        NUM_POINTS_ALLELE_FRACTION: +d.NUM_POINTS_ALLELE_FRACTION,
        LOG2_COPY_RATIO_POSTERIOR_10: +d.LOG2_COPY_RATIO_POSTERIOR_10,
        LOG2_COPY_RATIO_POSTERIOR_50: toNumber(d.LOG2_COPY_RATIO_POSTERIOR_50),
        LOG2_COPY_RATIO_POSTERIOR_90: +d.LOG2_COPY_RATIO_POSTERIOR_90,
        MINOR_ALLELE_FRACTION_POSTERIOR_10:
            +d.MINOR_ALLELE_FRACTION_POSTERIOR_10,
        MINOR_ALLELE_FRACTION_POSTERIOR_50: toNumber(
            d.MINOR_ALLELE_FRACTION_POSTERIOR_50
        ),
        MINOR_ALLELE_FRACTION_POSTERIOR_90:
            +d.MINOR_ALLELE_FRACTION_POSTERIOR_90,
    }),
};
