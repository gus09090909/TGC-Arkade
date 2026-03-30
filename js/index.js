
(function() {
    require(['app/i18/_', 'app/core/_'], function(i18, core) {
        require(['app/_'], function(app) {
            var options = {},
                regExpEpisode = /#?episode-([a-z0-9\-]+)/,
                isChromeApp = core.helperApp.platform() == 'chrome',
                episode,
                init;

            init = function() {
                i18.setLanguage();
                if ( location.hash.match(regExpEpisode) ) {
                    episode = location.hash.match(regExpEpisode)[1];
                    location.hash = '';

                    if ( EPISODES.indexOf(episode) !== -1 ) {
                        app.gameOptions.set('window-games', {game: episode});
                    }
                }
                require(['app/tgc-welcome', 'app/tgc-profile', 'app/tgc-achievements', 'app/levels', 'app/tgc-cloud'], function(tgcWelcome, tgcProfile, tgcAchievements, levels, tgcCloud) {
                    if ( !tgcCloud.enabled() ) {
                        tgcWelcome.ensureUsername();
                        return;
                    }
                    tgcWelcome.ensureUsername(function() {
                        var ctx = {levelCount: levels.getLevelsLength()};
                        tgcAchievements.evaluate(tgcProfile.get(), ctx, function(def) {
                            tgcAchievements.notifyUnlock(def);
                        });
                        tgcProfile.persist();
                        tgcProfile.schedulePush();

                        app.preloader.showIndicator();

                        if ( core.storageGlobal.get('level') ) {
                            options.customLevel = core.storageGlobal.get('level');
                        }
                        new app.Game(options);

                        if ( !app.gameOptions.get('window-options:cookieInfo') ) {
                            $([
                                '<div id="cookie">',
                                    i18._(isChromeApp ? 'usage-data-info' : 'cookie-info'),
                                '</div>'
                            ].join('')).appendTo(document.body).find('.btn').on('click', function(event) {
                                event.preventDefault();

                                app.gameOptions.set('window-options', {cookieInfo: true});
                                $(event.target).parents('#cookie').remove();
                            });
                        }
                        $('.fork-me').show();
                    });
                });
            };

            if ( app.gameOptions.isLoaded() ) {
                init();
            } else {
                app.gameOptions.addListener('loaded', init);
            }
        });
    });
}());