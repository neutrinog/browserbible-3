# unfoldingWord Web Bibles #
[![Build Status](https://travis-ci.org/unfoldingWord-dev/uw-web.svg?branch=develop)](https://travis-ci.org/unfoldingWord-dev/uw-web)

A bible software that runs the [unfoldingWord](http://unfoldingword.org) Bibles in the browser. See changelog.md for recent updates.  This code is an update of the [Browser Bible App](https://github.com/digitalbiblesociety/browserbible).

### Grabbing the unfoldingWord Bibles ##

1. Make sure you have [Node.js](http://nodejs.org/download/) installed.
2. Navigate to the `/tools/textgenerator` folder.
3. Run `npm install` to install dependencies.
4. Run `node uw-grab-bibles.js` (This will pull down all the latest versions of UW Bibles)

### Building The unfoldingWord Bibles ###

1. Navigate to the `/tools/textgenerator` folder.
2. Run `node generate.js -u` (`-u` will build every version that belongs to unfoldingWord in the `input` folder, run without `-u` to see help)
3. Run `node create_texts_index.js` (this creates a list of all versions to startup the app)

### Adding Bibles/Texts ###

To create additional texts

1. Create a folder under `/tools/textgenerator/input/MyNewVersion/`
2. Create a `info.json` file in that folder with the id, name, language, information
3. Put content in the folder (currently USFM files and bibles from http://unbound.biola.edu/)
4. From `/tools/textgenerator` folder, run `node generate.js -v <foldername>` to generate an additional text
5. Run `node create_texts_index.js` (this updates the list of versions)

### Build (minify) ###

To create a "build" version, you'll need uglify-js

1. Install uglify-js `npm install uglify-js`
2. Rename `app/js/windows/config-custom-example.js` to `config-custom.js` and update configs to your needs
3. Run `node builder.js` (creates build files to use with index-build.html)
