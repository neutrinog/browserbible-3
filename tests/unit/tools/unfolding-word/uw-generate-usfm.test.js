/**
 * Setup test libraries
 *
 */
var chai = require('chai');
var should = chai.should();
var mockery = require('mockery');
var sinon = require('sinon');
var baseInfoJson = {"id":"uw_en_udb","abbr":"UDB","name":"Unlocked Dynamic Bible","nameEnglish":"","lang":"eng","langName":"English","langNameEnglish":"English","dir":"ltr","generator":"uw_usfm"};
var fs = require('fs');
var path = require('path');
/**
 * Extend the String class to have a strip newlines method
 *
 * @return {String} The stripped string
 *
 * @author Johnathan Pulos <johnathan@missionaldigerati.org>
 */
String.prototype.stripNewLines = function() {
  return this.replace(/(\r\n|\n|\r)/gm, '');
};
/**
 * Parser for HTML
 *
 * @type {Object}
 */
var cheerio = require('cheerio');

describe('uwGenerateUsfm', function() {

  var uw;
  var testFilePath;
  var indexerStub;

  before(function() {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });
    testFilePath = path.join(process.cwd(), 'tests', 'support', 'usfm_test_files');
    indexerStub = {
      indexVerse: sinon.stub()
    };
    mockery.registerMock('../verse_indexer', indexerStub);
    uw = require(path.join(process.cwd(), 'tools', 'unfolding-word', 'uw-generate-usfm'));
    uw.outputUnparsedTags = false;
  });

  describe("Function: generate()", function() {

    it("should return an object with the correct keys", function() {
      var inputBasePath = path.join(testFilePath, 'short_books');
      var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
      (result.hasOwnProperty('chapterData')).should.be.equal(true);
      (result.hasOwnProperty('indexData')).should.be.equal(true);
      (result.hasOwnProperty('indexLemmaData')).should.be.equal(true);
      (result.hasOwnProperty('aboutHtml')).should.be.equal(true);
    });

    describe("Info Argument By Reference", function() {

      it("should add all required additional info", function() {
        /**
         * The dbsCodes for the Bible books
         */
        var expectedDivisions = ['JM', 'J3', 'JD'];
        var expectedDivisionNames = ['James', 'John', 'Jude'];
        var expectedDivisionAbbreviations = ['Jas', '3Jn', 'Jude'];
        var expectedSections = ['JM1', 'JM2', 'JM3', 'JM4', 'JM5', 'J31', 'JD1'];
        var inputBasePath = path.join(testFilePath, 'short_books');
        var info = baseInfoJson;
        var result = uw.generate(inputBasePath, info, false, function(){}, function() {});
        info.type.should.equal('bible');
        info.divisions.should.deep.equal(expectedDivisions);
        info.divisionNames.should.deep.equal(expectedDivisionNames);
        info.divisionAbbreviations.should.deep.equal(expectedDivisionAbbreviations);
        info.sections.should.deep.equal(expectedSections);
      });

      it("should use the parsed book info to create an abrreviation if toc3 is not provided", function() {
        var inputBasePath = path.join(testFilePath, 'info_argument', 'no_toc');
        var info = baseInfoJson;
        var result = uw.generate(inputBasePath, info, false, function(){}, function() {});
        info.divisionAbbreviations[0].should.equal('Jam');
      });

      it("should use the parsed book info for the division name by default", function() {
        var inputBasePath = path.join(testFilePath, 'info_argument', 'no_toc');
        var info = baseInfoJson;
        var result = uw.generate(inputBasePath, info, false, function(){}, function() {});
        info.divisionNames[0].should.equal('James');
      });

      it("should use toc1 tag for the division name if it is available", function() {
        var inputBasePath = path.join(testFilePath, 'info_argument', 'toc1_only');
        var info = baseInfoJson;
        var result = uw.generate(inputBasePath, info, false, function(){}, function() {});
        info.divisionNames[0].should.equal('The Epistle of James');
      });

      it("should use toc2 tag over toc1 tag for the division name if it is available", function() {
        var inputBasePath = path.join(testFilePath, 'info_argument', 'toc2');
        var info = baseInfoJson;
        var result = uw.generate(inputBasePath, info, false, function(){}, function() {});
        info.divisionNames[0].should.equal('James');
      });

    });

    describe("Return Data: chapterData", function() {

      it("should return the correct id for each book", function() {
        /**
         * These are the codes for James 1-5, 3 John 1 & Jude 1
         */
        var expected = ['JM1', 'JM2', 'JM3', 'JM4', 'JM5', 'J31', 'JD1'];
        var inputBasePath = path.join(testFilePath, 'short_books');
        var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
        var actual = [];
        result.chapterData.length.should.equal(expected.length);
        for (var i = result.chapterData.length - 1; i >= 0; i--) {
          actual.push(result.chapterData[i].id);
        }
        actual.should.have.all.members(expected);
      });

      it("should return the correct titles for each book", function() {
        var expected = [
          'Jude\'s Letter 1',
          'John\'s Third Letter 1',
          'The Letter from James 5',
          'The Letter from James 4',
          'The Letter from James 3',
          'The Letter from James 2',
          'The Letter from James 1'
        ];
        var inputBasePath = path.join(testFilePath, 'short_books');
        var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
        var actual = [];
        result.chapterData.length.should.equal(expected.length);
        for (var i = result.chapterData.length - 1; i >= 0; i--) {
          actual.push(result.chapterData[i].title);
        }
        actual.should.have.all.members(expected);
      });

      it("should return the correct previd's for the chapter", function() {
        /**
         * These are the id for the chapter previous to the current one based only on the files given.
         * So Hebrews won't be previous since we do not give the Hebrews USFM document
         */
        var expected = [
          'J31',
          'JM5',
          'JM4',
          'JM3',
          'JM2',
          'JM1',
          null
        ];
        var inputBasePath = path.join(testFilePath, 'short_books');
        var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
        var actual = [];
        result.chapterData.length.should.equal(expected.length);
        for (var i = result.chapterData.length - 1; i >= 0; i--) {
          actual.push(result.chapterData[i].previd);
        }
        actual.should.have.all.members(expected);
      });

      it("should return the correct nextid's for the chapter", function() {
        /**
         * These are the id for the chapter following to the current one based only on the files given.
         * So Revelations won't be following since we do not give the Revelations USFM document
         */
        var expected = [
          null,
          'JD1',
          'J31',
          'JM5',
          'JM4',
          'JM3',
          'JM2'
        ];
        var inputBasePath = path.join(testFilePath, 'short_books');
        var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
        var actual = [];
        result.chapterData.length.should.equal(expected.length);
        for (var i = result.chapterData.length - 1; i >= 0; i--) {
          actual.push(result.chapterData[i].nextid);
        }
        actual.should.have.all.members(expected);
      });

      describe("Return Data: chapterData[i].html", function() {

        describe("Wrapping Div Element", function() {

          it("should have the correct classes", function() {
            var inputBasePath = path.join(testFilePath, 'three_verses');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            var wrapper = c('div').first();
            wrapper.hasClass('section').should.equal(true);
            wrapper.hasClass('chapter').should.equal(true);
            wrapper.hasClass('JM').should.equal(true);
            wrapper.hasClass('JM1').should.equal(true);
            wrapper.hasClass('uw_en_udb').should.equal(true);
            wrapper.hasClass('section').should.equal(true);
          });

          it("should have the correct data tags", function() {
            var inputBasePath = path.join(testFilePath, 'short_books');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[1].html);
            var wrapper = c('div').first();
            wrapper.data('id').should.equal('JM2');
            wrapper.data('nextid').should.equal('JM3');
            wrapper.data('previd').should.equal('JM1');
          });

          it("should have the correct language attributes", function() {
            var inputBasePath = path.join(testFilePath, 'three_verses');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            var wrapper = c('div').first();
            wrapper.attr('dir').should.equal('ltr');
            wrapper.attr('lang').should.equal('en');
          });

        });

        describe("Introductions", function() {

          it("should set the correct usfm introductions (p13)", function() {
            var inputBasePath = path.join(testFilePath, 'introductions');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            c('div.is').text().should.equal('The \'is\' heading');
            c('div.ip').text().should.equal('The \'ip\' heading');
            c('div.ili').text().should.equal('The \'ili\' heading');
            c('div.ili1').text().should.equal('The \'ili1\' heading');
            c('div.ili2').text().should.equal('The \'ili2\' heading');
          });

          it("should output introduction tags that are not currently supported", function() {
            var unparsedTags = ['imt', 'imt1', 'ipi', 'im', 'imi', 'ipq', 'imq', 'ipr', 'iq', 'iq1', 'ib', 'iot', 'io', 'io1', 'ior', 'iex', 'iqt', 'imte', 'ie'];
            var inputBasePath = path.join(testFilePath, 'introductions');
            uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            for (var i = unparsedTags.length - 1; i >= 0; i--) {
              (uw.unparsedTags.indexOf(unparsedTags[i]) != -1).should.equal(true);
            }
          });

        });

        describe("Titles, Headings & Labels", function() {

            it("should set the correct default chapter header", function() {
              var expected = '1';
              var inputBasePath = path.join(testFilePath, 'three_verses');
              var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
              result.chapterData.length.should.equal(1);
              result.chapterData[0].html.should.not.equal('');
              var c = cheerio.load(result.chapterData[0].html);
              c('div.c').text().should.be.equal(expected);
            });

            it("should return Psalm 1 header for a Psalms chapter", function() {
              var expected = 'Psalm 1';
              var inputBasePath = path.join(testFilePath, 'psalms');
              var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
              var c = cheerio.load(result.chapterData[0].html);
              c('div.c').text().should.be.equal(expected);
            });

            it("should return Psalm 1 header for a Psalm chapter (no s on the end of the header)", function() {
              var expected = 'Psalm 1';
              var inputBasePath = path.join(testFilePath, 'psalm_no_s');
              var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
              var c = cheerio.load(result.chapterData[0].html);
              c('div.c').text().should.be.equal(expected);
            });

            it("should set the correct usfm titles, headings, and labels (p 21)", function() {
              var inputBasePath = path.join(testFilePath, 'titles_headings_labels');
              var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
              var c = cheerio.load(result.chapterData[0].html);
              c('div.mt').text().should.equal('The \'mt\' title');
              c('div.mt1').text().should.equal('The \'mt1\' title');
              c('div.mt2').text().should.equal('The \'mt2\' title');
              c('div.mt3').text().should.equal('The \'mt3\' title');
              c('div.ms').text().should.equal('The \'ms\' title');
              c('div.d').text().should.equal('The \'d\' title');
              c('div.sp').text().should.equal('The \'sp\' title');
              c('div.sr').text().should.equal('The \'sr\' title');
              c('div.s1').text().should.equal('The \'s1\' title');
              c('div.s2').text().should.equal('The \'s2\' title');
              c('div.r').text().should.equal('The \'r\' title');
            });

            it("should output title, heading, and label tags that are not currently supported", function() {
              var unparsedTags = ['mte', 'mte1', 'rq'];
              var inputBasePath = path.join(testFilePath, 'titles_headings_labels');
              uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
              for (var i = unparsedTags.length - 1; i >= 0; i--) {
                (uw.unparsedTags.indexOf(unparsedTags[i]) != -1).should.equal(true);
              }
            });

          });

        });

        describe("Verses", function() {

          it("should add the verse number and wrap it wuth appropriate classes", function() {
            var inputBasePath = path.join(testFilePath, 'three_verses');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            var firstSpan = c('span').first();
            firstSpan.hasClass('v-num').should.equal(true);
            firstSpan.hasClass('v-1').should.equal(true);
            firstSpan.text().trim().should.equal('1');
          });

          it("should wrap the verse in the appropriate classes", function() {
            var expected = 'I, James, serve God and am bound to God through the Lord Jesus Christ. ' +
              'I am writing this letter to the twelve Jewish tribes who trust in Christ and who are ' +
              'scattered throughout the world. I greet you all.';
            var inputBasePath = path.join(testFilePath, 'three_verses');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            var verseSpan = c('span').first().next();
            verseSpan.hasClass('v').should.equal(true);
            verseSpan.hasClass('JM1_1').should.equal(true);
            verseSpan.data('id').should.equal('JM1_1');
            verseSpan.text().should.equal(expected);
          });

        });

        describe("Notes", function() {

          it("should format footnotes correctly", function() {
            var expected = '<span class="note" id="note-1"><a class="key" href="#footnote-1">1</a>' +
              '<span class="text">Some ancient authorities insert here v. 24 <em>May the grace of ' +
              'our Lord Jesus Christ be with you all. Amen. </em>and omit the like words in v 20.</span></span>';
            var inputBasePath = path.join(testFilePath, 'with_notes');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            var footnote = c('span.RM1_24');
            footnote.html().stripNewLines().should.equal(expected);
          });

        });

        describe("Paragraphs", function() {

          it("should be appropriately formatted when text follows the tag", function() {
            var expected = 'God, whose name is Yahweh, made the heavens and the earth.';
            var inputBasePath = path.join(testFilePath, 'paragraphs');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            var paragraph = c('div.p').first();
            paragraph.text().stripNewLines().should.equal(expected);
          });

          it("should be appropriately formatted when no text follows the tag", function() {
            var inputBasePath = path.join(testFilePath, 'paragraphs');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            var secondParagraph = c('div.p').eq(1);
            secondParagraph.children('span.v').length.should.equal(4);
            secondParagraph.children('span.v').eq(0).hasClass('GN1_5').should.equal(true);
            secondParagraph.children('span.v').eq(1).hasClass('GN1_6').should.equal(true);
            secondParagraph.children('span.v').eq(2).hasClass('GN1_7').should.equal(true);
            secondParagraph.children('span.v').eq(3).hasClass('GN1_8').should.equal(true);
          });
        });

      });

      describe("Text Blocks", function() {

        describe("Indented Paragraphs", function() {

          it("should be appropriately formatted when text follows the tag", function() {
            var expected = 'Altogether, these clans descended from Kohath were allotted thirteen towns.';
            var inputBasePath = path.join(testFilePath, 'text_blocks');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            var indented = c('div.pi').slice(1);
            indented.find('span.v').first().hasClass('R11_60').should.equal(true);
            indented.text().stripNewLines().should.equal(expected);
          });

          it("should be appropriately formatted when no text follows the tag", function() {
            var inputBasePath = path.join(testFilePath, 'text_blocks');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            var indented = c('div.pi').eq(0);
            indented.children('span.v').eq(0).hasClass('R11_57').should.equal(true);
            indented.children('span.v').eq(1).hasClass('R11_58').should.equal(true);
            indented.children('span.v').eq(2).hasClass('R11_59').should.equal(true);
            indented.children('span.v').eq(3).hasClass('R11_60').should.equal(true);
          });

        });

        describe("Chapter Character", function() {

          it("should wrap it with the appropriate element", function() {
            var expected = 'T';
            var inputBasePath = path.join(testFilePath, 'text_blocks');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            c('div.cp').length.should.equal(1);
            c('div.cp').first().text().stripNewLines().should.equal(expected);
          });

        });

        describe("Line Breaks", function() {

          it("should add a div for a line break", function() {
            var inputBasePath = path.join(testFilePath, 'text_blocks');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            c('div.b').length.should.equal(1);
          });

        });

        describe("Quotes", function() {

          it("should wrap it with the appropriate element", function() {
            var expectedQ1 = 'He is my God, and I will praise him.';
            var expectedQ2 = 'He is the one who has saved me.';
            var inputBasePath = path.join(testFilePath, 'text_blocks');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            c('div.q1').length.should.equal(2);
            c('div.q2').length.should.equal(1);
            c('div.q1').slice(1).text().stripNewLines().should.equal(expectedQ1);
            c('div.q2').first().text().stripNewLines().should.equal(expectedQ2);
          });

          it("should wrap quotes with paragraphs", function() {
            var inputBasePath = path.join(testFilePath, 'quotes_in_paragraphs');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            c('div.p').length.should.equal(1);
            c('div.q').length.should.equal(3);
            /**
             * Make sure verse 46 is in the right place
             */
            c('div.p').first().find('span.v-num').first().hasClass('v-46').should.equal(true);
            c('div.p').first().find('span.v').first().hasClass('LK1_46').should.equal(true);
            /**
             * Make sure verse 47 is in the right place
             */
            c('div.q').eq(0).text().stripNewLines().should.equal('"Oh, how I praise the Lord! ');
            c('div.q').eq(1).find('span').length.should.equal(2);
            c('div.q').eq(1).find('span.v-num').first().hasClass('v-47').should.equal(true);
            c('div.q').eq(1).find('span.v').first().hasClass('LK1_47').should.equal(true);
            c('div.q').eq(2).text().stripNewLines().should.equal('who is the one who saves me."');
          });

        });

        describe("List Items", function() {

          it("should wrap list items with the appropriate elements", function() {
            var inputBasePath = path.join(testFilePath, 'list_items');
            var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
            var c = cheerio.load(result.chapterData[0].html);
            /**
             * Make sure verse 1 is in the right place
             */
            c('div.p').first().find('span.v-num').first().hasClass('v-1').should.equal(true);
            c('div.p').first().find('span.v').first().hasClass('GN1_1').should.equal(true);
            /**
             * Check the list items
             */
            c('div.p').first().find('div.li').length.should.equal(2);
            c('div.li').first().text().should.equal('the two sons of Perez: Hezron and Hamul;');
            c('div.li').eq(1).find('span.v-num').first().hasClass('v-2').should.equal(true);
            c('div.li').eq(1).find('span.v').first().hasClass('GN1_2').should.equal(true);
            c('div.li').eq(1).find('span.v').first().text().should.equal('Issachar and his sons Tola, Puah, Jashub, and Shimron;');
          });

        });

      });

      describe("Return Data: indexLemmaData", function() {

        it("should return an empty object by default", function() {
          var inputBasePath = path.join(testFilePath, 'short_books');
          var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
          result.indexLemmaData.should.deep.equal({});
        });

      });

    describe("Return Data: aboutHtml", function() {

      it("should return the about.html content if the file exists", function() {
        var inputBasePath = path.join(testFilePath, 'short_books_with_about');
        var aboutUsFilePath = path.join(inputBasePath, 'about.html');
        var expected = fs.readFileSync(aboutUsFilePath, 'utf8');

        var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
        expected.should.be.equal(result.aboutHtml);
      });

      it("should return an empty string if the file does not exist", function() {
        var inputBasePath = path.join(testFilePath, 'short_books');
        var expected = '';

        var result = uw.generate(inputBasePath, baseInfoJson, false, function(){}, function() {});
        expected.should.be.equal(result.aboutHtml);
      });

    });

    describe("Indexing Verse", function() {

      it("should index the verse", function() {
        var verse1 = 'I, James, serve God and am bound to God through the Lord Jesus Christ. I am writing this letter to the twelve Jewish tribes who trust in Christ and who are scattered throughout the world. I greet you all.';
        var verse2 = 'My fellow believers, consider it something to greatly rejoice over when you experience various kinds of hardships.';
        var verse3 = 'Understand that as you trust God in hardships, they help you to endure even more hardships.';
        var inputBasePath = path.join(testFilePath, 'three_verses');
        var result = uw.generate(inputBasePath, baseInfoJson, true, function(){}, function() {});
        indexerStub.indexVerse.called.should.be.equal(true);
        indexerStub.indexVerse.firstCall.calledWith('JM1_1', verse1).should.be.equal(true);
        indexerStub.indexVerse.secondCall.calledWith('JM1_2', verse2).should.be.equal(true);
        indexerStub.indexVerse.thirdCall.calledWith('JM1_3', verse3).should.be.equal(true);
        indexerStub.indexVerse.calledThrice.should.be.equal(true);
      });

    });

    describe("Bug Fixes", function() {
      /**
       * If you look at John 3:16 on the web site, you will see it ends with "should not perish but" leaving off the rest.
       * I believe the problem is line breaks in the usfm not being rendered correctly. Like html, line breaks in verses
       * that are not part of a \q poetry section should be treated as spaces.
       *
       * @author Johnathan Pulos <johnathan@missionaldigerati.org>
       */
      it("should correctly render John 3 v 16 in the ULB Bible", function() {
        var inputBasePath = path.join(testFilePath, 'john_3_16_ulb_bug');
        var result = uw.generate(inputBasePath, baseInfoJson, true, function(){}, function() {});
        var c = cheerio.load(result.chapterData[0].html);
        var sixteenText = c('span.JN1_16').first().text();
        sixteenText.should.equal('For God so loved the world, that he gave his only unique Son, that whoever believes in him should not perish but have everlasting life.');
      });

    });

  });


  after(function() {
    mockery.disable();
  });
});
