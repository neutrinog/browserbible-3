/**
 * This class parses a line of text that is written in USFM format and returns an array of objects that contains the key, number, text, and order of appearance
 * for each USFM tag in the line.  To find out more about the USFM formatting, checkout http://paratext.org/system/files/usfmReference2_4.pdf.
 *
 * @author Johnathan Pulos <johnathan@missionaldigerati.org>
 */
var usfmParser = function() {
  var upObject = {};
  /**
   * The Regular Expression to apply to a line to get the tags
   *
   * @type {RegExp}
   * @access public
   */
  upObject.lineRegex = /\\([a-z0-9\*]+)\s*(\d+[\-\d+]*)?(?![a-zA-Z])\s*([^\\]*)/g;
  /**
   * Parse a line of USFM tags
   *
   * @param  {String} line  The line to parse
   *
   * @return {Array}        An array of objects contains the key, number, text, and order of appearance
   * for each USFM tag in the line
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  upObject.parseLine = function(line) {
    var order = 1;
    var data = [];
    var matches;
    /*jshint -W084 */
    while (matches = upObject.lineRegex.exec(line)) {
      data.push({
        key:    matches[1] || '',
        number: matches[2] || '',
        text:   matches[3] || '',
        order: order
      });
      order++;
    }

    return data;
  };

  return upObject;
};

/**
 * Expose the library
 *
 */
usfm = new usfmParser();
exports = module.exports = usfm;