/**
 * This script is designed to parse usfm files, and generate the appropriate HTML for each chapter of the books of the Bible.
 * The HTML is based on what is appropriate for this app.  To use this generator, add `unfolding-word/uw-generate-usfm` in the
 *  generator section of your info.json file.
 *
 * @author Johnathan Pulos <johnathan@missionaldigerati.org>
 */
var uwGenerateUsfm = function() {
  /**
   * This classes main object
   *
   * @type {Object}
   * @access private
   */
  var uwObject = {};
  /**
   * Nodejs package filesystem for writing files
   *
   * @type {Object}
   * @access private
   */
  var fileSystem = require('fs');
  /**
   * Nodejs package path for generating correct pathing
   *
   * @type {Object}
   * @access private
   */
  var path = require('path');
  /**
   * A custom NodeJS file for parsing the data in USFM format
   *
   * @type {Object}
   * @access private
   */
  var usfmParser = require('./lib/parsers/usfm-parser.js');
  /**
   * A cusom NodeJS file for parsing Bible data
   *
   * @type {Object}
   * @access private
   */
  var bibleDataParser = require('../data/bible_data');
  /**
   * A custom NodeJS file for formatting Bible data
   *
   * @type {Object}
   * @access private
   */
  var bibleFormatter = require('../bible_formatter');
  /**
   * A custom NodeJS file for indexing a verse
   *
   * @type {Object}
   * @access private
   */
  var verseIndexer = require('../verse_indexer');

  /**
   * The base path to the folder containing the USFM files
   *
   * @type {String}
   * @access private
   */
  var inputBasePath = '';
  /**
   * A JSON object storing the return data for the generate() function
   *
   * @type {Object}
   * @access private
   */
  var bibleData = {};
  /**
   * Is a textBlock currently open?
   *
   * @type {Boolean}
   * @access private
   */
  var textBlockOpen = false;
  /**
   * Is a verseBlock currently open?
   *
   * @type {Boolean}
   * @access private
   */
  var verseBlockOpen = false;
  /**
   * Is a verseBlock currently open?
   *
   * @type {Boolean}
   * @access private
   */
  var footnoteBlockOpen = false;
  /**
   * Is a listItemBlock currently open?
   *
   * @type {Boolean}
   * @access private
   */
  var listItemBlockOpen = false;
  /**
   * The HTML character to use when breaking between elements
   *
   * @type {String}
   * @access public
   */
  uwObject.htmlBreakingElement = '\n';
  /**
   * An array of USFM tags that were not parsed since we do not implement them
   *
   * @type {Array}
   * @access public
   */
  uwObject.unparsedTags = [];
  /**
   * Do you want to output the unparsed tags?
   *
   * @type {Boolean}
   * @access public
   */
  uwObject.outputUnparsedTags = true;
  /**
   * The main method for generating the appropriate HTML for each USFM tag.  This method does the following:
   * 1) Iterates over all the files (Note:: Each file holds one book of the Bible) in inputBasePath that has a .usfm extension
   * 2) Iterates over each line in the file
   * 3) Parses the USFM file and generates the appropriate HTML for each chapter in the book
   * 4) Return an JSON Object with various information about the book including the chapter html
   *
   * In the Chapter data object, each chapter contains the folowing data:
   *
   *  { id: 'RV21',
   *    html: 'HTML FOR THE CHAPTER',
   *    notes: '',
   *    previd: 'RV20',
   *    nextid: 'RV22'
   *  }
   *
   * @param  {String}   inputBasePath   The path to the folder containing the USFM files
   * @param  {Object}   info            The JSON object of information in the info.json file in the inputBasePath (Passed by Reference so we can add additional info)
   * @param  {Boolean}  createIndex     Do you want to create an index of the verses? (See verse_indexer.js)
   * @param  {callback} startProgress   The callback to start the progress bar
   * @param  {callback} updateProgress  The callback for updating the current progress
   *
   * @return {Object}                   A JSON object containing chapterData, indexData, indexLemmaData, and aboutHtml
   * @access public
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  uwObject.generate = function(_inputBasePath, info, createIndex, startProgress, updateProgress) {
    inputBasePath = _inputBasePath;
    /**
     * This is the returned object of this method.
     *
     * @type {Object}
     */
    bibleData = {
      chapterData:    [],
      indexData:      {},
      indexLemmaData: {},
      aboutHtml:      ''
    };
    /**
     * Store all the book codes to add to the info object
     *
     * @type {Array}
     */
    var bookCodes = [];
    /**
     * Store all the names of the books to add to the info object
     *
     * @type {Array}
     */
    var bookNames = [];
    /**
     * Store all the abbreviations of the books to add to the info object
     *
     * @type {Array}
     */
    var bookAbbreviations = [];
    /**
     * Store all the chapter codes of the books to add to the info object
     *
     * @type {Array}
     */
    var chapterCodes = [];
    var usfmFiles = fileSystem.readdirSync(inputBasePath);

    bibleData.aboutHtml = getAboutContent();
    startProgress(usfmFiles.length, 'Books');

    usfmFiles.forEach(function(filename) {
      /**
       * Only work with USFM files
       */
      if (filename.indexOf('.usfm') == -1) {
        return;
      }
      var fileContent = fileSystem.readFileSync(path.join(inputBasePath, filename), 'utf8');
      var lines = fileContent.split('\n');

      /**
       * Set various variables used in the loop
       */
      var currentBook = {
        name:         '',
        abbreviation: '',
        parsedInfo:   {}
      };
      var currentChapter = {
        header: '',
        html:   '',
        id:     '',
        number: 0,
        title:  ''
      };
      var currentVerse = {
        id:       '',
        number:   0,
        text:     ''
      };
      var formattedVerse = '';
      var noteNumber = 1;
      for (var i = 0, il = lines.length; i < il; i++) {
        var line = lines[i];
        var usfmLineData = usfmParser.parseLine(line);
        if (usfmLineData.length === 0) {
          if (line.replace(/\s/g, '').length) {
            /**
             * If the line has text, but there is no usfm tag then it should be added to the current text for the chapter.
             */
            currentChapter.html += ' '+line;
          }
          /**
           * We have no data for the line so move on
           */
          continue;
        }
        /**
         * Iterate over every tag in the line and handle it
         *
         * @author Johnathan Pulos <johnathan@missionaldigerati.org>
         */
        for (var ud = 0; ud < usfmLineData.length; ud++) {
          var usfmData = usfmLineData[ud];
          switch (usfmData.key) {
            case 'b':
              /**
               * Line Break
               */
              currentChapter.html += closeVerseBlock();
              currentChapter.html += closeListItemBlock();
              currentChapter.html += closeTextBlock();
              currentChapter.html += '<div class="b">&nbsp;</div>' + uwObject.htmlBreakingElement;
            break;
            case 'c':
              /**
               * The chapter number is passed in the usfmData.text string
               * ex. { key: 'c', number: '', text: '1' }
               */
              currentChapter.html += closeVerseBlock();
              currentChapter.html += closeListItemBlock();
              currentChapter.html += closeTextBlock();
              currentChapter.number = parseInt(usfmData.number);
              if (currentChapter.number > 1) {
                /**
                 * We have a new chapter, finishe what we started
                 */
                closeChapter(currentChapter);
                currentChapter.title = '';
                currentChapter.id = '';
                currentChapter.html = '';
              }
              currentChapter.title = currentBook.parsedInfo.name + ' ' + currentChapter.number;
              currentChapter.id = bibleFormatter.formatChapterCode(currentBook.parsedInfo.dbsCode, currentChapter.number);
              chapterCodes.push(currentChapter.id);
              currentChapter.html += getChapterHeader(currentChapter);
            break;
            case 'h':
              currentChapter.header = usfmData.text.trim();
            break;
            /**
             * Indentifications
             */
            case 'ide':
              /**
               * We are assuming all files are UTF-8 encoded
               */
            break;
            case 'id':
              var bookId = usfmData.text.split(' ')[0].trim().toUpperCase();
              currentBook.parsedInfo = bibleDataParser.getBookInfoByUsfmCode(bookId);
              /**
               * Set the default book name
               */
              currentBook.name = currentBook.parsedInfo.names.eng[0];
              currentBook.abbreviation = abbreviate(currentBook.name);
            break;
            case 'toc1':
              if (usfmData.text.trim() !== '') {
                currentBook.name = usfmData.text.trim();
              }
            break;
            case 'toc2':
              /**
               * Let's use the smaller name for the book
               */
              if (usfmData.text.trim() !== '') {
                currentBook.name = usfmData.text.trim();
              }
            break;
            case 'toc3':
              if (usfmData.text.trim() !== '') {
                currentBook.abbreviation = usfmData.text.trim();
              }
            break;
            /**
             * Introductions
             */
            case 'is':
            case 'is1':
            case 'ip':
            case 'ili':
            case 'ili1':
            case 'ili2':
            /**
             * Titles, Headings, and Labels
             */
            case 'mt':
            case 'mt1':
            case 'mt2':
            case 'mt3':
            case 'ms':
            case 'd':
            case 'sp':
            case 'sr':
            case 's1':
            case 's2':
            case 'r':
              currentChapter.html += closeVerseBlock();
              currentChapter.html += closeListItemBlock();
              currentChapter.html += closeTextBlock();
              currentChapter.html += '<div class="' + usfmData.key + '">' + usfmData.text + '</div>' + uwObject.htmlBreakingElement;
            break;
            /**
             * Verses
             */
            case 'v':
              currentChapter.html += closeVerseBlock();
              if (createIndex && currentVerse.text !== '' && currentVerse.id !== null) {
                /**
                 * Index the verse
                 */
                verseIndexer.indexVerse(currentVerse.id, currentVerse.text, bibleData.indexData, info.lang);
              }
              currentVerse.text = usfmData.text;
              currentVerse.number = usfmData.number;
              currentVerse.id = bibleFormatter.formatVerseCode(currentBook.parsedInfo.dbsCode, currentChapter.number, currentVerse.number);
              /**
               * Add the formatted verse
               */
              currentChapter.html += bibleFormatter.openVerse(currentVerse.id, currentVerse.number) + currentVerse.text;
              verseBlockOpen = true;
            break;
            /**
             * Paragraphs & Text Blocks
             */
            case 'cp':
            case 'm':
            case 'mi':
            case 'nb':
            case 'p':
            case 'pi':
            case 'q':
            case 'q1':
            case 'q2':
            case 'q3':
              currentChapter.html += closeVerseBlock();
              currentChapter.html += closeTextBlock();
              currentChapter.html += '<div class="' + usfmData.key + '">' + uwObject.htmlBreakingElement;
              if (usfmData.text !== '') {
                /**
                 * Treat the text as a verse, but do not send a verse number to openVerse() so it will not number the paragraph
                 */
                currentChapter.html += bibleFormatter.openVerse(currentVerse.id, null) + usfmData.text + bibleFormatter.closeVerse();
              }
              textBlockOpen = true;
            break;
            /**
             * List items
             */
            case 'li':
            case 'li1':
            case 'li2':
            case 'li3':
              currentChapter.html += closeVerseBlock();
              currentChapter.html += closeListItemBlock();
              currentChapter.html += '<div class="' + usfmData.key + '">' + usfmData.text;
              listItemBlockOpen = true;
            break;
            /**
             * Footnotes & Cross References
             */
            case 'x':
            case 'f':
              currentChapter.html += '<span class="note" id="note-' + noteNumber + '"><a class="key" href="#footnote-' + noteNumber + '">' + noteNumber + '</a><span class="text">' + stripCaller(usfmData.text);
              noteNumber++;
              footnoteBlockOpen = true;
            break;
            case 'fqa':
              currentChapter.html += '<em>' + usfmData.text + '</em>';
            break;
            case 'ft':
              currentChapter.html += usfmData.text;
            break;
            case 'x*':
            case 'f*':
              currentChapter.html += closeFootnoteBlock();
            break;
            /**
             * Words of Jesus
             */
            case 'wj':
              currentChapter.html += '<span class="wj woj">' + usfmData.text;
            break;
            case 'wj*':
              currentChapter.html += '</span>';
            break;
            /**
             * Quotes of Selah
             */
            case 'qs':
              currentChapter.html += '<span class="qs">' + usfmData.text;
            break;
            case 'qs*':
              currentChapter.html += '</span>';
            break;
            /**
             * Name of God
             */
            case 'nd':
              currentChapter.html += '<span class="nog">' + usfmData.text;
            break;
            case 'nd*':
              currentChapter.html += '</span>';
            break;
            default:
              if ((usfmData.key !== '') && (uwObject.unparsedTags.indexOf(usfmData.key) == -1)) {
                uwObject.unparsedTags.push(usfmData.key);
              }
            break;
          }// End Switch
        } // End loop over each tag
      } // End loop over each line
      /**
       * End of iterating over each line of the file
       * Now to clean up what remains
       */
      currentChapter.html += closeFootnoteBlock();
      currentChapter.html += closeVerseBlock();
      if (createIndex && currentVerse.text !== '' && currentVerse.id !== null) {
        /**
         * Index the verse
         */
        verseIndexer.indexVerse(currentVerse.id, currentVerse.text, bibleData.indexData, info.lang);
      }
      currentChapter.html += closeListItemBlock();
      currentChapter.html += closeTextBlock();
      closeChapter(currentChapter);
      currentChapter.title = '';
      currentChapter.id = '';
      currentChapter.html = '';

      bookCodes.push(currentBook.parsedInfo.dbsCode);
      bookNames.push(currentBook.name);
      bookAbbreviations.push(currentBook.abbreviation);
    });
    /**
     * Since info is passed by reference, we will add additional information to the object to be used by the generator
     */
    info.type = 'bible';
    info.divisions = bookCodes;
    info.divisionNames = bookNames;
    info.divisionAbbreviations = bookAbbreviations;
    info.sections = chapterCodes;
    /**
     * Clean Up
     */
    addChapterNavigation();
    wrapChapterHtmlElements(info);
    outputFinalComments();
    /**
     * End of iterating over each file
     */
    /**
     * Return the Bible data
     */
    return bibleData;
  };
  /**
   * Private methods
   */
  /**
   * Check whether there is an about.html file in the inputBasePath, if so return it's contents.
   * If not, then return an empty string.
   *
   * @return {String} An HTML string containing information about the Bible
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function getAboutContent() {
    var aboutPath = path.join(inputBasePath, 'about.html');
    if (fileSystem.existsSync(aboutPath)) {
      return fileSystem.readFileSync(aboutPath, 'utf8');
    }
    return '';
  }
  /**
   * Get the chapter heading based on which book we are looking at
   *
   * @param  {Object} chapter The current chapter object
   *
   * @return {String} The HTML for the chapter heading
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function getChapterHeader(chapter) {
    var content = '';
    /**
     * Using the dbsCode to check if it is psalms
     *
     */
    var psalmChapter = 'PS' + chapter.number.toString();
    /**
     * If we are in Psalms
     */
    if (chapter.id == psalmChapter) {
      content = stripPlural(chapter.header) + ' ';
    }
    content += chapter.number.toString();
    return '<div class="c">' + content + '</div>' + uwObject.htmlBreakingElement;
  }
  /**
   * Closes and stores the chapter data in the bibleData.chapterData object.
   * The chapter object should have the following keys:
   * 1) html    - (String) The HTML content for the chapter
   * 2) id      - (String) A combination of the book and chapter id (ex. JM1)
   * 4) title   - (String) The title of the chapter
   *
   * @param  {Object} chapter   A JSON object with information on the chapter to close
   *
   * @return {void}
   * @throws {Error} If bibleData is missing the chapterData property
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function closeChapter(chapter) {
    var chapterData = {
      id:     chapter.id,
      title:  chapter.title,
      html:   chapter.html
    };
    if (bibleData.hasOwnProperty('chapterData')) {
      bibleData.chapterData.push(chapterData);
    } else {
      throw new Error('bibleData is missing the property chapterData');
    }
  }
  /**
   * Checks if a text block is open, and returns the correct HTML to close it
   *
   * @return {String} The HTML to close the block or an empty string
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function closeTextBlock() {
    if (textBlockOpen) {
      textBlockOpen = false;
      return '</div>' + uwObject.htmlBreakingElement;
    }
    return '';
  }
  /**
   * Checks if a verse block is open, and returns the correct HTML to close it
   *
   * @return {String} The HTML to close the block or an empty string
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function closeVerseBlock() {
    if (verseBlockOpen) {
      verseBlockOpen = false;
      return bibleFormatter.closeVerse();
    }
    return '';
  }
  /**
   * Checks if a footnote block is open, and returns the correct HTML to close it
   *
   * @return {String} The HTML to close the block or an empty string
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function closeFootnoteBlock() {
    if (footnoteBlockOpen) {
      footnoteBlockOpen = false;
      return '</span></span>';
    }
    return '';
  }
  /**
   * Checks if a list item block is open, and returns the correct HTML to close it
   *
   * @return {String} The HTML to close the block or an empty string
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function closeListItemBlock() {
    if (listItemBlockOpen) {
      listItemBlockOpen = false;
      return '</div>' + uwObject.htmlBreakingElement;
    }
    return '';
  }
  /**
   * Add the prevId & nextId navigation based on the final chapter data. Warning!  This is
   * assuming the files are read in book order!  Therefore, filenames should start with the
   * number order.
   *
   * @return {void}
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function addChapterNavigation() {
    for (var i = 0, il = bibleData.chapterData.length; i < il; i++) {
      /**
       * If it is the first book, then it has no previd
       */
      bibleData.chapterData[i].previd = (i === 0) ? null : bibleData.chapterData[i - 1].id;
      /**
       * If it is the last book, then it has no nextid
       */
      bibleData.chapterData[i].nextid = (i == il - 1) ? null : bibleData.chapterData[i + 1].id;
    }
  }
  /**
   * Wrap all the chapter html with the correct formatting to fit the app
   *
   * @param  {Object}   info            The JSON object of information in the info.json file in the inputBasePath
   *
   * @return {void}
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function wrapChapterHtmlElements(info) {
    for (var i = 0, il = bibleData.chapterData.length; i < il; i++) {
      var chapter = bibleData.chapterData[i];
      chapter.html = bibleFormatter.openChapter(info, chapter) + chapter.html + bibleFormatter.closeChapter();
    }
  }
  /**
   * Output to the console any final comments
   *
   * @return {void}
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function outputFinalComments() {
    if (uwObject.outputUnparsedTags === true) {
      console.log('Unparsed USFM Tags: [ ' + uwObject.unparsedTags.join(',') + ' ]');
    }
  }
  /**
   * Utility Function: If the word ends in s, it will strip off the s
   *
   * @param  {String} text The string to depluralize
   *
   * @return {String}      The modified string
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function stripPlural(text) {
    if (text.substring(text.length - 1) == 's') {
      return text.substring(0, text.length - 1);
    }
    return text;
  }
  /**
   * Strip off the caller for the individual USFM tag (ie. \f uses a +, -, or ?)
   *
   * @param  {String} text The text to remove the caller from
   *
   * @return {String}      The cleaned string
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function stripCaller(text) {
    var firstSpace = text.indexOf(' ');
    return text.substring(firstSpace + 1);
  }
  /**
   * Utility Function: Takes a string and creates a 3 letter abbreviation
   *
   * @param  {String} text The string to abbreviate
   *
   * @return {String}      The final abbreviation
   * @access private
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function abbreviate(text) {
    return text.replace(/\s/gi, '').substring(0, 3);
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
uw = new uwGenerateUsfm();
exports = module.exports = uw;
