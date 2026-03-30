
(function() {
    require(['app/i18/_'], function(i18) {
        require(['app/_'], function(app) {
            var init;

            init = function() {
                i18.setLanguage();
                app.preloader.showIndicator();

                new app.LevelsEditor();
            };

            if ( app.gameOptions.isLoaded() ) {
                init();
            } else {
                app.gameOptions.addListener('loaded', init);
            }
        });
    });
}());
