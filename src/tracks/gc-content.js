/**
 * @param {string} genome
 */
const makeGcContentTrack = (genome) => ({
    description:
        "Windowed GC content computed from the reference genome. Extracted with GATK AnnotateIntervals",

    height: 50,

    view: { fill: "#f7f7f7", stroke: "gray" },

    data: {
        url: `https://genomespy.app/tracks/gc-content/gc-intervals.${genome}.tsv`,
    },

    mark: {
        type: "rect",
        minWidth: 0.5,
        minOpacity: 1,
    },

    encoding: {
        x: {
            chrom: "CONTIG",
            pos: "START",
            offset: -1,
            type: "locus",
            axis: null,
        },
        x2: {
            chrom: "CONTIG",
            pos: "END",
        },
        y: {
            field: "GC_CONTENT",
            type: "quantitative",
            scale: {
                domain: [0.3, 0.7],
            },
            title: "GC cont.",
            axis: {
                maxExtent: 40,
            },
        },
    },
});

export default makeGcContentTrack;
