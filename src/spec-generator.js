import { FILE_TYPES } from "./index";

/**
 *
 * @param {Map<object, import("./index.js").UploadedFile>} files
 */
export default function createSpec(files) {
    const getData = /** @param {object} key */ key => {
        const uploadedFile = files.get(key);
        return uploadedFile ? uploadedFile.data : [];
    };

    const [segments, cr, hets] = [
        FILE_TYPES.SEG,
        FILE_TYPES.CR,
        FILE_TYPES.HETS
    ].map(getData);

    const chromGrid = {
        name: "chromGrid",
        mark: "rule",
        data: { name: "chromSizes" },
        encoding: {
            x: {
                chrom: "name",
                pos: "size",
                type: "quantitative"
            },
            color: { value: "#d8d8d8" }
        }
    };

    return {
        genome: {
            name: "hg38"
        },

        data: { values: segments },

        encoding: {
            x: {
                chrom: "contig",
                pos: "start",
                type: "quantitative",
                offset: -1
            },
            x2: { chrom: "contig", pos: "end" }
        },

        concat: [
            { import: { name: "cytobands" } },

            /*
            {
                import: {
                    url:
                        "https://genomespy.app/tracks/encode-blacklist/hg38-blacklist.v2.json"
                }
            },
            */

            {
                name: "logRTrack",
                plotBackground: "#f7f7f7",
                layer: [
                    chromGrid,
                    {
                        data: { values: cr },

                        transform: [
                            {
                                type: "filter",
                                expr: "!isNaN(datum.logR) && datum.logR > -3"
                            }
                        ],

                        title: "Single interval midpoint",

                        mark: {
                            type: "point",
                            geometricZoomBound: 12
                        },

                        encoding: {
                            x: {
                                chrom: "contig",
                                pos: "pos",
                                type: "quantitative"
                            },
                            y: {
                                field: "logR",
                                type: "quantitative",
                                title: null,
                                scale: {}
                            },
                            color: { value: "#49A0F2" },
                            size: { value: 150 },
                            opacity: { value: 0.25 },
                            strokeWidth: { value: 0 }
                        }
                    },
                    {
                        title: "Denoised copy-ratio",

                        // TODO: What to do with those that are filtered out
                        transform: [
                            {
                                type: "filter",
                                expr: "datum.LOG2_COPY_RATIO_POSTERIOR_50 > -3"
                            }
                        ],

                        mark: {
                            type: "rule",
                            size: 3.0,
                            minLength: 3.0
                        },
                        encoding: {
                            y: {
                                field: "LOG2_COPY_RATIO_POSTERIOR_50",
                                type: "quantitative",
                                title: "Log2 copy ratio",
                                scale: {}
                            },
                            color: { value: "black" }
                        }
                    }
                ]
            },

            {
                name: "bafTrack",
                plotBackground: "#f7f7f7",

                layer: [
                    chromGrid,
                    {
                        data: { values: hets },

                        title: "B allele frequency",

                        mark: {
                            type: "point",
                            geometricZoomBound: 11
                        },

                        encoding: {
                            x: {
                                chrom: "contig",
                                pos: "pos",
                                offset: -0.5,
                                type: "quantitative"
                            },
                            y: {
                                field: "baf",
                                type: "quantitative",
                                title: null
                            },
                            color: { value: "#49A0F2" },
                            size: { value: 150 },
                            opacity: { value: 0.3 },
                            strokeWidth: { value: 0 }
                        }
                    },
                    {
                        title: "Alternate-allele fraction",
                        mark: {
                            type: "rule",
                            size: 3.0,
                            minLength: 3.0
                        },
                        encoding: {
                            y: {
                                field: "MINOR_ALLELE_FRACTION_POSTERIOR_50",
                                type: "quantitative",
                                scale: { domain: [0, 1] },
                                title: "Alternate-allele fraction"
                            },
                            color: { value: "black" }
                        }
                    },
                    {
                        title: "Mean BAF",
                        mark: {
                            type: "rule",
                            size: 3.0,
                            minLength: 3.0
                        },
                        encoding: {
                            y: {
                                expr:
                                    "1 - datum.MINOR_ALLELE_FRACTION_POSTERIOR_50",
                                type: "quantitative",
                                title: null
                            },
                            color: { value: "black" }
                        }
                    }
                ]
            },

            { import: { name: "genomeAxis" } },

            { import: { name: "geneAnnotation" } }
        ]
    };
}
