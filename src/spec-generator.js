import { FILE_TYPES } from "./files.js";
import makeIdeogramTrack from "./tracks/ideogram.js";
import makeGcContentTrack from "./tracks/gc-content.js";
import makeGeneAnnotationTrack from "./tracks/gene-annotation.js";

const COLORS = {
    INTERVAL: "#f70",
    RULE: "black",
    POINT: "#49A0F2",
    BACKGROUD: "#f7f7f7",
};

/**
 *
 * @param {string} middle
 * @param {{lower: string, upper: string}} param1
 * @returns
 */
function createCredibleIntervalLayer(middle, { lower, upper }) {
    const layer = [];

    if (lower && upper) {
        layer.push({
            mark: {
                type: "rect",
                minWidth: 2.0,
                minOpacity: 1.0,
            },
            encoding: {
                y: {
                    field: lower,
                    type: "quantitative",
                    title: /** @type {string} */ (null),
                },
                y2: {
                    field: upper,
                },
                color: { value: COLORS.INTERVAL },
                opacity: { value: 0.3 },
            },
        });
    }

    layer.push({
        mark: {
            type: "rule",
            size: 3.0,
            minLength: 3.0,
        },
        encoding: {
            y: {
                field: middle,
                type: "quantitative",
                title: /** @type {string} */ (null),
            },
            color: { value: COLORS.RULE },
        },
    });

    return layer;
}

/**
 * @param {number} intervalCount
 */
function getGeometricZoomBound(intervalCount) {
    // TODO: Implement in GenomeSpy as "auto"
    // Come up with something a bit more sophisticated. Behavior with small counts could be better.
    return Math.max(0, Math.log((intervalCount - 1000) / 4) / Math.log(3)) || 0;
}

/**
 *
 * @param {Map<object, import("./index.js").ParsedFile>} files
 * @param {string} [genomeName]
 */
export default function createSpec(files, genomeName) {
    const getData = /** @param {object} key */ (key) => {
        const uploadedFile = files.get(key);
        const data = uploadedFile ? uploadedFile.data : [];

        if (/^hg\d+/.test(genomeName)) {
            // TODO: Should be done in GenomeSpy
            // Filter out contigs that aren't chromosomes
            // Caching looks overly complex but is over 50% faster than just testing every datum with the regex
            /** @type {string} */
            let prevContig;
            const tester = (d) => {
                const contig = d.contig;
                if (contig === prevContig) {
                    return true;
                } else {
                    if (/^(chr)?(\d{1,2}|[XY])$/.test(contig)) {
                        prevContig = contig;
                        return true;
                    } else {
                        prevContig = "";
                        return false;
                    }
                }
            };
            return data.filter(tester);
        }
        return data;
    };

    const genome = genomeName
        ? {
              name: genomeName,
          }
        : {
              contigs: files.get(FILE_TYPES.DICT).data,
          };

    const [segments, cr, hets] = [
        FILE_TYPES.SEG,
        FILE_TYPES.CR,
        FILE_TYPES.HETS,
    ].map(getData);

    /**
     * @param {string} genome
     * @param {(genome: string) => object} f
     */
    const wrap = (genome, f) => (genome ? [f(genome)] : []);

    return {
        genome,

        data: { values: segments },

        resolve: {
            scale: {
                x: "shared",
            },
            axis: {
                x: "independent",
            },
        },

        vconcat: [
            ...wrap(genomeName, makeIdeogramTrack),
            ...wrap(genomeName, makeGcContentTrack),
            {
                resolve: {
                    scale: {
                        x: "shared",
                    },
                },

                encoding: {
                    x: {
                        chrom: "contig",
                        pos: "start",
                        type: "locus",
                        offset: -1,
                        axis: {
                            title: null,
                        },
                    },
                    x2: { chrom: "contig", pos: "end" },
                },

                vconcat: [
                    {
                        name: "logRTrack",
                        view: { fill: COLORS.BACKGROUD, stroke: "gray" },
                        layer: [
                            {
                                data: { values: cr },

                                transform: [
                                    {
                                        type: "filter",
                                        expr: "!isNaN(datum.logR) && datum.logR > -3",
                                    },
                                ],

                                mark: {
                                    type: "point",
                                    tooltip: null,
                                    geometricZoomBound: getGeometricZoomBound(
                                        cr.length
                                    ),
                                },

                                encoding: {
                                    x: {
                                        chrom: "contig",
                                        pos: "pos",
                                        type: "locus",
                                        axis: {
                                            grid: true,
                                            gridDash: [1, 5],
                                            chromGrid: true,
                                        },
                                    },
                                    y: {
                                        field: "logR",
                                        type: "quantitative",
                                        title: "Log2 copy ratio",
                                        scale: {},
                                        axis: {
                                            maxExtent: 40,
                                        },
                                    },
                                    color: { value: COLORS.POINT },
                                    size: { value: 150 },
                                    opacity: { value: 0.25 },
                                    strokeWidth: { value: 0 },
                                },
                            },
                            {
                                // TODO: What to do with those that are filtered out
                                transform: [
                                    {
                                        type: "filter",
                                        expr: "datum.LOG2_COPY_RATIO_POSTERIOR_50 > -3",
                                    },
                                ],

                                layer: createCredibleIntervalLayer(
                                    "LOG2_COPY_RATIO_POSTERIOR_50",
                                    {
                                        lower: "LOG2_COPY_RATIO_POSTERIOR_10",
                                        upper: "LOG2_COPY_RATIO_POSTERIOR_90",
                                    }
                                ),
                            },
                        ],
                    },

                    {
                        name: "bafTrack",

                        view: { fill: "#f7f7f7", stroke: "gray" },

                        layer: [
                            {
                                data: { values: hets },

                                mark: {
                                    type: "point",
                                    tooltip: null,
                                    geometricZoomBound: getGeometricZoomBound(
                                        hets.length
                                    ),
                                },

                                encoding: {
                                    x: {
                                        chrom: "contig",
                                        pos: "pos",
                                        offset: -0.5,
                                        type: "locus",
                                        axis: {
                                            grid: true,
                                            gridDash: [1, 5],
                                            chromGrid: true,
                                        },
                                    },
                                    y: {
                                        field: "baf",
                                        type: "quantitative",
                                        title: "Minor allele fraction",
                                        scale: { domain: [0, 1] },
                                        axis: {
                                            maxExtent: 40,
                                        },
                                    },
                                    color: { value: COLORS.POINT },
                                    size: { value: 150 },
                                    opacity: { value: 0.3 },
                                    strokeWidth: { value: 0 },
                                },
                            },
                            {
                                layer: [
                                    {
                                        layer: createCredibleIntervalLayer(
                                            "MINOR_ALLELE_FRACTION_POSTERIOR_50",
                                            {
                                                lower: "MINOR_ALLELE_FRACTION_POSTERIOR_10",
                                                upper: "MINOR_ALLELE_FRACTION_POSTERIOR_90",
                                            }
                                        ),
                                    },
                                    {
                                        transform: [10, 50, 90]
                                            .map(
                                                (x) =>
                                                    `MINOR_ALLELE_FRACTION_POSTERIOR_${x}`
                                            )
                                            .map((field) => ({
                                                type: "formula",
                                                expr: `1 - datum.${field}`,
                                                as: field,
                                            })),
                                        layer: createCredibleIntervalLayer(
                                            "MINOR_ALLELE_FRACTION_POSTERIOR_50",
                                            {
                                                lower: "MINOR_ALLELE_FRACTION_POSTERIOR_10",
                                                upper: "MINOR_ALLELE_FRACTION_POSTERIOR_90",
                                            }
                                        ),
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },

            ...wrap(genomeName, makeGeneAnnotationTrack),
        ],
    };
}
