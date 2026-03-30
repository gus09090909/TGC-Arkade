
define('app/tgc-session', [], function() {

    var played = {};
    var sessionActive = false;

    function resetPlayed() {
        played = {};
    }

    function markPlayed(levelIndex) {
        played[levelIndex | 0] = true;
    }

    function wasPlayed(levelIndex) {
        return !!played[levelIndex | 0];
    }

    function setSessionActive(v) {
        sessionActive = !!v;
    }

    function isSessionActive() {
        return sessionActive;
    }

    return {
        resetPlayed: resetPlayed,
        markPlayed: markPlayed,
        wasPlayed: wasPlayed,
        setSessionActive: setSessionActive,
        isSessionActive: isSessionActive
    };
});
