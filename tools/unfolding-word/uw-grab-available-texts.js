/**
 * This script is designed to pull Bible versions from the Unfolding Word Project.
 * It will pull all the versions from the catalogUrl, and download the usfm files
 * into the destinationFolder.  Then you can generate the appropriate
 * HTML for this app.
 */
var uwGrabAvailableTexts = function() {
  /**
   * This classes main object
   *
   * @type {Object}
   * @access private
   */
  var uwObject = {};
  /**
   * Nodejs package request for grabbing the JSON
   *
   * @type {Object}
   * @access private
   */
  var request = require('request');
  /**
   * Nodejs package mkdirp for creating directories
   *
   * @type {Object}
   * @access private
   */
  var mkdirp = require('mkdirp');
  /**
   * Nodejs package del for finding and deleting directories
   *
   * @type {Object}
   * @access private
   */
  var del = require('del');

  /**
   * Nodejs package filesystem for writing files
   *
   * @type {Object}
   * @access private
   */
  var fileSystem = require('fs');
  /**
   * Nodejs package download for downloading files
   *
   * @type {Object}
   * @access private
   */
  var download = require('download');
  /**
   * Nodejs package moment for manipulating dates
   *
   * @type {Object}
   * @access private
   */
  var moment = require('moment');
  /**
   * The directory where you want the final files placed.  All folders starting with uw_ in this directory
   * are removed when it prepares the folder.  This is relative to the script that uses this module.
   *
   * @type {String}
   * @access public
   */
  uwObject.destinationFolder = '../../input';
  /**
   * The API url to grab the available Bible texts from.  It should return JSON.
   *
   * @type {String}
   * @access public
   */
  uwObject.catalogUrl = '';

  /**
   * The API url to grab the list of languages from.  It should return JSON.
   *
   * @type {String}
   * @access public
   */
  uwObject.languagesUrl = 'http://td.unfoldingword.org/exports/langnames.json';

  /**
   * Quiet the notifications produced by this script.  Does not silence errors.
   *
   * @type {Boolean}
   */
  uwObject.silenceNotification = false;

  /**
   * The list of languages downloaded from the API.
   *
   * @type {Array}
   * @access public
   */
  uwObject.languageData = [];

  /**
   * Get the list of languages from the API.
   * @param {function} _callback What to do after we've gotten the list
   */
  uwObject.downloadLanguageData = function(_callback) {

    display('Getting the list of languages from ' + uwObject.languagesUrl + '.');
    request(uwObject.languagesUrl, function(error, response, body) {
      if (error) {
        display('Error - downloadLanguageData:', true);
        console.log(error);
      }
      else if (response.statusCode != 200) {
        display('Error - downloadLanguageData: status code = ' + response.statusCode, true);
        display(body);
      }
      else {
        uwObject.languageData = JSON.parse(body);
        _callback();
      }
    });
  };

  /**
   * Grab the current Bibles from the latest Unfolding Word catalog feed.  Once the content is received,
   * we pass it to the given callback() function with an array of bibles available formated for easier
   * consumption.  See getBibleVersions() comments to see the format.
   *
   * @param {Object} _callback A call back method called when we have retrieved the Bibles
   * @return {void}
   * @access public
   * @throws {Error} If Request is unable to get the JSON object
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  uwObject.getBibles = function(_callback) {
    display('Getting the bibles available from ' + uwObject.catalogUrl + '.');
    request(uwObject.catalogUrl, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = JSON.parse(body);
        var bibles = [];
        for (var i = 0; i < data.cat.length; i++) {
          if (data.cat[i].slug == 'bible') {
            bibles = bibles.concat(getBibleVersions(data.cat[i].langs));
          }
        }
        _callback(bibles);
      } else {
        throw Error('uwGrabAvailableTexts - Unable to grab Unfolding Word content: ' + error + '.');
      }
    });
  };
  /**
   * Downloads all the usfm files from Unfolding Word, and sets up the version in the input directory
   * with the correct info.json file.
   *
   * @param  {Array} bibles An array of the available versions
   *
   * @return {void}
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  uwObject.downloadBibles = function(bibles) {
    display('Parsing the Bible data.');
    for (var i = 0; i < bibles.length; i++) {
      var bible = bibles[i];
      var directoryPath = uwObject.destinationFolder + '/' + bible.version_info.id;
      /**
       * Let's create the directory for the files
       */
      mkdirp(directoryPath);
      /**
       * let's add the info.json file
       */
      fileSystem.writeFile(directoryPath + '/info.json', JSON.stringify(bible.version_info), function(error) {
        if (error) {
          display('Unable to create the info JSON file at: ' + directoryPath + '/info.json because: ' + error);
        }
      });
      /**
       * Let's create the about.html file
       */
      fileSystem.writeFile(directoryPath + '/about.html', bible.about, function(error) {
        if (error) {
          display('Unable to create the about.html file at: ' + directoryPath + '/about.html because: ' + error);
        }
      });
      /**
       * Now download all the files
       */
      display('Downloading the usfm files... This may take a while... Go grab a cup of coffee...');
      var fileDownload = new download({});
      for (var f = 0; f < bible.files.length; f++) {
        fileDownload.get(bible.files[f]);
      }
      fileDownload.dest(directoryPath);
      fileDownload.run();
    }
  };
  /**
   * Run the full process:
   *
   * 1) Prepare the destinationFolder for the Bible versions
   * 2) Retrieve the latest Bible versions from Unfolding Word
   * 3) Create a directory for each version, add a info.json, and download the usm files
   *
   * @return {void}
   * @access public
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  uwObject.process = function() {
    prepareFolder(function () {
      uwObject.downloadLanguageData(function() {
        uwObject.getBibles(function(bibles) {
          uwObject.downloadBibles(bibles);
        });
      });
    });
  };

  function createAboutFile(version) {
    content = '<dt>Information</dt><dd>' + version.name + '</dd>';
    if (version.status.contributors) {
      content += '<dt>Contributors</dt><dd>' + version.status.contributors + '</dd>';
    }
    if (version.status.checking_entity) {
      content += '<dt>Checking Entity</dt><dd>' + version.status.checking_entity + '</dd>';
    }
    if (version.status.checking_level) {
      content += '<dt>Checking Level</dt><dd>' + version.status.checking_level + '</dd>';
    }
    if (version.status.publish_date) {
      var publishDate = version.status.publish_date;
      if (publishDate.length === 8) {
        publishDate = moment(publishDate, 'YYYYMMDD').format('MMMM DD, YYYY');
      }
      content += '<dt>Published</dt><dd>' + publishDate + '</dd>';
    }
    if (version.status.version) {
      content += '<dt>Version</dt><dd>' + version.status.version + '</dd>';
    }
    if (version.status.comments) {
      content += '<dt>Comments</dt><dd>' + version.status.comments + '</dd>';
    }
    return content;
  }
  /**
   * A shortcut function for sending your message to the terminal
   *
   * @param  {String} msg The message to display
   * @param {Boolean} [isError] Is this an error?
   *
   * @return {void}
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function display(msg, isError) {
    var start = (isError) ? 'X Error > ' : '> ';
    if (uwObject.silenceNotification === false) {
      console.log(start + msg);
    }
  }
  /**
   * Prepare the folders for the ufw content.  We remove all folders with a uw prefix
   * in the destinationFolder folder.
   *
   * @return {void}
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function prepareFolder(_callback) {
    display('Preparing the input folder.');
    del([uwObject.destinationFolder + '/uw_*'], function (error) {
      if (error) {
        display('Unable to locate directories to clean up received error: ' + error, true);
      } else {
        _callback();
      }
    });
  }
  /**
   * Iterates over the toc data, and makes an array of the files to download
   *
   * @param  {Array} tocData An array of JSON objects storing all the Bible files
   *
   * @return {Array}         An array of all the files to download
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function getFiles(tocData) {
    var files = [];
    for (var i = 0; i < tocData.length; i++) {
      files.push(tocData[i].src);
    }
    return files;
  }

  /**
   * Find the language data from the language code
   * @param lang_code string
     */
  function getLanguageData(lang_code) {
    var found = uwObject.languageData.filter(function(lang) {
      return lang.lc == lang_code;
    });

    if (found.length == 1) {
        return found[0];
    }

    // not found
    return null;
  }

  /**
   * Iterates over the versions of the Bible in a specific language provided by the catalogUrl, and returns an
   * array of objects with each version.
   *
   * Returned Version Object Structure:
   *
   * {
   *   version_info: {
   *     id:               'uw_en_ulb',
   *     abbr:             'ULB',
   *     name:             'Unlocked Literal Bible',
   *     nameEnglish:      '',
   *     lang:             'eng',
   *     langName:         'English',
   *     langNameEnglish:  'English',
   *     dir:              'ltr',
   *     generator:        'uw_usfm'
   *   },
   *   files: [
   *     'https://api.unfoldingword.org/ulb/txt/1/ulb-en/01-EXD.usfm'
   *   ]
   * }
   *
   * @param  {Array} languages An array of Bible versions available in that language
   *
   * @return {Array}  An array of version objects with all the important data
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function getBibleVersions(languages) {
    var bibleVersions = [];
    var langCode;
    for (var l = 0; l < languages.length; l++) {
      if(languages[l].lc.indexOf('-') > -1) {
        /**
         * Unique languages with a dash in them
         */
        langCode = languages[l].lc.split('-')[0];
      } else {
        langCode = languages[l].lc;
      }

      // get the information for this language
      var languageData = getLanguageData(langCode);
      if (!languageData) {
        display('Error - getBibleVersions, Language not found: ' + langCode, true);
        continue;
      }

      var versions = languages[l].vers;

      for (var i = 0; i < versions.length; i++) {
        var bible = {};
        var version = versions[i];
        var checkingLevel = '';
        if ((version.hasOwnProperty('status')) && (version.status.hasOwnProperty('checking_level'))) {
          checkingLevel = version.status.checking_level;
        }
        bible.about = createAboutFile(version);
        bible.version_info = {
          id:               'uw_' + langCode + '_' + version.slug,
          abbr:             version.slug.toUpperCase(),
          name:             version.name,
          nameEnglish:      '',
          lang:             languageData.lc,
          langName:         languageData.ln,
          langNameEnglish:  languageData.ang,
          dir:              languageData.ld,
          generator:        'unfolding-word/uw-generate-usfm',
          checking_level:   checkingLevel
        };
        bible.files = getFiles(version.toc);
        bibleVersions.push(bible);
      }
    }
    return bibleVersions;
  }
  /**
   * Return this object
   */
  return uwObject;
};
/**
 * Expose the library
 *
 */
uw = new uwGrabAvailableTexts();
exports = module.exports = uw;
