/**
 * @param {string} genome
 */
const makeGeneAnnotationTrack = (genome) => ({
    name: "refseq-track",

    height: { step: 23 },

    data: {
        url: `https://genomespy.app/data/genomes/${genome}/refSeq_genes_scored_compressed.${genome}.tsv`,
        format: {
            parse: {
                symbol: "string",
                chrom: "string",
                start: "integer",
                length: "integer",
                strand: "string",
                score: "integer",
                exons: "string",
            },
        },
    },

    transform: [
        {
            type: "linearizeGenomicCoordinate",
            chrom: "chrom",
            pos: "start",
            as: "_start",
        },
        {
            type: "formula",
            expr: "datum._start + datum.length",
            as: "_end",
        },
        {
            type: "formula",
            expr: "datum._start + datum.length / 2",
            as: "_centroid",
        },
        {
            type: "collect",
            sort: { field: ["_start"] },
        },
        {
            type: "pileup",
            start: "_start",
            end: "_end",
            as: "_lane",
            preference: "strand",
            preferredOrder: ["-", "+"],
        },
        {
            type: "filter",
            expr: "datum._lane < 3",
        },
    ],

    encoding: {
        y: {
            field: "_lane",
            type: "ordinal",
            scale: {
                type: "index",
                align: 0,
                paddingInner: 0.4,
                paddingOuter: 0.2,
                domain: [0, 3],
                reverse: true,
                zoom: false,
            },
            axis: null,
        },
    },

    layer: [
        {
            name: "transcripts",

            opacity: {
                unitsPerPixel: [100000, 40000],
                values: [0, 1],
            },

            encoding: {
                color: { value: "#909090" },
            },

            layer: [
                {
                    name: "exons",

                    transform: [
                        {
                            type: "project",
                            fields: ["_lane", "_start", "exons"],
                        },
                        { type: "flattenCompressedExons", start: "_start" },
                    ],

                    mark: {
                        type: "rect",
                        minOpacity: 0.2,
                        minWidth: 0.5,
                        tooltip: null,
                    },

                    encoding: {
                        x: { field: "exonStart", type: "locus" },
                        x2: { field: "exonEnd" },
                    },
                },
                {
                    name: "bodies",

                    title: "Gene annotations",

                    mark: {
                        type: "rule",
                        minLength: 0.5,
                        size: 1,
                        tooltip: null,
                    },
                    encoding: {
                        x: { field: "_start", type: "locus", axis: null },
                        x2: { field: "_end" },
                        search: { field: "symbol" },
                    },
                },
            ],
        },
        {
            name: "symbols",

            transform: [
                {
                    type: "measureText",
                    fontSize: 11,
                    field: "symbol",
                    as: "_textWidth",
                },
                {
                    type: "filterScoredLabels",
                    lane: "_lane",
                    score: "score",
                    width: "_textWidth",
                    pos: "_centroid",
                    padding: 5,
                },
            ],

            layer: [
                {
                    name: "labels",
                    mark: {
                        type: "text",
                        size: 11,
                        yOffset: 7,
                        tooltip: {
                            handler: "refseqgene",
                        },
                    },
                    encoding: {
                        x: {
                            field: "_centroid",
                            type: "locus",
                        },
                        text: { field: "symbol" },
                    },
                },
                {
                    name: "arrows",
                    opacity: {
                        unitsPerPixel: [100000, 40000],
                        values: [0, 1],
                    },
                    mark: {
                        type: "point",
                        yOffset: 7,
                        size: 50,
                        tooltip: null,
                    },
                    encoding: {
                        x: {
                            field: "_centroid",
                            type: "locus",
                        },
                        dx: {
                            expr: "(datum._textWidth / 2 + 5) * (datum.strand == '-' ? -1 : 1)",
                            type: "quantitative",
                            scale: null,
                        },
                        color: { value: "black" },
                        shape: {
                            field: "strand",
                            type: "nominal",
                            scale: {
                                domain: ["-", "+"],
                                range: ["triangle-left", "triangle-right"],
                            },
                        },
                    },
                },
            ],
        },
    ],
});

export default makeGeneAnnotationTrack;
