/**
 * Include Gulp
 *
 * @type {Object}
 */
var gulp = require('gulp');
/**
 * Include Gulp JSHint
 *
 * @type {Object}
 */
var jshint = require('gulp-jshint');
/**
 * Include Gulp mocha
 *
 * @type {Object}
 */
var mocha  = require('gulp-mocha');
/**
 * The Mocha reporter using node-notify
 *
 * @type {Object}
 */
var notifierReporter = require('mocha-notifier-reporter');
/**
 * The plumber for allowing errors to pass through
 *
 * @type {Object}
 */
var plumber = require('gulp-plumber');
/**
 * Notify the user
 *
 * @type {Object}
 */
var notify = require('gulp-notify');
/**
 * Path library
 *
 * @type {Object}
 */
var path = require('path');
/**
 * Run a Child Process
 *
 * @type {Object}
 */
var exec = require('child_process').exec;
/**
 * The location of the uw grab bibles scripts
 *
 * @type {String}
 */
var grabBiblesScript = path.join('./tools', 'unfolding-word', 'uw-grab-bibles.js');
/**
 * The location of the bible generation script
 *
 * @type {String}
 */
var generateScript = path.join('./tools', 'generate.js');
/**
 * The location of the creating index script
 *
 * @type {String}
 */
var createIndexScript = path.join('./tools', 'create_texts_index.js');
/**
 * An array of files to watch and run lint on
 *
 * @type {Array}
 */
var sources = [
  './gulpfile.js',
  './tools/unfolding-word/**/*.js',
  './tests/**/*.js'
];
/**
 * An array of file locations for the test files to be run
 *
 * @type {Array}
 */
var testSources = ['./tests/**/*.js'];
/**
 * Handle Mocha Errors
 *
 * @param  {Object} err The error object
 *
 * @author Johnathan Pulos <johnathan@missionaldigerati.org>
 */
function handleMochaError(err) {
  console.log(err.toString());
  process.exit(1);
  this.emit('end');
}
function handleLintError(err) {
  console.log(err.toString());
  this.emit('end');
}
/**
 * Offer some helpful hints
 */
gulp.task('help', function() {
  console.log('-----------------------');
  console.log('lint             - Runs jshint on the tests, and all code in the tools/unfolding-word directories.');
  console.log('test             - Runs the mocha tests files in the test directory.');
  console.log('uw:build         - Builds the website by grabbing the latest Bibles, converting them to HTML, and setting them up in the correct directory. (Combines uw:grab-bibles & uw:build-bibles)');
  console.log('uw:grab-bibles   - Grabs the latest Bible from unfoldingWord, and stores them in the input directory.');
  console.log('uw:build-bibles  - Builds all the Bibles in the input directory, and sets them up in the correct directory.');
  console.log('watch            - Watches for code changes in the tests & tools/unfolding-word directories.  Then triggers the lint and test tasks.');
  console.log('-----------------------');
});
/**
 * Build the site
 *
 * @author Johnathan Pulos <johnathan@missionaldigerati.org>
 */
gulp.task('uw:build', function() {
  console.log('Grabbing the latest Bibles from unfoldingWord.');

  executeScript('node ' + grabBiblesScript, function() {
    console.log('All the Bibles have been downloaded.');
    console.log('Building all the available Bibles.');

    executeScript('node ' + generateScript + ' -a', function() {
      console.log('Adding an index for all the Bibles.');

      executeScript('node ' + createIndexScript, function() {
        console.log('The index was created.');
        console.log('The build was completed');
      });
    });
  });
});
/**
 * Grab the current UW Bibles
 *
 * @author Johnathan Pulos <johnathan@missionaldigerati.org>
 */
gulp.task('uw:grab-bibles', function() {
  console.log('Grabbing the latest Bibles from unfoldingWord.');
  executeScript('node ' + grabBiblesScript, function() {
    console.log('All the Bibles have been downloaded.');
  });
});
/**
 * Build the Bibles
 *
 * @author Johnathan Pulos <johnathan@missionaldigerati.org>
 */
gulp.task('uw:build-bibles', function() {
  console.log('Building all the available Bibles.');
  executeScript('node ' + generateScript + ' -a', function() {
    console.log('Adding an index for all the Bibles.');

    executeScript('node ' + createIndexScript, function() {
      console.log('The index was created');
    });
  });
});
/**
 * Add a linting task
 *
 * @author Johnathan Pulos <johnathan@missionaldigerati.org>
 */
gulp.task('lint', function() {
  return gulp
    .src(sources)
    .pipe(plumber())
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .on('error', notify.onError({message: 'Linting Failed!'}))
    .on('error', handleLintError);
});
/**
 * Add a task for running the tests
 *
 * @author Johnathan Pulos <johnathan@missionaldigerati.org>
 */
gulp.task('test', function() {
  return gulp
    .src(testSources)
    .pipe(mocha({reporter: notifierReporter.decorate('spec')}))
    .on('error', handleMochaError);
});
/**
 * Setup the watch task
 */
gulp.task('watch', ['lint', 'test'], function() {
  gulp.watch(sources, function() {
    gulp.run('lint', 'test');
  });
});
/**
 * Run and execute a script
 *
 * @param  {String} the script to run
 * @return {Void}
 * @access private
 */
function executeScript(script, callback) {
  var child = exec(script);
  child.stdout.on('data', function(data) {
      console.log(data);
  });
  child.stderr.on('data', function(data) {
      console.log(data);
  });
  child.on('close', function(code) {
      if (callback) {
        callback();
      }
  });
}
