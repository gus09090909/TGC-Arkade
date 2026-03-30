
define('app/window/profile',
[
    'app/window/_base', 'app/i18/_', 'app/core/_', 'app/tgc-profile', 'app/tgc-achievements', 'app/tgc-cloud'
],
function(WindowBase, i18, core, tgcProfile, tgcAchievements, tgcCloud) {

    function Profile() {
        WindowBase.call(this);
        this.name = 'profile';
        this.className = 'lbx-' + this.name;
        this.showOverlay = true;
        this._lbPoll = null;
        this._onLbDirty = $.proxy(this._refreshLeaderboard, this);
        core.mediator.addListener('tgc:leaderboard-dirty', this._onLbDirty);
        this.addListener('close', $.proxy(this.onProfileClose, this));
        this.initialize();
    }

    Profile.prototype = Object.create(WindowBase.prototype, {
        constructor: {
            value: Profile,
            enumerable: false
        }
    });

    Profile.prototype.header = function() {
        return i18._('tgc-profile-header');
    };

    Profile.prototype.onProfileClose = function() {
        if ( this._lbPoll ) {
            clearInterval(this._lbPoll);
            this._lbPoll = null;
        }
    };

    Profile.prototype.model = function() {
        return {
            tag: 'div', className: 'tgc-profile-root tgc-profile-body', childs: [
                {tag: 'div', className: 'tab-buttons tgc-profile-tabs', childs: [
                    {tag: 'a', href: '#', html: i18._('tgc-tab-profile'), className: 'tab-selected'},
                    {tag: 'a', href: '#', html: i18._('tgc-tab-leaderboard')}
                ]},
                {tag: 'div', className: 'tab-contents tgc-prof-pane', styles: {display: 'block'}, childs: [
                    {tag: 'div', className: 'tgc-profile-user', childs: [
                        {tag: 'div', className: 'tgc-profile-avatar', html: '👤'},
                        {tag: 'div', className: 'tgc-profile-user-text', childs: [
                            {tag: 'div', className: 'tgc-profile-name', id: 'tgc-profile-name', html: '—'},
                            {tag: 'p', className: 'tgc-profile-cloud', id: 'tgc-profile-cloud', html: ''}
                        ]}
                    ]},
                    {tag: 'div', className: 'tgc-profile-stats row', childs: [
                        {tag: 'div', className: 'tgc-stat', childs: [
                            {tag: 'span', className: 'tgc-stat__label', html: i18._('tgc-stat-playtime')},
                            {tag: 'span', className: 'tgc-stat__val', id: 'tgc-stat-playtime', html: '0'}
                        ]},
                        {tag: 'div', className: 'tgc-stat', childs: [
                            {tag: 'span', className: 'tgc-stat__label', html: i18._('tgc-stat-best-run')},
                            {tag: 'span', className: 'tgc-stat__val', id: 'tgc-stat-highscore', html: '0'}
                        ]},
                        {tag: 'div', className: 'tgc-stat', childs: [
                            {tag: 'span', className: 'tgc-stat__label', html: i18._('tgc-stat-deaths')},
                            {tag: 'span', className: 'tgc-stat__val', id: 'tgc-stat-deaths', html: '0'}
                        ]},
                        {tag: 'div', className: 'tgc-stat', childs: [
                            {tag: 'span', className: 'tgc-stat__label', html: i18._('tgc-stat-unlock')},
                            {tag: 'span', className: 'tgc-stat__val', id: 'tgc-stat-levels', html: '0'}
                        ]}
                    ]},
                    {tag: 'div', className: 'tgc-profile-share', childs: [
                        {tag: 'button', type: 'button', className: 'tgc-btn tgc-btn--secondary', id: 'tgc-profile-copy', html: i18._('tgc-profile-copy-link')},
                        {tag: 'button', type: 'button', className: 'tgc-btn', id: 'tgc-profile-sync', html: i18._('tgc-profile-sync-now')},
                        {tag: 'button', type: 'button', className: 'tgc-btn tgc-btn--danger', id: 'tgc-profile-logout', html: i18._('tgc-profile-logout')}
                    ]},
                    {tag: 'h3', className: 'tgc-ach-heading', html: i18._('tgc-profile-achievements')},
                    {tag: 'div', className: 'tgc-ach-grid', id: 'tgc-ach-grid'}
                ]},
                {tag: 'div', className: 'tab-contents tgc-lb-pane', styles: {display: 'none'}, childs: [
                    {tag: 'p', className: 'tgc-lb-live', id: 'tgc-lb-live', html: '…'},
                    {tag: 'div', className: 'tgc-lb-table', id: 'tgc-lb-table', html: ''}
                ]}
            ]
        };
    };

    Profile.prototype.open = function(options) {
        WindowBase.prototype.open.call(this, options);
    };

    Profile.prototype.onProfileTabChange = function(tabIndex) {
        if ( tabIndex === 1 ) {
            this._refreshLeaderboard();
        }
    };

    Profile.prototype._fillProfileTab = function() {
        var d = tgcProfile.get();
        var $c = this.content;
        $c.find('#tgc-profile-name').text(d.username || '—');
        $c.find('#tgc-profile-cloud').html(
            tgcCloud.enabled() ? i18._('tgc-profile-cloud-on') : i18._('tgc-profile-cloud-off')
        );
        var ptMin = Math.floor((d.stats.playTimeMs | 0) / 60000);
        $c.find('#tgc-stat-playtime').text(ptMin + ' min');
        var bestRun = Math.max(d.stats.bestSessionScore | 0, d.stats.highScore | 0);
        $c.find('#tgc-stat-highscore').text(String(bestRun));
        $c.find('#tgc-stat-deaths').text(String(d.stats.deaths | 0));
        $c.find('#tgc-stat-levels').text(String((d.maxUnlockedLevelIndex | 0) + 1));

        var $grid = $c.find('#tgc-ach-grid');
        $grid.empty();
        var defs = tgcAchievements.listDefs();
        var unlocked = d.achievements || {};
        for ( var i = 0; i < defs.length; i++ ) {
            var def = defs[i];
            var has = !!unlocked[def.id];
            var $tile = $('<div class="tgc-ach-tile"></div>');
            $tile.toggleClass('tgc-ach-tile--locked', !has);
            var txt = tgcAchievements.formatAchievementStrings(def, i18);
            $tile.html(
                '<div class="tgc-ach-tile__icon">' + def.icon + '</div>' +
                '<div class="tgc-ach-tile__title"></div>' +
                '<div class="tgc-ach-tile__desc"></div>'
            );
            $tile.find('.tgc-ach-tile__title').text(txt.title);
            $tile.find('.tgc-ach-tile__desc').text(txt.desc);
            $grid.append($tile);
        }

        var _this = this;
        $c.find('#tgc-profile-copy').off('click').on('click', function() {
            var u = encodeURIComponent(d.username || '');
            var link = location.protocol + '//' + location.host + location.pathname + '?tgc_player=' + u;
            if ( navigator.clipboard && navigator.clipboard.writeText ) {
                navigator.clipboard.writeText(link + '\n' + i18._('tgc-profile-share-blurb'));
            } else {
                window.prompt(i18._('tgc-profile-copy-manual'), link);
            }
        });
        $c.find('#tgc-profile-sync').off('click').on('click', function() {
            tgcProfile.pullCloud(function() {
                _this.close();
                setTimeout(function() {
                    _this.open();
                }, 450);
            });
            tgcProfile.schedulePush();
        });
        $c.find('#tgc-profile-logout').off('click').on('click', function() {
            if ( !window.confirm(i18._('tgc-profile-logout-confirm')) ) {
                return;
            }
            _this.close();
            tgcProfile.logoutSession();
            window.location.reload();
        });
    };

    Profile.prototype._refreshLeaderboard = function() {
        var _this = this;
        if ( !this.content ) {
            return;
        }
        tgcCloud.fetchLeaderboard(function(data) {
            if ( !_this.content ) {
                return;
            }
            var $live = _this.content.find('#tgc-lb-live');
            var $table = _this.content.find('#tgc-lb-table');
            if ( !data || !data.entries ) {
                $table.html('<p class="tgc-lb-empty">' + i18._('tgc-lb-error') + '</p>');
                return;
            }
            var t = new Date(data.updatedAt || Date.now());
            $live.text(i18._('tgc-lb-updated') + ' ' + t.toLocaleTimeString());
            var rows = ['<table class="tgc-lb-grid"><thead><tr>',
                '<th>#</th><th>', i18._('tgc-lb-player'), '</th><th>', i18._('tgc-lb-score'), '</th>',
                '</tr></thead><tbody>'].join('');
            for ( var i = 0; i < data.entries.length; i++ ) {
                var e = data.entries[i];
                var me = (e.username === tgcProfile.getUsername()) ? ' tgc-lb-me' : '';
                rows += '<tr class="' + me + '"><td>' + (i + 1) + '</td><td>' +
                    $('<div/>').text(e.username).html() + '</td><td>' + (e.score | 0) + '</td></tr>';
            }
            rows += '</tbody></table>';
            $table.html(rows);
        });
    };

    Profile.prototype._buildHtml = function() {
        WindowBase.prototype._buildHtml.call(this);
        this._fillProfileTab();
        this.tab = new core.Tab({
            buttons: this.content.find('.tgc-profile-tabs a'),
            contents: this.content.find('.tgc-profile-root > .tab-contents'),
            active_tab_class: 'tab-selected'
        });
        this.tab.addListener('change', $.proxy(this.onProfileTabChange, this));

        var _this = this;
        this._refreshLeaderboard();
        if ( this._lbPoll ) {
            clearInterval(this._lbPoll);
        }
        this._lbPoll = setInterval(function() {
            if ( _this.content && _this.content.find('.tgc-lb-pane:visible').length ) {
                _this._refreshLeaderboard();
            }
        }, 4000);
    };

    return Profile;
});
