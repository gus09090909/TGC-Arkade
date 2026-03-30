
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
        data = defaultData(raw.username || data && data.username || '');
        data.username = raw.username || data.username;
        data.maxUnlockedLevelIndex = raw.maxUnlockedLevelIndex | 0;
        if ( data.maxUnlockedLevelIndex < 0 ) {
            data.maxUnlockedLevelIndex = 0;
        }
        data.stats = $.extend(emptyStats(), raw.stats || {});
        data.achievements = $.extend({}, raw.achievements || {});
        data.cloudSyncedAt = raw.cloudSyncedAt || null;
        if ( (data.stats.highScore | 0) < (data.stats.bestSessionScore | 0) ) {
            data.stats.highScore = data.stats.bestSessionScore | 0;
        }
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

    function applyLevelWin(levelIndexZeroBased, levelScore, timeSec, livesLeft, maxLevelCount) {
        var d = get();
        var s = d.stats;
        s.roundsWon = (s.roundsWon | 0) + 1;
        var beat = (levelIndexZeroBased | 0) + 1;
        if ( beat > (s.maxLevelBeat | 0) ) {
            s.maxLevelBeat = beat;
        }
        s.totalScore = (s.totalScore | 0) + Math.max(0, levelScore | 0);
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
        readRememberedUsername: readRememberedUsername
    };
});
