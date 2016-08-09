/**
 * change any config values here
 */
sofia.config = $.extend(sofia.config, {

  enableOnlineSources: true,
  settingsPrefix: 'UW2133903',
  windows: [
    {type: 'bible', data: {textid: 'uw_en_ulb-en', fragmentid: 'GN1_1'}}
  ],
  newBibleWindowVersion: 'uw_en_ulb-en',
  newWindowFragmentid: 'GN1_1',
  logoLinkTo: 'https://unfoldingword.org/'

});

/**
 * add secondary, custom configuration loaded with ?custom=dbs
 *
 * @type {Object}
 */
sofia.customConfigs = {
};
