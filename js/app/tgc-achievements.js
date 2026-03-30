
define('app/tgc-achievements', ['app/i18/_', 'app/tgc-toast', 'app/episodes/space/levels'], function(i18, tgcToast, spaceLevelsFn) {

    function runScore(d) {
        var s = d.stats || {};
        return Math.max(s.bestSessionScore | 0, s.highScore | 0);
    }

    var LEVEL_COUNT = 40;
    try {
        LEVEL_COUNT = spaceLevelsFn().length;
    } catch (e) {
        LEVEL_COUNT = 40;
    }

    function levelBeatCheck(n) {
        return function(d) {
            return (d.stats.maxLevelBeat | 0) >= n;
        };
    }

    var DEFS = [
        {id: 'cadet_joined', icon: '🚀', check: function(d) { return !!d.username; }}
    ];

    var L, icons = ['🎯', '🎮', '⭐', '🛸', '🌟'];
    for ( L = 1; L <= LEVEL_COUNT; L++ ) {
        DEFS.push({
            id: 'lvl_beat_' + L,
            levelBeat: L,
            icon: icons[L % icons.length],
            check: levelBeatCheck(L)
        });
    }

    DEFS.push(
        {id: 'tgc_legend', icon: '👑', check: function(d) {
            return (d.stats.maxLevelBeat | 0) >= LEVEL_COUNT;
        }},
        {id: 'point_collector_10k', icon: '💰', check: function(d) { return runScore(d) >= 10000; }},
        {id: 'point_hoarder_50k', icon: '💎', check: function(d) { return runScore(d) >= 50000; }},
        {id: 'score_ninja_100k', icon: '🥷', check: function(d) { return runScore(d) >= 100000; }},
        {id: 'oops_first_death', icon: '💀', check: function(d) { return d.stats.deaths >= 1; }},
        {id: 'rubber_ball_10', icon: '🔁', check: function(d) { return d.stats.deaths >= 10; }},
        {id: 'cosmic_persistence_50', icon: '☄️', check: function(d) { return d.stats.deaths >= 50; }},
        {id: 'coffee_break_10m', icon: '☕', check: function(d) { return d.stats.playTimeMs >= 600000; }},
        {id: 'marathon_1h', icon: '🕐', check: function(d) { return d.stats.playTimeMs >= 3600000; }},
        {id: 'lightning_round', icon: '⚡', check: function(d) { return d.stats.fastestRoundSec > 0 && d.stats.fastestRoundSec <= 45; }},
        {id: 'full_health_win', icon: '❤️', check: function(d) { return d.stats.fullLivesWins >= 1; }}
    );

    function formatAchievementStrings(def, i18Ref) {
        var ii = i18Ref || i18;
        if ( def.levelBeat ) {
            return {
                title: ii._('tgc-ach-lvl_beat-title').replace(/\{n\}/g, String(def.levelBeat)),
                desc: ii._('tgc-ach-lvl_beat-desc').replace(/\{n\}/g, String(def.levelBeat))
            };
        }
        return {
            title: ii._('tgc-ach-' + def.id + '-title'),
            desc: ii._('tgc-ach-' + def.id + '-desc')
        };
    }

    function getDef(id) {
        for ( var i = 0; i < DEFS.length; i++ ) {
            if ( DEFS[i].id === id ) {
                return DEFS[i];
            }
        }
        return null;
    }

    function listDefs() {
        return DEFS.slice();
    }

    function evaluate(profileData, context, onUnlock) {
        var now = Date.now();
        var unlocked = profileData.achievements || (profileData.achievements = {});
        var ctx = context || {};

        for ( var i = 0; i < DEFS.length; i++ ) {
            var def = DEFS[i];
            if ( unlocked[def.id] ) {
                continue;
            }
            try {
                if ( def.check(profileData, ctx) ) {
                    unlocked[def.id] = now;
                    if ( onUnlock ) {
                        onUnlock(def);
                    }
                }
            } catch (e) {}
        }
    }

    function notifyUnlock(def) {
        var s = formatAchievementStrings(def, i18);
        tgcToast.showAchievement(def.id, s.title, s.desc, def.icon);
    }

    return {
        DEFS: DEFS,
        getDef: getDef,
        listDefs: listDefs,
        evaluate: evaluate,
        notifyUnlock: notifyUnlock,
        formatAchievementStrings: formatAchievementStrings,
        getLevelAchievementCount: function() { return LEVEL_COUNT; }
    };
});
