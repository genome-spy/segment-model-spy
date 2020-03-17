# SegmentModel Spy

SegmentModel Spy is a an interactive visualization tool for
[GATK](https://gatk.broadinstitute.org/)'s CNV segmentation results. In
practice, it does (almost) all that
[PlotModeledSegments](https://gatk.broadinstitute.org/hc/en-us/articles/360037593891-PlotModeledSegments)
does but adds continuous panning and zooming and provides a few annotation tracks.
Under the hood, SegmentModel Spy uses
[GenomeSpy](https://github.com/tuner/genome-spy) for WebGL-based rendering.

An online version is available at https://genomespy.app/segmentmodel/

<p align="center">
  <img width="480" height="270" src="docs/video.gif" />
</p>

## Local installation (for development)

1. `git clone git@github.com:tuner/segment-model-spy.git`
2. `cd segment-model-spy`
3. `npm install`
4. `npm start`
5. Browse to http://localhost:8080/ or whatever port is shown on the console.

## Legal stuff

Copyright (c) 2020 Kari Lavikka. See [LICENSE](LICENSE) for details.

SegmentModel Spy is developed in The Systems Biology of Drug Resistance in
Cancer group at the University of Helsinki.

GATK is a trademark of the Broad Institute, Inc.
