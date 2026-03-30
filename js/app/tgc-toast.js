
define('app/tgc-toast', ['app/i18/_'], function(i18) {

    var stack = 0;
    var GAP = 12;
    var BOTTOM = 24;
    var WIDTH = 320;

    function ensureContainer() {
        var $c = $('#tgc-toast-stack');
        if ( !$c.length ) {
            $c = $('<div id="tgc-toast-stack" class="tgc-toast-stack" aria-live="polite"></div>');
            $(document.body).append($c);
        }
        return $c;
    }

    /**
     * Steam-style achievement popup (bottom-right).
     */
    function showAchievement(achievementId, title, description, iconChar) {
        var $wrap = ensureContainer();
        var $el = $('<div class="tgc-toast tgc-toast--achievement"></div>');
        var icon = iconChar || '🏆';
        $el.html(
            '<div class="tgc-toast__icon">' + icon + '</div>' +
            '<div class="tgc-toast__body">' +
                '<div class="tgc-toast__label">' + i18._('tgc-toast-achievement-label') + '</div>' +
                '<div class="tgc-toast__title"></div>' +
                '<div class="tgc-toast__desc"></div>' +
            '</div>'
        );
        $el.find('.tgc-toast__title').text(title);
        $el.find('.tgc-toast__desc').text(description);
        $wrap.append($el);
        stack += 1;
        var bottom = BOTTOM + ($wrap.children().length - 1) * (86 + GAP);
        $el.css({bottom: bottom + 'px', width: WIDTH + 'px'});

        setTimeout(function() {
            $el.addClass('tgc-toast--in');
        }, 20);

        setTimeout(function() {
            $el.removeClass('tgc-toast--in').addClass('tgc-toast--out');
            setTimeout(function() {
                $el.remove();
                stack = Math.max(0, stack - 1);
            }, 400);
        }, 5200);
    }

    return {
        showAchievement: showAchievement
    };
});
