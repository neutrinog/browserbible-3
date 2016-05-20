# unfoldingWord Web Bibles #
[![Build Status](https://travis-ci.org/unfoldingWord-dev/uw-web.svg?branch=develop)](https://travis-ci.org/unfoldingWord-dev/uw-web)

A bible software that runs the [unfoldingWord](http://unfoldingword.org) Bibles in the browser. See changelog.md for recent updates.  This code is an update of the [Browser Bible App](https://github.com/digitalbiblesociety/browserbible).

### Gulp ##

We have made it easy to retrieve the latest Bibles, and update the site with these Bibles.  You will need to install [Node.js](http://nodejs.org/download/), and run `npm install .` in the root directory.  Once NodeJS is installed, you can use the following tasks to build the site:

- lint             - Runs jshint on the tests, and all code in the tools/unfolding-word directories.
- test             - Runs the mocha tests files in the test directory.
- uw:build         - Builds the website by grabbing the latest Bibles, converting them to HTML, and setting them up in the correct directory. (Combines uw:grab-bibles & uw:build-bibles)
- uw:grab-bibles   - Grabs the latest Bible from unfoldingWord, and stores them in the input directory.
- uw:build-bibles  - Builds all the Bibles in the input directory, and sets them up in the correct directory.
- watch            - Watches for code changes in the tests & tools/unfolding-word directories.  Then triggers the lint and test tasks.
