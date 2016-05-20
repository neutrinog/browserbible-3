/**
 * Grab the latest bibles from Unfolding Word, and prepare them for integrating in this app.
 * Read the README.md file at the root of this project for more details.
 */
var uw = require('./uw-grab-available-texts');
var path = require('path');
/**
 * Set some of the settings before processing
 *
 */
uw.catalogUrl = 'https://api.unfoldingword.org/uw/txt/2/catalog.json';
uw.destinationFolder = path.join(__dirname, 'input');
/**
 * Process the current Bibles
 */
uw.process();
