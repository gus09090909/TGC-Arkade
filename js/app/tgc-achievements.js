
define('app/tgc-achievements', ['app/i18/_', 'app/tgc-toast'], function(i18, tgcToast) {

    function runScore(d) {
        var s = d.stats || {};
        return Math.max(s.bestSessionScore | 0, s.highScore | 0);
    }

    var DEFS = [
        {id: 'cadet_joined', icon: '🚀', check: function(d) { return !!d.username; }},
        {id: 'pilot_certificate', icon: '🛸', check: function(d) { return d.stats.maxLevelBeat >= 1; }},
        {id: 'five_star_tourist', icon: '⭐', check: function(d) { return d.stats.maxLevelBeat >= 5; }},
        {id: 'deep_space_ten', icon: '🌌', check: function(d) { return d.stats.maxLevelBeat >= 10; }},
        {id: 'tgc_legend', icon: '👑', check: function(d, ctx) {
            var max = ctx && ctx.levelCount ? ctx.levelCount : 99;
            return d.stats.maxLevelBeat >= max;
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
    ];

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
        tgcToast.showAchievement(
            def.id,
            i18._('tgc-ach-' + def.id + '-title'),
            i18._('tgc-ach-' + def.id + '-desc'),
            def.icon
        );
    }

    return {
        DEFS: DEFS,
        getDef: getDef,
        listDefs: listDefs,
        evaluate: evaluate,
        notifyUnlock: notifyUnlock
    };
});
