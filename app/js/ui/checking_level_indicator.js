/**
 * Handle the Checking Level Indicator based on the current translation
 *
 * @param  {Object} container The Jquery object where the indicator is placed
 *
 * @author Johnathan Pulos <johnathan@missionaldigerati.org>
 */
var CheckingLevelIndicator = function(container) {
  /**
   * The returned class object
   *
   * @type {Object}
   * @access private
   */
  var cliObject = {};
  /**
   * The current checking level button
   *
   * @type {Object}
   * @access private
   */
  var checkingLevelButton = null;

  /**
   * Append the checking level indicator
   *
   * @param  {String} checkinglevelClass The class indicating the given checking level
   *
   * @return {void}
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function appendIcon(checkinglevelClass) {
    if (checkingLevelButton !== null) {
      removeCheckingLevelIcon();
    }
    var link = $('<a/>').attr({ 'href': 'https://unfoldingword.org/quality/', 'target': '_blank' });
    var checkingIcon = link.append($('<span/>').addClass('header-icon checking-level-button').addClass(checkinglevelClass));
    container.find('.scroller-header-inner').append(checkingIcon);
    checkingLevelButton = container.find('.checking-level-button');
  }

  /**
   * Remove the checking level indicator
   *
   * @return {void}
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  function removeCheckingLevelIcon() {
    checkingLevelButton.remove();
    checkingLevelButton = null;
  }

  /**
   * Set the appropriate inidicator based on the checking level.  If the checking_level param is set, it will
   * add a class level-{current checking level}.  You need to add css to display the appropriate image.
   *
   * @param  {Object} currentTextInfo The current text info from the info.json file
   *
   * @author Johnathan Pulos <johnathan@missionaldigerati.org>
   */
  cliObject.setIndicator = function(currentTextInfo) {
    if (currentTextInfo.hasOwnProperty('checking_level')) {
      appendIcon('level-'+currentTextInfo.checking_level);
    } else {
      removeCheckingLevelIcon();
    }
  };

  return cliObject;
};
