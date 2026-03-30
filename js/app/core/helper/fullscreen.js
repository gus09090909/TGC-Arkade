
define('app/core/helper/fullscreen', 
[
    'app/core/storage/global', 'app/core/helper/browser'
], 
function(storageGlobal, browser) {

    function fullscreenElement() {
        var d = document;
        return d.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement || null;
    }

    return {
        /**
         * Fullscreen API (desktop). Mobile skips — use native browser UI.
         */
        isSupport: function() {
            if ( browser.isMobile || (storageGlobal.get('platform') != 'web' && storageGlobal.get('platform') != 'chrome') ) {
                return false;
            }
            var de = document.documentElement;
            return !!(de.requestFullscreen || de.webkitRequestFullscreen || de.webkitRequestFullScreen ||
                de.mozRequestFullScreen || de.msRequestFullscreen);
        },

        isPointerLockSupport: function() {
            if ( browser.isMobile ) {
                return false;
            }
            var c = document.createElement('canvas');
            return !!(c.requestPointerLock || c.mozRequestPointerLock || c.webkitRequestPointerLock);
        },

        request: function(el) {
            if ( !el ) {
                return $.Deferred().reject().promise();
            }
            var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen ||
                el.mozRequestFullScreen || el.msRequestFullscreen;
            if ( !fn ) {
                return $.Deferred().reject().promise();
            }
            try {
                var p = fn.call(el);
                if ( p && typeof p.then === 'function' ) {
                    return p;
                }
            } catch (e) {}
            return $.Deferred().resolve().promise();
        },

        exit: function() {
            var d = document;
            var fn = d.exitFullscreen || d.webkitExitFullscreen || d.webkitCancelFullScreen ||
                d.mozCancelFullScreen || d.msExitFullscreen;
            if ( fn ) {
                try {
                    fn.call(d);
                } catch (e) {}
            }
        },

        isFullscreen: function() {
            return !!fullscreenElement();
        },

        requestPointerLock: function(el) {
            if ( !el ) {
                return $.Deferred().reject().promise();
            }
            var fn = el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock;
            if ( !fn ) {
                return $.Deferred().reject().promise();
            }
            try {
                var p = fn.call(el);
                if ( p && typeof p.then === 'function' ) {
                    return p;
                }
            } catch (e) {}
            return $.Deferred().resolve().promise();
        },

        exitPointerLock: function() {
            var d = document;
            var fn = d.exitPointerLock || d.mozExitPointerLock || d.webkitExitPointerLock;
            if ( fn ) {
                try {
                    fn.call(d);
                } catch (e) {}
            }
        }
    };
});
