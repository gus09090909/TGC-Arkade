
define('app/tgc-profile', ['app/core/_', 'app/tgc-cloud'], function(core, tgcCloud) {

    var SESSION_USER_KEY = 'tgc_session_username';

    var data = null;
    var pushTimer = null;
    var playBufMs = 0;
    var playFlushTimer = null;

    function emptyStats() {
        return {
            playTimeMs: 0,
            deaths: 0,
            bestSessionScore: 0,
            highScore: 0,
            totalScore: 0,
            roundsWon: 0,
            maxLevelBeat: 0,
            fastestRoundSec: 0,
            fullLivesWins: 0
        };
    }

    function defaultData(username) {
        return {
            username: username || '',
            maxUnlockedLevelIndex: 0,
            stats: emptyStats(),
            achievements: {},
            cloudSyncedAt: null
        };
    }

    function applyServerProfile(raw) {
        if ( !raw || typeof raw !== 'object' ) {
            return;
        }
        var prev = data;
        var prevUser = (prev && prev.username) || '';
        data = defaultData(raw.username || prevUser);
        data.username = (raw.username || prevUser || '').trim() || data.username;
        var ps = prev && prev.stats ? prev.stats : emptyStats();
        var cs = $.extend(emptyStats(), raw.stats || {});
        data.maxUnlockedLevelIndex = Math.max(prev ? (prev.maxUnlockedLevelIndex | 0) : 0, (raw.maxUnlockedLevelIndex | 0));
        if ( data.maxUnlockedLevelIndex < 0 ) {
            data.maxUnlockedLevelIndex = 0;
        }
        var s = emptyStats();
        s.playTimeMs = Math.max(ps.playTimeMs | 0, cs.playTimeMs | 0);
        s.deaths = Math.max(ps.deaths | 0, cs.deaths | 0);
        s.bestSessionScore = Math.max(ps.bestSessionScore | 0, cs.bestSessionScore | 0);
        s.highScore = Math.max(ps.highScore | 0, cs.highScore | 0);
        s.totalScore = Math.max(ps.totalScore | 0, cs.totalScore | 0);
        s.roundsWon = Math.max(ps.roundsWon | 0, cs.roundsWon | 0);
        s.maxLevelBeat = Math.max(ps.maxLevelBeat | 0, cs.maxLevelBeat | 0);
        if ( cs.fastestRoundSec | 0 ) {
            if ( !ps.fastestRoundSec || (cs.fastestRoundSec | 0) < (ps.fastestRoundSec | 0) ) {
                s.fastestRoundSec = cs.fastestRoundSec | 0;
            } else {
                s.fastestRoundSec = ps.fastestRoundSec | 0;
            }
        } else {
            s.fastestRoundSec = ps.fastestRoundSec | 0;
        }
        s.fullLivesWins = Math.max(ps.fullLivesWins | 0, cs.fullLivesWins | 0);
        data.stats = s;
        if ( (data.stats.highScore | 0) < (data.stats.bestSessionScore | 0) ) {
            data.stats.highScore = data.stats.bestSessionScore | 0;
        }
        var prevAch = prev && prev.achievements ? prev.achievements : {};
        var mergedAch = $.extend({}, prevAch);
        var incAch = raw.achievements || {};
        Object.keys(incAch).forEach(function(k) {
            var a = incAch[k];
            var b = mergedAch[k];
            if ( !b || (a | 0) < (b | 0) ) {
                mergedAch[k] = a;
            }
        });
        data.achievements = mergedAch;
        data.cloudSyncedAt = raw.cloudSyncedAt || null;
    }

    function persistLocalEvent() {
        core.mediator.emit('tgc:profile-updated', data);
    }

    function schedulePush() {
        if ( pushTimer ) {
            clearTimeout(pushTimer);
        }
        pushTimer = setTimeout(function() {
            pushTimer = null;
            if ( !data || !data.username || !tgcCloud.enabled() ) {
                return;
            }
            tgcCloud.push(data.username, data, function() {
                if ( data ) {
                    data.cloudSyncedAt = Date.now();
                }
            });
        }, 600);
    }

    function flushPlayBuffer() {
        if ( playFlushTimer ) {
            clearTimeout(playFlushTimer);
            playFlushTimer = null;
        }
        if ( playBufMs <= 0 || !data ) {
            return;
        }
        data.stats.playTimeMs = (data.stats.playTimeMs | 0) + playBufMs;
        playBufMs = 0;
        persistLocalEvent();
        schedulePush();
    }

    function addPlayTimeMs(ms) {
        if ( !ms || ms < 0 || ms > 5000 || !data ) {
            return;
        }
        playBufMs += ms | 0;
        if ( !playFlushTimer ) {
            playFlushTimer = setTimeout(function() {
                playFlushTimer = null;
                flushPlayBuffer();
            }, 2500);
        }
    }

    function get() {
        if ( !data ) {
            data = defaultData('');
        }
        return data;
    }

    function getUsername() {
        return (get().username || '').trim();
    }

    function getMaxUnlockedLevelIndex() {
        return get().maxUnlockedLevelIndex | 0;
    }

    function rememberUsername(name) {
        try {
            sessionStorage.setItem(SESSION_USER_KEY, name);
        } catch (e) {}
    }

    function readRememberedUsername() {
        try {
            return (sessionStorage.getItem(SESSION_USER_KEY) || '').trim();
        } catch (e) {
            return '';
        }
    }

    function clearRememberedUsername() {
        try {
            sessionStorage.removeItem(SESSION_USER_KEY);
        } catch (e) {}
    }

    /**
     * Clear local session (nickname memory + profile shell). Use before reload / welcome screen.
     */
    function logoutSession() {
        clearRememberedUsername();
        data = defaultData('');
        persistLocalEvent();
    }

    /**
     * Register or load profile from cloud only (no localStorage for game data).
     */
    function setUsername(name, callback) {
        var n = (name || '').trim();
        if ( n.length < 2 || n.length > 24 ) {
            if ( callback ) {
                callback(false);
            }
            return;
        }
        if ( !/^[a-zA-Z0-9 _\-áéíóúñüÁÉÍÓÚÑÜ]+$/.test(n) ) {
            if ( callback ) {
                callback(false);
            }
            return;
        }
        if ( !tgcCloud.enabled() ) {
            if ( callback ) {
                callback(false);
            }
            return;
        }
        tgcCloud.register(n, function(profile) {
            if ( !profile ) {
                if ( callback ) {
                    callback(false);
                }
                return;
            }
            applyServerProfile(profile);
            rememberUsername(n);
            persistLocalEvent();
            schedulePush();
            if ( callback ) {
                callback(true);
            }
        });
    }

    /**
     * Restore session tab user via cloud (GET profile).
     */
    function restoreSessionUser(callback) {
        var n = readRememberedUsername();
        if ( !n || !tgcCloud.enabled() ) {
            if ( callback ) {
                callback(false);
            }
            return;
        }
        tgcCloud.register(n, function(profile) {
            if ( profile ) {
                applyServerProfile(profile);
                persistLocalEvent();
                if ( callback ) {
                    callback(true);
                }
            } else if ( callback ) {
                callback(false);
            }
        });
    }

    function pullCloud(callback) {
        var u = getUsername();
        if ( !u || !tgcCloud.enabled() ) {
            if ( callback ) {
                callback();
            }
            return;
        }
        tgcCloud.pull(u, function(res) {
            if ( res && typeof res === 'object' ) {
                applyServerProfile(res);
                persistLocalEvent();
            }
            if ( callback ) {
                callback();
            }
        });
    }

    function applyLevelWin(levelIndexZeroBased, levelScore, timeSec, livesLeft, maxLevelCount, sessionTotalScore) {
        var d = get();
        var s = d.stats;
        s.roundsWon = (s.roundsWon | 0) + 1;
        var beat = (levelIndexZeroBased | 0) + 1;
        if ( beat > (s.maxLevelBeat | 0) ) {
            s.maxLevelBeat = beat;
        }
        s.totalScore = (s.totalScore | 0) + Math.max(0, levelScore | 0);
        var run = sessionTotalScore | 0;
        if ( run > (s.bestSessionScore | 0) ) {
            s.bestSessionScore = run;
        }
        if ( run > (s.highScore | 0) ) {
            s.highScore = run;
        }
        var t = Math.max(1, timeSec | 0);
        if ( !s.fastestRoundSec || t < s.fastestRoundSec ) {
            s.fastestRoundSec = t;
        }
        if ( (livesLeft | 0) >= 3 ) {
            s.fullLivesWins = (s.fullLivesWins | 0) + 1;
        }
        var cap = Math.max(0, (maxLevelCount | 0) - 1);
        var nextUnlock = Math.min(cap, (levelIndexZeroBased | 0) + 1);
        if ( nextUnlock > (d.maxUnlockedLevelIndex | 0) ) {
            d.maxUnlockedLevelIndex = nextUnlock;
        }
        persistLocalEvent();
        schedulePush();
    }

    function mergeProfileAfterSessionEnd(serverProfile) {
        if ( serverProfile && typeof serverProfile === 'object' ) {
            applyServerProfile(serverProfile);
        }
        persistLocalEvent();
    }

    function persist() {
        persistLocalEvent();
        schedulePush();
    }

    return {
        get: get,
        getUsername: getUsername,
        getMaxUnlockedLevelIndex: getMaxUnlockedLevelIndex,
        setUsername: setUsername,
        restoreSessionUser: restoreSessionUser,
        pullCloud: pullCloud,
        addPlayTimeMs: addPlayTimeMs,
        applyLevelWin: applyLevelWin,
        mergeProfileAfterSessionEnd: mergeProfileAfterSessionEnd,
        persist: persist,
        schedulePush: schedulePush,
        flushPlayBuffer: flushPlayBuffer,
        clearRememberedUsername: clearRememberedUsername,
        readRememberedUsername: readRememberedUsername,
        logoutSession: logoutSession
    };
});
