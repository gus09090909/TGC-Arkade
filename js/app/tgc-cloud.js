
define('app/tgc-cloud', [], function() {

    /**
     * Cloud API enabled. TGC_CLOUD_SYNC_URL may be '' to use the same host as the game (one public URL).
     */
    function enabled() {
        return typeof TGC_CLOUD_SYNC_URL !== 'undefined';
    }

    function baseUrl() {
        if ( typeof TGC_CLOUD_SYNC_URL === 'undefined' ) {
            return '';
        }
        return String(TGC_CLOUD_SYNC_URL).replace(/\/?$/, '');
    }

    function authHeaders() {
        var h = {};
        if ( typeof TGC_CLOUD_SYNC_TOKEN !== 'undefined' && TGC_CLOUD_SYNC_TOKEN ) {
            h.Authorization = 'Bearer ' + TGC_CLOUD_SYNC_TOKEN;
        }
        return h;
    }

    function ajax(opts) {
        return $.ajax($.extend({
            dataType: 'json',
            headers: $.extend({'Accept': 'application/json'}, authHeaders())
        }, opts));
    }

    /**
     * POST /api/register { username } -> profile JSON
     */
    function register(username, callback) {
        if ( !enabled() ) {
            if ( callback ) {
                callback(null);
            }
            return;
        }
        ajax({
            url: baseUrl() + '/api/register',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({username: username})
        }).done(function(data) {
            if ( callback ) {
                callback(data);
            }
        }).fail(function() {
            if ( callback ) {
                callback(null);
            }
        });
    }

    /**
     * GET /api/profile/:username
     */
    function pull(username, callback) {
        if ( !enabled() || !username ) {
            if ( callback ) {
                callback(null);
            }
            return;
        }
        ajax({
            url: baseUrl() + '/api/profile/' + encodeURIComponent(username),
            type: 'GET'
        }).done(function(data) {
            if ( callback ) {
                callback(data);
            }
        }).fail(function(xhr) {
            if ( callback ) {
                callback(xhr.status === 404 ? false : null);
            }
        });
    }

    /**
     * PUT /api/profile/:username — body = full profile object
     */
    function push(username, profilePayload, callback) {
        if ( !enabled() || !username ) {
            if ( callback ) {
                callback(false);
            }
            return;
        }
        ajax({
            url: baseUrl() + '/api/profile/' + encodeURIComponent(username),
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(profilePayload)
        }).done(function() {
            if ( callback ) {
                callback(true);
            }
        }).fail(function() {
            if ( callback ) {
                callback(false);
            }
        });
    }

    /**
     * GET /api/leaderboard -> { entries: [{username, score, at}], updatedAt }
     */
    function fetchLeaderboard(callback) {
        if ( !enabled() ) {
            if ( callback ) {
                callback(null);
            }
            return;
        }
        ajax({
            url: baseUrl() + '/api/leaderboard',
            type: 'GET',
            cache: false
        }).done(function(data) {
            if ( callback ) {
                callback(data);
            }
        }).fail(function() {
            if ( callback ) {
                callback(null);
            }
        });
    }

    /**
     * POST /api/session-end { username, sessionScore }
     */
    function sessionEnd(username, sessionScore, callback) {
        if ( !enabled() || !username ) {
            if ( callback ) {
                callback(null);
            }
            return;
        }
        ajax({
            url: baseUrl() + '/api/session-end',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                username: username,
                sessionScore: sessionScore | 0
            })
        }).done(function(data) {
            if ( callback ) {
                callback(data);
            }
        }).fail(function() {
            if ( callback ) {
                callback(null);
            }
        });
    }

    return {
        enabled: enabled,
        baseUrl: baseUrl,
        register: register,
        pull: pull,
        push: push,
        fetchLeaderboard: fetchLeaderboard,
        sessionEnd: sessionEnd
    };
});
