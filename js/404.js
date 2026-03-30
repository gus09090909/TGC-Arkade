
(function() {
    require(['app/i18/_'], function(i18) {
        require(['app/_'], function(app) {
            var init;

            init = function() {
                app.gameOptions.set('window-games', {game: 'space', showOnStartup: false});
                i18.setLanguage();
                app.preloader.showIndicator();

                new app.Game({
                    splashscreen: '404'
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
