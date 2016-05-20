/**
 * Setup test libraries
 *
 */
var chai = require('chai');
var should = chai.should();
var mockery = require('mockery');
var sinon = require('sinon');
var uwFeedData = {"cat":[{"langs":[{"lc":"en","mod":"1437687666","vers":[{"mod":"1437687666","name":"Unlocked Dynamic Bible","slug":"udb","status":{"checking_entity":"Wycliffe Associates","checking_level":"3","comments":"Original source text","contributors":"Wycliffe Associates","publish_date":"20150723","source_text":"en","source_text_version":"2.0.0-beta9","version":"2.0.0-beta9"},"toc":[{"desc":"","mod":"1437687666","slug":"gen","src":"https://api.unfoldingword.org/udb/txt/1/udb-en/01-GEN.usfm","src_sig":"https://api.unfoldingword.org/udb/txt/1/udb-en/01-GEN.sig","title":"Genesis"}]},{"mod":"1437687666","name":"Unlocked Literal Bible","slug":"ulb","status":{"checking_entity":"Wycliffe Associates","checking_level":"3","comments":"Original source text","contributors":"Wycliffe Associates","publish_date":"20150723","source_text":"en","source_text_version":"2.0.0-beta9","version":"2.0.0-beta9"},"toc":[{"desc":"","mod":"1437687666","slug":"gen","src":"https://api.unfoldingword.org/ulb/txt/1/ulb-en/01-EXD.usfm","src_sig":"https://api.unfoldingword.org/ulb/txt/1/ulb-en/01-EXD.sig","title":"Genesis"},]}]}],"slug":"bible","title":"Bible"}],"mod":1437687666};
var uwLangData = [{"ln": "English","lc": "en","cc": ["NG"],"ld": "ltr","ang": "English","pk": 1766,"lr": "United States","alt": [],"gw": false}];
var englishData = {iso639_1: 'en',iso639_2: 'eng',iso639_2en: 'eng',iso639_3: 'eng',name: [ 'English' ],nativeName: [ 'English' ],direction: 'LTR'};
var fs = require('fs');
var path = require('path');

describe('uwGrabAvailableTexts', function() {

  var delStub;
  var requestStub;
  var countryLanguageStub;
  var mkdirpStub;
  var fileSystemStub;
  var downloadStub;
  var uw;
  var testFilePath;

  before(function() {
    mockery.enable({
        warnOnReplace: false,
        warnOnUnregistered: false,
        useCleanCache: true
    });
    testFilePath = path.join(process.cwd(), 'tests', 'support');

    delStub = sinon.stub();
    requestStub = sinon.stub();
    mkdirpStub = sinon.stub();
    fileSystemStub = {
      writeFile: sinon.stub()
    };
    exports.Download = function(options) {};
    downloadStub = sinon.stub(exports, 'Download').returns({get: sinon.stub(), dest: sinon.stub(), run: sinon.stub()});

    mockery.registerMock('del', delStub);
    mockery.registerMock('request', requestStub);
    mockery.registerMock('mkdirp', mkdirpStub);
    mockery.registerMock('fs', fileSystemStub);
    mockery.registerMock('download', downloadStub);
    uw = require(path.join(process.cwd(), 'tools', 'unfolding-word', 'uw-grab-available-texts'));
    uw.destinationFolder = path.join(process.cwd(), 'tests', 'support', 'input');
    uw.catalogUrl = 'http://test.com/test';
    uw.silenceNotification = true;
    uw.languageData = uwLangData;
  });

  it("should prepare the input folder by removing the old uw_ directories", function() {
    uw.process();
    delStub.called.should.be.equal(true);
  });

  describe("Function: getBibles()", function() {

    it("should get the latest bibles from the given catalogUrl", function() {
      var fileData1 = fs.readFileSync(path.join(testFilePath, 'files', 'about', 'udb-about.html'),'utf8');
      var fileData2 = fs.readFileSync(path.join(testFilePath, 'files', 'about', 'ulb-about.html'),'utf8');
      var expected = [
        {
          about: fileData1,
          version_info: {
            id:               'uw_en_udb',
            abbr:             'UDB',
            name:             'Unlocked Dynamic Bible',
            nameEnglish:      '',
            lang:             'en',
            langName:         'English',
            langNameEnglish:  'English',
            dir:              'ltr',
            generator:        '../unfolding-word/uw-generate-usfm',
            checking_level:   '3'
          },
          files: [
            'https://api.unfoldingword.org/udb/txt/1/udb-en/01-GEN.usfm'
          ]
        },
        {
          about: fileData2,
          version_info: {
            id:               'uw_en_ulb',
            abbr:             'ULB',
            name:             'Unlocked Literal Bible',
            nameEnglish:      '',
            lang:             'en',
            langName:         'English',
            langNameEnglish:  'English',
            dir:              'ltr',
            generator:        '../unfolding-word/uw-generate-usfm',
            checking_level:   '3'
          },
          files: [
            'https://api.unfoldingword.org/ulb/txt/1/ulb-en/01-EXD.usfm'
          ]
        }
      ];
      requestStub.yields(null, {statusCode: 200}, JSON.stringify(uwFeedData));

      uw.getBibles(function(bibles) {
        bibles.should.be.deep.equal(expected);
      });

      requestStub.called.should.be.equal(true);
    });

  });

  describe("Function downloadBibles()", function() {
    var inputPath;

    beforeEach(function() {
      inputPath = path.join(testFilePath, 'input');
      requestStub.yields(null, {statusCode: 200}, JSON.stringify(uwFeedData));
      uw.getBibles(function(bibles) {
        uw.downloadBibles(bibles);
      });
    });

    it("should create the correct directory for the files", function() {
      mkdirpStub.called.should.be.equal(true);
      mkdirpStub.calledTwice.should.be.equal(true);
      mkdirpStub.firstCall.calledWith(path.join(inputPath, 'uw_en_udb')).should.be.equal(true);
      mkdirpStub.secondCall.calledWith(path.join(inputPath, 'uw_en_ulb')).should.be.equal(true);
    });

    it("should create the info.json files", function() {
      var firstInfoJson = JSON.stringify({id:'uw_en_udb',abbr:'UDB',name:'Unlocked Dynamic Bible',nameEnglish:'',lang:'en',langName:'English',langNameEnglish:'English',dir:'ltr',generator:'../unfolding-word/uw-generate-usfm',checking_level:'3'});
      var secondInfoJson = JSON.stringify({id:'uw_en_ulb',abbr:'ULB',name:'Unlocked Literal Bible',nameEnglish:'',lang:'en',langName:'English',langNameEnglish:'English',dir:'ltr',generator:'../unfolding-word/uw-generate-usfm',checking_level:'3'});
      fileSystemStub.writeFile.called.should.be.equal(true);
      fileSystemStub.writeFile.firstCall.calledWith(path.join(inputPath, 'uw_en_udb', 'info.json'), firstInfoJson).should.be.equal(true);
      fileSystemStub.writeFile.thirdCall.calledWith(path.join(inputPath, 'uw_en_ulb', 'info.json'), secondInfoJson).should.be.equal(true);
    });

    it("should create the about.html files", function() {
      var fileData1 = fs.readFileSync(path.join(testFilePath, 'files', 'about', 'udb-about.html'),'utf8');
      var fileData2 = fs.readFileSync(path.join(testFilePath, 'files', 'about', 'ulb-about.html'),'utf8');
      fileSystemStub.writeFile.called.should.be.equal(true);
      fileSystemStub.writeFile.secondCall.calledWith(path.join(inputPath, 'uw_en_udb', 'about.html'), fileData1).should.be.equal(true);
      fileSystemStub.writeFile.lastCall.calledWith(path.join(inputPath, 'uw_en_ulb', 'about.html'), fileData2).should.be.equal(true);
    });

    it("should download all the files for the Bibles", function() {
      downloadStub.called.should.be.equal(true);
      var download = new downloadStub();
      download.get.called.should.be.equal(true);
      download.get.firstCall.calledWith('https://api.unfoldingword.org/udb/txt/1/udb-en/01-GEN.usfm').should.be.equal(true);
      download.get.secondCall.calledWith('https://api.unfoldingword.org/ulb/txt/1/ulb-en/01-EXD.usfm').should.be.equal(true);
      download.dest.called.should.be.equal(true);
      download.dest.firstCall.calledWith(path.join(inputPath, 'uw_en_udb')).should.be.equal(true);
      download.dest.secondCall.calledWith(path.join(inputPath, 'uw_en_ulb')).should.be.equal(true);
      download.run.called.should.be.equal(true);
    });

  });

  after(function() {
    mockery.deregisterMock('del');
    mockery.deregisterMock('request');
    mockery.deregisterMock('country-language');
    mockery.disable();
  });

});
