
define('app/window/rounds',
[
    'app/window/_base', 'app/core/_', 'app/game-options', 'app/i18/_', 'app/tgc-profile', 'app/tgc-session'
],
function(WindowBase, core, gameOptions, i18, tgcProfile, tgcSession) {

    function Rounds() {
        WindowBase.call(this);
        this.name = 'rounds';
        this.className = 'lbx-rounds';
        this.showOverlay = true;
        this.options = {
            game: 'space',
            levels: []
        };
        this.selectedLevel = 0;
        this.initialize();
    }
    
    Rounds.prototype = Object.create(WindowBase.prototype, {
        constructor: {
            value: Rounds,
            enumerable: false
        }
    });

    /**
     * @method header
     */
    Rounds.prototype.header = function() {
        return i18._('rounds-header');
    };

    /**
     * @method model
     */
    Rounds.prototype.model = function() {
        var onPlayClick = $.proxy(this.onPlayClick, this),
            onBackClick = $.proxy(this.onBackClick, this),
            onRoundsScroll = $.proxy(this.onRoundsScroll, this);

        return {
            tag: 'div', className: 'games-wrapper', childs: [
                {tag: 'div', className: 'games-window', childs: [], events: [{scroll: onRoundsScroll}]},
                {tag: 'div', className: 'row buttons', styles: {marginTop: 24, paddingBottom: 44}, 
                    childs: [
                        EPISODES.length > 1 ? {tag: 'div', className: 'medium primary btn icon-left icon-arrow-left', childs: [
                            {tag: 'a', href: '#', html: i18._('rounds-choose-episode'), events: [{click: onBackClick}]}
                        ]} : {},
                        {tag: 'div', className: 'medium secondary btn icon-right icon-arrow-right', childs: [
                            {tag: 'a', href: '#', html: i18._('rounds-choose-round'), events: [{click: onPlayClick}]}
                        ]}
                ]}
            ]
        };
    };

    Rounds.prototype.initialize = function() {
        WindowBase.prototype.initialize.call(this);
    };

    /**
     * @method open
     * @param {Object} options
     */
    Rounds.prototype.open = function(options) {
        WindowBase.prototype.open.call(this, options);
        this.setScrollableContent('.games-window');
        
        if ( core.helperApp.platform() == 'chrome' ) {
            document.querySelector('webview').addEventListener('newwindow', function(event) {
                event.preventDefault();
                window.open(event.targetUrl);
            });
        }
//        for ( var i = 0; i < 50; i++ ) {
//            this.unlockLevel(this.options.game, i);
//        }
    };

    /**
     * @method close
     * @param {Object} options
     */
    Rounds.prototype.close = function(options) {
        WindowBase.prototype.close.call(this, options);
    };
    
    /**
     * @method unlockLevel
     * @param {String} episode
     * @param {Number} round
     */
    Rounds.prototype.unlockLevel = function(episode, round) {
        var data = gameOptions.get('window-' + this.name, {});
        
        if ( !data[episode] ) {
            data[episode] = [];
        }
        data[episode][round] = 1;
        gameOptions.set('window-' + this.name, data);
    };
    
    /**
     * @method loadSelectedLevel
     * @return {Number}
     */
    Rounds.prototype.loadSelectedLevel = function() {
        return gameOptions.get('window-' + this.name + '-' + this.options.game + ':selectedLevel') >> 0;
    };
    
    /**
     * @method saveSelectedLevel
     */
    Rounds.prototype.saveSelectedLevel = function() {
        gameOptions.set('window-' + this.name + '-' + this.options.game, {selectedLevel: this.selectedLevel});
    };
    
    /**
     * @method onOptionClick
     * @param {DOMEvent} event
     */
    Rounds.prototype.onOptionClick = function(event) {
        var clicked, itemEntry;

        clicked = $(event.target);
        
        if ( !clicked.hasClass('option-item-entry') ) {
            itemEntry = clicked.parents('.option-item-entry');
        } else {
            itemEntry = clicked;
        }
        if ( !clicked.hasClass('option-item') ) {
            clicked = clicked.parents('.option-item');
        }
        event.preventDefault();
        
        if ( itemEntry.hasClass('disabled') ) {
            return;
        }

        clicked.find('a.option-item-entry').each($.proxy(function(i, element) {
            element = $(element);
            element.removeClass('selected');
            
            if ( element.context == itemEntry.get(0) ) {
                element.addClass('selected');
                this.selectedLevel = itemEntry.attr('data-id') >> 0;
                this.saveSelectedLevel();
            }
        }, this));
    };

    /**
     * @method onPlayClick
     * @param {Object} event
     */
    Rounds.prototype.onPlayClick = function(event) {
        var maxU = tgcProfile.getMaxUnlockedLevelIndex();
        event.preventDefault();
        if ( this.selectedLevel > maxU || tgcSession.wasPlayed(this.selectedLevel) ) {
            return;
        }
        this.close();
        this.emit('play', {episode: this.options.game, level: this.selectedLevel});
    };
    
    /**
     * @method onBackClick
     * @param {Object} event
     */
    Rounds.prototype.onBackClick = function(event) {
        event.preventDefault();
        this.close();
        this.emit('back');
    };
    
    /**
     * @method onRoundsScroll
     * @param {Object} event
     */
    Rounds.prototype.onRoundsScroll = function(event) {
//        var scrollTop = this.content.find('.games-window').scrollTop();
//        core.mediator.emit('');
    };

    /**
     * @method _buildHtml
     */
    Rounds.prototype._buildHtml = function() {
        var model;
        var maxUnlocked = tgcProfile.getMaxUnlockedLevelIndex();

        this.selectedLevel = this.loadSelectedLevel();
        var pick = -1;
        for ( var j = 0; j <= maxUnlocked; j++ ) {
            if ( !tgcSession.wasPlayed(j) ) {
                pick = j;
                break;
            }
        }
        if ( pick >= 0 && (this.selectedLevel > maxUnlocked || tgcSession.wasPlayed(this.selectedLevel)) ) {
            this.selectedLevel = pick;
            this.saveSelectedLevel();
        } else if ( pick < 0 ) {
            this.selectedLevel = 0;
            this.saveSelectedLevel();
        }
        model = {tag: 'ul', className: 'option-item four_up tiles', childs: []};
        
        $.each(this.options.levels, $.proxy(function(i, name) {
            var levelPreview, lockPreview, unlocked, played, disabled, cls;

            unlocked = (i <= maxUnlocked);
            played = tgcSession.wasPlayed(i);
            disabled = !unlocked || played;
            cls = 'option-item-entry ' + (i === this.selectedLevel ? 'selected' : '') + (disabled ? ' disabled' : '');
            if ( played && unlocked ) {
                cls += ' tgc-round-played-session';
            }
            // Round 1: dedicated art (round-first.svg). Rounds 2+ keep legacy filenames 1.jpg, 2.jpg…
            // (index 0 → first image; index i≥1 → i.jpg so previews stay aligned when levels are prepended.)
            levelPreview = SS + 'images/games/' + this.options.game + '/' +
                (i === 0 ? 'round-first.svg' : (i + '.jpg')) + (typeof REVISION !== 'undefined' ? REVISION : '');
            lockPreview = SS + 'images/games/locked.jpg' + (typeof REVISION !== 'undefined' ? REVISION : '');
            model.childs.push(
                {tag: 'li', childs: [
                    {tag: 'a', 'data-id': i,
                        className: cls,
                        events: [{click: $.proxy(this.onOptionClick, this)}],
                        childs: [
                            {tag: 'img', className: 'round-preview', src: unlocked ? levelPreview : lockPreview},
                            {tag: 'span', className: 'round-name', html: '&nbsp;' + (i + 1) + ') ' + name + 
                                (played && unlocked ? ' — ' + i18._('tgc-round-already-session') : '') + ''}
                        ]
                    }
                ]}
            );
        }, this));
        this.workingModel.childs[0].childs.push(model);

        WindowBase.prototype._buildHtml.call(this);
    };

    return Rounds;
});