
define('app/input/pointer', 
[
    'app/core/_'
], 
function(core) {
    
    function Pointer() {
        core.EventEmitter.call(this);
        this.canvasElement = $('#a-game-canvas');
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || core.helperBrowser.isMobile;
        this.x = 0;
        this.y = 0;
        this.leftClick = false;
        this.rightClick = false;
        this.preventDefault = true;
        this.canvasCoords = {};
        this._touchHandlers = null;
        this.initialize();
    }
    
    Pointer.prototype = Object.create(core.EventEmitter.prototype, {
        constructor: {
            value: Pointer,
            enumerable: false
        }
    });
    
    Pointer.prototype.initialize = function() {
        this.onResize();
        this.initEvents();
    };
    
    Pointer.prototype.updateStageCoords = function() {
        this.onResize();
    };

    /**
     * Viewport-relative box (works with CSS transform: scale on ancestors).
     */
    Pointer.prototype._syncCanvasRectViewport = function() {
        var el = this.canvasElement[0];
        if ( !el ) {
            return;
        }
        var r = el.getBoundingClientRect();
        this.canvasCoords.left = r.left;
        this.canvasCoords.top = r.top;
        this.canvasCoords.width = r.width;
        this.canvasCoords.height = r.height;
    };

    Pointer.prototype._getClientXY = function(nativeEvent) {
        var e = nativeEvent;
        if ( e.touches && e.touches.length ) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if ( e.changedTouches && e.changedTouches.length ) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    Pointer.prototype.initEvents = function() {
        var _this = this,
            d = $(document),
            passiveNo = { passive: false };

        if ( this.isTouchDevice ) {
            this._touchHandlers = {
                start: function(ev) {
                    _this._syncCanvasRectViewport();
                    _this.leftClick = true;
                    _this.rightClick = false;
                    var p = _this._getClientXY(ev);
                    _this._applyPointerXY(p.x, p.y);
                    if ( _this.preventDefault && ev.cancelable ) {
                        ev.preventDefault();
                    }
                },
                move: function(ev) {
                    if ( _this.preventDefault && ev.cancelable ) {
                        ev.preventDefault();
                    }
                    _this._syncCanvasRectViewport();
                    var p = _this._getClientXY(ev);
                    _this._applyPointerXY(p.x, p.y);
                },
                end: function(ev) {
                    _this._syncCanvasRectViewport();
                    _this.leftClick = false;
                    _this.rightClick = false;
                    if ( ev.changedTouches && ev.changedTouches.length ) {
                        var t = ev.changedTouches[0];
                        _this._applyPointerXY(t.clientX, t.clientY);
                    }
                }
            };
            document.addEventListener('touchstart', this._touchHandlers.start, passiveNo);
            document.addEventListener('touchmove', this._touchHandlers.move, passiveNo);
            document.addEventListener('touchend', this._touchHandlers.end, passiveNo);
            document.addEventListener('touchcancel', this._touchHandlers.end, passiveNo);
        } else {
            d.bind('mousedown', function(event) {
                _this.onPointerDown(event);
            });
            d.bind('mouseup', function(event) {
                _this.onPointerUp(event);
            });
            d.bind('mousemove', function(event) {
                _this.onPointerMove(event);
            });
        }
        $(window).bind('resize', $.proxy(this.onResize, this));
        this.canvasElement.bind('click', $.proxy(this.onCanvasClick, this));
        core.mediator.addListener('windowOpen', $.proxy(this.onWindowOpen, this));
        core.mediator.addListener('windowClose', $.proxy(this.onWindowClose, this));
    };

    Pointer.prototype._applyPointerXY = function(clientX, clientY) {
        var dx = clientX - this.canvasCoords.left;
        var dy = clientY - this.canvasCoords.top;
        this.x = dx > 0 ? (dx < this.canvasCoords.width ? dx : this.canvasCoords.width) : 0;
        this.y = dy > 0 ? (dy < this.canvasCoords.height ? dy : this.canvasCoords.height) : 0;
    };

    Pointer.prototype.isClick = function() {
        return this.isLeftClick();
    };
    
    Pointer.prototype.isLeftClick = function() {
        return this.leftClick;
    };
    
    Pointer.prototype.isRightClick = function() {
        return this.rightClick;
    };
    
    Pointer.prototype.onCanvasClick = function() {
    };

    Pointer.prototype.onPointerDown = function(event) {
        if ( this.isTouchDevice ) {
            this.leftClick = true;
        } else {
            if ( event.button === 0 ) {
                this.leftClick = true;
            } else if ( event.button === 2 ) {
                this.rightClick = true;
            }
        }
    };

    Pointer.prototype.onPointerUp = function(event) {
        if ( this.isTouchDevice ) {
            this.leftClick = false;
            this.rightClick = false;
        } else {
            if ( event.button === 0 ) {
                this.leftClick = false;
            } else if ( event.button === 2 ) {
                this.rightClick = false;
            }
        }
    };

    Pointer.prototype._pointerLockElement = function() {
        var d = document;
        return d.pointerLockElement || d.mozPointerLockElement || d.webkitPointerLockElement;
    };

    Pointer.prototype.onPointerMove = function(event) {
        if ( this.preventDefault && event.cancelable ) {
            event.preventDefault();
        }

        var e = event.originalEvent || event;
        this._syncCanvasRectViewport();

        var canvasEl = this.canvasElement[0];
        if ( canvasEl && this._pointerLockElement() === canvasEl ) {
            var mx = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
            this.x += mx;
            if ( this.x < 0 ) {
                this.x = 0;
            }
            if ( this.x > this.canvasCoords.width ) {
                this.x = this.canvasCoords.width;
            }
            return;
        }

        var clientX, clientY;
        var p = this._getClientXY(e);
        clientX = p.x;
        clientY = p.y;
        this._applyPointerXY(clientX, clientY);
    };

    Pointer.prototype.onResize = function() {
        this._syncCanvasRectViewport();
    };
    
    Pointer.prototype.onWindowOpen = function() {
        this.preventDefault = false;
    };
    
    Pointer.prototype.onWindowClose = function() {
        if ( !$('.lbx-window').length ) {
            this.preventDefault = true;
        }
    };
   
    var instance = null;
    
    if ( instance === null ) {
        instance = new Pointer();
    }
    
    return instance;
});
