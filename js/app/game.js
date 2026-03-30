
define('app/game', 
[
    'app/stage', 
    'app/entities/_', 'app/entity/_',
    'app/dashboard', 'app/player', 'app/core/_', 'app/indicator', 'app/preloader', 'app/i18/_', 'app/sound',
    'app/levels', 'app/input/_', 'app/facade',
    'app/window/_',
    'app/game-options', 'app/episodes/_',
    'app/tgc-profile', 'app/tgc-achievements', 'app/tgc-session', 'app/tgc-cloud'
], 
function(stage, 
        entities, entity,
        dashboard, player, core, indicator, preloader, i18, sound, 
        levels, input, facade, _window, gameOptions, episode,
        tgcProfile, tgcAchievements, tgcSession, tgcCloud) {
            
    var 
        /**
         * @property _options
         * @static
         * @private
         * @type {Object}
         */
        _options = {
            splashscreen: false,
            customLevel: null
        };
            

    function Game(options) {
        // na mobile off
        document.onmousedown = function() { return false; };
        
        core.helperFont.injectDefault();
        this.options = options || _options;
        this.isGameStarted = false;
        this.isGameLoaded = false;
        this._roundClearUiScheduled = false;
        this._mobileLayoutRetryScheduled = false;
        this.episodeLevel = 0;
        tgcSession.setSessionActive(false);
        
        if ( this.options.splashscreen ) {
            dashboard.disabled(true);
        }
        if ( this.options.customLevel ) {
            episode.use(this.options.customLevel.split(':')[0]).lock(true);
        }
        this.applyI18();
        preloader.load();
        
        // auth window disabled in this build
        this.windowGames = new _window.Games();
        this.windowHelp = new _window.Help();
        this.windowOptions = new _window.Options();
        this.windowOrientationIndicator = new _window.OrientationIndicator();
        this.windowRounds = new _window.Rounds();
        this.windowRoundWin = new _window.RoundWin();
        this.windowProfile = new _window.Profile();
        
        this.onWindowResize();
        this.onWindowOrientationChange();
        this.initEvents();
    }
    
    /**
     * @method initEvents
     */
    Game.prototype.initEvents = function() {
        var w = $(window), d = $(document);
        
        w.bind('resize', $.proxy(this.onWindowResize, this));
        w.bind('orientationchange', $.proxy(this.onWindowOrientationChange, this));
        if ( window.visualViewport ) {
            window.visualViewport.addEventListener('resize', $.proxy(this.onWindowResize, this), { passive: true });
        }
        w.on('pageshow', $.proxy(function(ev) {
            if ( ev.originalEvent && ev.originalEvent.persisted ) {
                this.onWindowResize();
            }
        }, this));
        
        if ( window === window.top && core.helperApp.platform() != 'wp8' ) {
            w.bind('focus', $.proxy(this.onWindowFocus, this));
            w.bind('blur', $.proxy(this.onWindowBlur, this));
            d.bind('webkitvisibilitychange', $.proxy(this.onWindowVisibilityChange, this));
            d.bind('webkitvisibilitychange', $.proxy(this.onWindowVisibilityChange, this));
        }
        $('#' + stage.stage.canvas.id).bind('click', $.proxy(this.onStageClick, this));
        this.windowGames.addListener('selectEpisode', $.proxy(this.onWindowGamesSelectEpisode, this));
        this.windowRounds.addListener('back', $.proxy(this.onWindowRoundsBack, this));
        this.windowRounds.addListener('play', $.proxy(this.onWindowRoundsPlayGame, this));
        this.windowRoundWin.addListener('goToEpisodes', $.proxy(this.onWindowStatsGoToEpisodes, this));
        this.windowRoundWin.addListener('goToRounds', $.proxy(this.onWindowGamesSelectEpisode, this));
        this.windowRoundWin.addListener('nextRound', $.proxy(this.onWindowGamesSelectEpisode, this));
        core.mediator.addListener('game:game-over', $.proxy(this.onGameOver, this));
        core.mediator.addListener('game:stage-clear', $.proxy(this.onGameClearStage, this));
        dashboard.addListener('clickHelp', $.proxy(this.onBtnHelpClick, this));
        dashboard.addListener('clickOptions', $.proxy(this.onBtnOptionsClick, this));
        dashboard.addListener('clickPlay', $.proxy(this.onBtnStartGameClick, this));
        dashboard.addListener('clickUser', $.proxy(this.onBtnUserClick, this));
        gameOptions.addListener('change:window-games', $.proxy(this.onEpisodeChange, this));
        player.addListener('logout', $.proxy(this.onPlayerLogout, this));
        player.addListener('register', $.proxy(this.onPlayerRegister, this));
        player.addListener('login', $.proxy(this.onPlayerLogin, this));
        preloader.addListener('complete', $.proxy(this.onPreloaderComplete, this));
    };
    
    /**
     * @method applyI18
     */
    Game.prototype.applyI18 = function() {
        $('#a-level-editor').text(i18._('le-header'));
    };
    
    /**
     * @method update
     * @param {Object} event
     */
    Game.prototype.update = function(event) {
        if ( event.paused ) {
            return;
        }
        if ( !this.isGameStarted ) {
            entities.paddles.hide();
        } else if ( !event.paused ) {
            var d = event.delta;
            if ( !d || d < 0 ) {
                d = Math.round(1000 / Math.max(1, createjs.Ticker.getFPS()));
            }
            tgcProfile.addPlayTimeMs(d);
        }
        entities.paddles.update(event);
        levels.getBonuses().update(event);
        entities.balls.update(event);
        entities.scores.update(event);
        entities.clouds.update(event);
        entities.blocks.update(event);
        stage.update(event);
    };
    
    /**
     * @method startGame
     * @param {String} episode
     * @param {Number} level
     */
    Game.prototype.startNewGame = function(episode, level) {
        this._roundClearUiScheduled = false;
        sound.resetSettings();
        $('#a-game-canvas').addClass('a-playing');
        this.clearStage();
        levels.loadLevel(level).build();
        entities.balls.create().setAlive(false);
        entities.paddles.create();

        this.isGameStarted = true;
        core.mediator.emit('game:game-start');
        dashboard.getTime().reset();
        dashboard.getScore().resetSession();
        dashboard.getSpeed().reset();
        dashboard.getLives().reset();
        
        if ( levels.isCustom() ) {
            dashboard.getRound().setMax(1).set(1);
        } else {
            dashboard.getRound().setMax(levels.getLevelsLength()).set(levels.getCurrentLevelIndex() + 1);
            facade.clear().show(i18._('round') + ' ' + (levels.getCurrentLevelIndex() + 1) 
                    + '\n(' + levels.getCurrentLevelName() + ')');
        }
        dashboard.getTime().start();
        sound.stopMusic();
        input.pointer.updateStageCoords();
        this._enterPlayPresentation();
    };
    
    /**
     * @method startLevelGame
     * @param {Number} level
     */
    Game.prototype.startLevelGame = function(level) {
        this._roundClearUiScheduled = false;
        this.clearStage();
        levels.loadLevel(level).build();
        entities.balls.create();
        entities.paddles.create();
        $('#a-game-canvas').addClass('a-playing');
        this.isGameStarted = true;
        dashboard.getTime().reset();
        dashboard.getScore().reset();
        dashboard.getSpeed().reset();
        dashboard.getRound().set(levels.getCurrentLevelIndex() + 1);
        dashboard.getTime().start();
        
        if ( !levels.isCustom() ) {
            facade.clear().show(i18._('round') + ' ' + (levels.getCurrentLevelIndex() + 1)
                    + '\n(' + levels.getCurrentLevelName() + ')');
        }
        core.mediator.emit('game:level-start', levels.getCurrentLevelIndex() + 1);
        sound.stopMusic();
        input.pointer.updateStageCoords();
        this._enterPlayPresentation();
    };

    /**
     * Fullscreen + pointer lock on desktop while a level is active (user-gesture chain from Play).
     */
    Game.prototype._enterPlayPresentation = function() {
        if ( this.options.splashscreen || this.options.customLevel || core.helperBrowser.isMobile ) {
            return;
        }
        var shell = document.getElementById('a-container');
        var canvas = document.getElementById('a-game-canvas');
        var hf = core.helperFullscreen;
        var tryLock = function() {
            if ( hf.isPointerLockSupport() && canvas ) {
                $.when(hf.requestPointerLock(canvas));
            }
        };
        if ( hf.isSupport() && shell ) {
            $.when(hf.request(shell)).always(tryLock);
        } else {
            tryLock();
        }
    };

    Game.prototype._exitPlayPresentation = function() {
        try {
            core.helperFullscreen.exitPointerLock();
            core.helperFullscreen.exit();
        } catch (e) {}
    };
        
    /**
     * @method gameOver
     */
    Game.prototype.gameOver = function() {
        if ( !this.isGameLoaded ) {
            return;
        }
        this._exitPlayPresentation();
        $('#a-game-canvas').removeClass('a-playing');
        this.isGameStarted = false;
        dashboard.getTime().stop();
        entities.balls.destroy();
        facade.clear().show(i18._('game-over'), {autohide: false});
        sound.playMusic();
    };
        
    /**
     * @method splashScreen
     */
    Game.prototype.splashScreen = function() {
        sound.disableSounds(true);
        this.clearStage();
        levels.loadSplashScreen(this.options.splashscreen).build();
        entities.balls.create().setAlive(true).setSpeed(core.helperApp.pixelRatio(), Math.random() * Math.PI / 2 + Math.PI).bounceBottom(true);
        entities.balls.create().setAlive(true).setSpeed(core.helperApp.pixelRatio(), Math.random() * Math.PI).bounceBottom(true);
        entities.paddles.create();
        
        if ( !this.options.splashscreen ) {
            facade.clear().show(i18._('splash-screen-welcome-text'), {autohide: false});
        }
    };
        
    /**
     * @method clearStage
     */
    Game.prototype.clearStage = function() {
        entities.balls.destroy();
        entities.paddles.destroy();
        levels.destroy();
        facade.clear();
        stage.clear();
    };

    /**
     * @method onGameOver
     */
    Game.prototype.onGameOver = function() {
        var _this = this;
        tgcProfile.flushPlayBuffer();
        var total = dashboard.getScore().get();
        var u = tgcProfile.getUsername();
        if ( this.isGameStarted && u && tgcCloud.enabled() ) {
            tgcCloud.sessionEnd(u, total, function(resp) {
                if ( resp && resp.profile ) {
                    tgcProfile.mergeProfileAfterSessionEnd(resp.profile);
                }
                _this._syncTgcAchievements();
                core.mediator.emit('tgc:leaderboard-dirty');
            });
        } else if ( this.isGameStarted ) {
            this._syncTgcAchievements();
        }
        dashboard.getScore().resetSession();
        tgcSession.setSessionActive(false);
        tgcSession.resetPlayed();
        this.gameOver();
    };

    /**
     * @method onGameClearStage
     */
    Game.prototype.onGameClearStage = function() {
        if ( this.options.splashscreen ) {
            return;
        }
        if ( this._roundClearUiScheduled ) {
            return;
        }
        this._roundClearUiScheduled = true;
        if ( dashboard.getTime().timer ) {
            dashboard.getTime().stop();
        }
        facade.clear().show(i18._('round-well-done'), {autohide: false});
        
        setTimeout(function() {
            entities.balls.destroy();
            entities.paddles.destroy();
        }, 0);
        setTimeout($.proxy(function() {
            if ( this.windowRoundWin.isOpened() ) {
                return;
            }
            this._exitPlayPresentation();
            var roundIdx = levels.getCurrentLevelIndex() + 1;
            var levZero = levels.getCurrentLevelIndex();
            var timeSec = dashboard.getTime().get();
            var livesLeft = dashboard.getLives().get();
            var scoreVal = dashboard.getScore().get();
            var levelScore = dashboard.getScore().getLevelScore();
            if ( !levels.isCustom() ) {
                tgcProfile.flushPlayBuffer();
                dashboard.getScore().commitLevelToSession();
                tgcProfile.applyLevelWin(levZero, levelScore, timeSec, livesLeft, levels.getLevelsLength(), scoreVal);
                this._syncTgcAchievements();
            }
            this.windowRoundWin.open({
                isCustom: levels.isCustom(),
                episode: episode.getName(),
                round: roundIdx,
                maxRound: levels.getLevelsLength(),
                time: timeSec, 
                lives: livesLeft,
                score: scoreVal
            });
            sound.play('win');
        }, this), 2000);
    };
    
    /**
     * @method onStageClick
     * @param {Object} event
     */
    Game.prototype.onStageClick = function(event) {
        if ( this.isGameStarted || this.options.splashscreen || this.options.customLevel ) {
            return;
        }
        this.windowRounds.open({
            game: episode.getName(),
            levels: levels.getLevelNames()
        });
    };
    
    /**
     * @method onEpisodeChange
     * @param {Object} currentOptions
     * @param {Object} prevOptions
     */
    Game.prototype.onEpisodeChange = function(currentOptions, prevOptions) {
        if ( currentOptions.game != prevOptions.game ) {
            sound.stopMusic(true);
            dashboard.hide();
            preloader.load();
        }
    };
        
    /**
     * @method onPlayerLogin
     * @param {Object} event
     */
    Game.prototype.onPlayerLogin = function(event) {
        if ( event.result == 'ok' ) {
            dashboard.getAuth().login(event.response);
            indicator.hide();
        } else {
            if ( !event.silentMode ) {
                dashboard.getAuth().logout();
            }
            indicator.hide();
        }
    };
    
    /**
     * @method onPlayerLogout
     */
    Game.prototype.onPlayerLogout = function() {
        indicator.hide();
    };
    
    /**
     * @method onPlayerRegister
     * @param {Object} event
     */
    Game.prototype.onPlayerRegister = function(event) {
        if ( event.result == 'ok' ) {
            dashboard.getAuth().login(event.response);
            indicator.hide();
        } else {
            if ( !event.silentMode ) {
                dashboard.getAuth().logout();
            }
            indicator.hide();
        }
    };
    
    /**
     * @method onBtnStartGameClick
     * @param {event} event
     */
    Game.prototype.onBtnStartGameClick = function(event) {
        if ( event ) {
            event.preventDefault();
        }
        if ( this.options.customLevel ) {
            this.windowGames.open({
                isCustom: true,
                game: episode.getName()
            });
        } else {
            this.windowRounds.open({
                game: episode.getName(),
                levels: levels.getLevelNames()
            });   
        }
    };

    /**
     * @method onBtnOptionsClick
     * @param {event} event
     */
    Game.prototype.onBtnOptionsClick = function(event) {
        if ( event ) {
            event.preventDefault();
        }
        this.windowOptions.open();
    };

    /**
     * @method onBtnHelpClick
     * @param {event} event
     */
    Game.prototype.onBtnHelpClick = function(event) {
        if ( event ) {
            event.preventDefault();
        }
        this.windowHelp.open();
    };

    /**
     * @method onBtnUserClick
     * @param {event} event
     */
    Game.prototype.onBtnUserClick = function(event) {
        if ( event ) {
            event.preventDefault();
        }
        this.windowProfile.open();
    };

    /**
     * @method _syncTgcAchievements
     */
    Game.prototype._syncTgcAchievements = function() {
        var ctx = {levelCount: levels.getLevelsLength()};
        var d = tgcProfile.get();
        tgcAchievements.evaluate(d, ctx, function(def) {
            tgcAchievements.notifyUnlock(def);
        });
        tgcProfile.persist();
        tgcProfile.schedulePush();
    };
    
    // WindowStatsWin
    /**
     * @method onWindowStatsGoToEpisodes
     */
    Game.prototype.onWindowStatsGoToEpisodes = function() {
        if ( this.options.customLevel ) {
            this.windowGames.open({
                isCustom: true,
                game: episode.getName()
            });
        } else {
            this.windowGames.open();   
        }
    };
    
    // WindowRounds
    /**
     * @method onWindowRoundsBack
     */
    Game.prototype.onWindowRoundsBack = function() {
        this.windowGames.open();
    };
    
    /**
     * @method onWindowRoundsPlayGame
     * @param {Object} event
     */
    Game.prototype.onWindowRoundsPlayGame = function(event) {
        var lev = event.level >> 0;
        if ( !tgcSession.isSessionActive() ) {
            tgcSession.resetPlayed();
            tgcSession.markPlayed(lev);
            tgcSession.setSessionActive(true);
            this.startNewGame(event.episode, lev);
        } else {
            tgcSession.markPlayed(lev);
            this.startLevelGame(lev);
        }
    };

    // WindowGames
    /**
     * @method onWindowGamesSelectEpisode
     */
    Game.prototype.onWindowGamesSelectEpisode = function() {
        this.windowRounds.open({
            game: episode.getName(),
            levels: levels.getLevelNames()
        });
    };

    /**
     * @method onPreloaderComplete
     */
    Game.prototype.onPreloaderComplete = function() {
        $('#a-container').css('visibility', 'visible');
        $(document.body).css('backgroundImage', 'url("' + preloader.get('h-bg').src + '")')
                .attr('id', gameOptions.get('window-games:game'));
        $(document.body)
                .addClass('platform-' + core.helperBrowser.platform.name)
                .addClass('browser-' + core.helperBrowser.name)
                .addClass('app-' + core.helperApp.platform());
        facade.setOptions(episode.getManifest().facade);
        core.mediator.emit('game:game-over');
        this.clearStage();

        // TODO: For now we can only support episode 'space' for retina devices (like ipad, iphone and MacbookPro Retina)
        if ( core.helperApp.pixelRatio() >= 2 ) {
            EPISODES = ['space'];
        }
        // TODO: tmp
        if ( gameOptions.get('window-games:game') == 'space' ) {
            $('#a-game-bottom-line').css('backgroundImage', 'url("' + preloader.get('h-bottom-line').src + '")');
        }
        if ( this.options.splashscreen ) {
            createjs.Ticker.setFPS(gameOptions.get('fps'));
            this.splashScreen();

        } else if ( this.options.customLevel ) {
            if ( !this.isGameLoaded ) {
                player.silentLogin();
                createjs.Ticker.setFPS(gameOptions.get('fps'));
            }
            this.startNewGame(this.options.customLevel.split(':')[0], 'custom:' + this.options.customLevel.split(':')[1]);

        } else {
            if ( location.hash == '#contact' ) {
                location.hash = '';
                this.windowHelp.open();
                this.windowHelp.tab.changeTab(1);

            } else if ( gameOptions.get('window-games').showOnStartup && !this.isGameLoaded && EPISODES.length > 1 ) {
                this.windowGames.open();

            } else if ( this.isGameLoaded ) {
                if ( this.windowGames.isOpened() ) {
                    this.windowGames.close();
                    this.windowRounds.open({
                        game: episode.getName(),
                        levels: levels.getLevelNames()
                    });
                }
            }
            if ( !this.isGameLoaded ) {
                player.silentLogin();
                createjs.Ticker.setFPS(gameOptions.get('fps'));
            }
            if ( episode.getManifest().splashscreen && !core.helperBrowser.isMobile ) {
                this.splashScreen();

            } else {
                entities.paddles.create();
                facade.clear().show(i18._('splash-screen-welcome-text'), {autohide: false});                        
            }
            dashboard.getRound().setMax(levels.getLevelsLength());
            sound.playMusic();
        }
        if ( !createjs.Ticker.hasEventListener('tick') ) {
            var _this = this;
            
            createjs.Ticker.addEventListener('tick', function(event) {
                _this.update(event);
            });
        }
        this.isGameLoaded = true;
        var layoutThis = this;
        function runMobileLayout() {
            layoutThis.applyMobileLayoutScale();
            input.pointer.updateStageCoords();
        }
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                runMobileLayout();
                [120, 400, 1200].forEach(function(ms) {
                    setTimeout(runMobileLayout, ms);
                });
            });
        });
    };
    
    /**
     * @method onWindowFocus
     */
    Game.prototype.onWindowFocus = function() {
        createjs.Ticker.setPaused(false);
        
        if ( !this.isGameStarted ) {
            sound.playMusic();
        }
    };
    
    /**
     * @method onWindowBlur
     */
    Game.prototype.onWindowBlur = function() {
        tgcProfile.flushPlayBuffer();
        createjs.Ticker.setPaused(true);
        sound.stopMusic(true);
    };
    
    /**
     * @method onWindowVisibilityChange
     */
    Game.prototype.onWindowVisibilityChange = function() {
        if ( document.webkitHidden ) {
            createjs.Ticker.setPaused(true);
            sound.stopMusic(true);
        } else {
            createjs.Ticker.setPaused(false);
            
            if ( !this.isGameStarted ) {
                sound.playMusic();
            }
        }
    };
    
    /**
     * @method onWindowResize
     */
    Game.prototype.onWindowResize = function() {
        $(document.body).css('height', window.innerHeight + 'px');
        $(document.body).css('width', window.innerWidth + 'px');
        this.applyMobileLayoutScale();
        input.pointer.updateStageCoords();
        window.scrollTo(0, 0);
    };

    /**
     * Usable area in CSS px (Visual Viewport API when available — fixes iOS/Android URL bar).
     */
    Game.prototype._layoutViewportSize = function() {
        var pad = 12;
        var vv = window.visualViewport;
        if ( vv && vv.width > 0 && vv.height > 0 ) {
            return {
                w: Math.max(0, vv.width - pad * 2),
                h: Math.max(0, vv.height - pad * 2)
            };
        }
        return {
            w: Math.max(0, window.innerWidth - pad * 2),
            h: Math.max(0, window.innerHeight - pad * 2)
        };
    };

    /**
     * Space index: keep desktop-sized DOM (798px) and scale the whole block to fit the viewport
     * (“mini PC”). Uses a viewport wrapper so layout width/height match the scaled footprint.
     * @method applyMobileLayoutScale
     */
    Game.prototype.applyMobileLayoutScale = function() {
        var body = $(document.body),
            isSpaceIndex = body.attr('id') === 'space' && body.hasClass('class-index-page'),
            narrow = (window.innerWidth <= 1080) ||
                (window.matchMedia && window.matchMedia('(max-width: 1080px)').matches),
            $wrap = $('#a-game-wrapper'),
            $vp;

        if ( !$wrap.length ) {
            return;
        }

        $vp = $wrap.parent();

        if ( !isSpaceIndex || !narrow ) {
            if ( $vp.length && $vp[0].id === 'a-mobile-scale-viewport' ) {
                $wrap.css({
                    position: '',
                    top: '',
                    left: '',
                    marginLeft: '',
                    width: '',
                    transform: '',
                    webkitTransform: '',
                    transformOrigin: '',
                    webkitTransformOrigin: ''
                });
                $vp.css({
                    position: '',
                    width: '',
                    height: '',
                    marginLeft: '',
                    marginRight: '',
                    flexShrink: '',
                    overflow: ''
                });
                $wrap.unwrap();
            }
            return;
        }

        if ( $vp[0].id !== 'a-mobile-scale-viewport' ) {
            $wrap.wrap('<div id="a-mobile-scale-viewport"></div>');
            $vp = $wrap.parent();
        }

        $vp.css({ width: 'auto', height: 'auto', overflow: 'visible' });
        $wrap.css({
            position: 'relative',
            top: '',
            left: '',
            marginLeft: '',
            transform: 'none',
            webkitTransform: 'none',
            transformOrigin: '',
            webkitTransformOrigin: ''
        });

        var natW = $wrap.outerWidth(),
            natH = $wrap.outerHeight(true),
            vp = this._layoutViewportSize(),
            vw = vp.w,
            vh = vp.h,
            s;

        if ( (natW < 10 || natH < 10) && !this._mobileLayoutRetryScheduled ) {
            this._mobileLayoutRetryScheduled = true;
            var self = this;
            setTimeout(function() {
                self._mobileLayoutRetryScheduled = false;
                self.applyMobileLayoutScale();
            }, 150);
            return;
        }

        s = Math.min(vw / natW, vh / natH, 1);

        if ( s < 0.08 || !isFinite(s) ) {
            s = 0.08;
        }

        $vp.css({
            position: 'relative',
            width: (natW * s) + 'px',
            height: (natH * s) + 'px',
            marginLeft: 'auto',
            marginRight: 'auto',
            flexShrink: 0,
            overflow: 'visible'
        });
        $wrap.css({
            position: 'absolute',
            top: 0,
            left: '50%',
            marginLeft: (-natW / 2) + 'px',
            width: natW + 'px',
            transform: 'scale(' + s + ')',
            webkitTransform: 'scale(' + s + ')',
            transformOrigin: 'top center',
            webkitTransformOrigin: 'top center'
        });
    };
    
    /**
     * @method onWindowOrientationChange
     */
    Game.prototype.onWindowOrientationChange = function() {
        if ( !core.helperBrowser.isMobile ) {
            return;
        }
        var isDeviceSupportPortrait = ['iphone', 'ipod'].indexOf(core.helperBrowser.platform.iosDevice) !== -1,
            isPortraitMode = window.innerWidth < window.innerHeight;
        
        if ( (isDeviceSupportPortrait && !isPortraitMode) || (!isDeviceSupportPortrait && isPortraitMode) ) {
            this.windowOrientationIndicator.open();
        } else {
            if ( this.windowOrientationIndicator.isOpened() ) {
                this.windowOrientationIndicator.close();
            }
        }
        var orientThis = this;
        setTimeout(function() {
            orientThis.onWindowResize();
        }, 350);
    };
    
    return Game;
});