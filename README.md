# SegmentModel Spy

SegmentModel Spy is a an interactive visualization tool for
[GATK](https://gatk.broadinstitute.org/)'s
[copy-number](https://en.wikipedia.org/wiki/Copy_number_variation) segmentation
results. In practice, it does (almost) all that
[PlotModeledSegments](https://gatk.broadinstitute.org/hc/en-us/articles/360037593891-PlotModeledSegments)
does but adds continuous panning and zooming and provides a few annotation
tracks. Under the hood, SegmentModel Spy uses
[GenomeSpy](https://github.com/genome-spy/genome-spy) for WebGL-based rendering.
This tool is also an example of how to use GenomeSpy in a web application.

An online version is available at https://genomespy.app/segmentmodel/

<p align="center">
  <img width="480" height="270" src="docs/video.gif" />
</p>

## Local installation (for development)

1. `git clone git@github.com:genome-spy/segment-model-spy.git`
2. `cd segment-model-spy`
3. `npm install`
4. `npm start`
5. Browse to http://localhost:5173/ or whatever port is shown on the console.

## Legal stuff and acknowledgements

Copyright (c) 2020-2024 Kari Lavikka. See [LICENSE](LICENSE) for details.

SegmentModel Spy is developed in [The Systems Biology of Drug Resistance in
Cancer](https://www.helsinki.fi/en/researchgroups/systems-biology-of-drug-resistance-in-cancer)
group at the University of Helsinki.

This project has received funding from the European Union's Horizon 2020
research and innovation programme under grant agreement No. 965193
([DECIDER](https://www.deciderproject.eu/)) and No. 847912
([RESCUER](https://www.rescuer.uio.no/)), the Sigrid Jusélius Foundation and
the Cancer Foundation Finland.

GATK is a trademark of the Broad Institute, Inc.
