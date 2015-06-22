# OpenRoads iD

[![Build Status](https://magnum.travis-ci.com/opengovt/openroads-iD.svg?token=d4tUG3NhuWNZYSxWndVL&branch=master)](https://magnum.travis-ci.com/opengovt/openroads-iD)

The OpenRoads network editor is a fork of [iD](https://github.com/openstreetmap/iD), the popular OpenStreetMap editor.

## Basics

* iD is a JavaScript [OpenStreetMap](http://www.openstreetmap.org/) editor.
* It's intentionally simple. It lets you do the most basic tasks while not breaking other people's data.
* It supports modern browsers. Data is rendered with [d3](http://d3js.org/).

## Installation
To run the current development version, fork this project and serve it locally. If you have Python handy, just `cd` into the project root directory and run

     python -m SimpleHTTPServer

Or, with a Mac, you can enable Web Sharing and clone iD into your website directory.

For guidance on building a packaged version, running tests, and contributing to development, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License
iD is available under the [WTFPL](http://sam.zoy.org/wtfpl/), though obviously, if you want to dual-license any contributions that's cool. It includes [d3js](http://d3js.org/), which BSD-licensed.

## Thank you
Initial development of iD was made possible by a [grant of the Knight Foundation](http://www.mapbox.com/blog/knight-invests-openstreetmap/).