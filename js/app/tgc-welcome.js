
define('app/tgc-welcome', ['app/tgc-profile', 'app/i18/_', 'app/tgc-cloud'], function(tgcProfile, i18, tgcCloud) {

    function buildHtml() {
        if ( $('#tgc-welcome').length ) {
            return;
        }
        var html = [
            '<div id="tgc-welcome" class="tgc-welcome" role="dialog" aria-modal="true">',
            '<div class="tgc-welcome__backdrop"></div>',
            '<div class="tgc-welcome__panel">',
            '<div class="tgc-welcome__logo">TGC-Arkade</div>',
            '<p class="tgc-welcome__tagline">', i18._('tgc-welcome-tagline'), '</p>',
            '<label class="tgc-welcome__label" for="tgc-welcome-name">', i18._('tgc-welcome-username-label'), '</label>',
            '<input id="tgc-welcome-name" class="tgc-welcome__input" type="text" maxlength="24" autocomplete="username" placeholder="', i18._('tgc-welcome-placeholder'), '" />',
            '<p class="tgc-welcome__hint">', i18._('tgc-welcome-hint'), '</p>',
            '<button type="button" class="tgc-welcome__btn" id="tgc-welcome-go">', i18._('tgc-welcome-play'), '</button>',
            '</div></div>'
        ].join('');
        $(document.body).append(html);
    }

    function finish($root, done) {
        $root.fadeOut(200, function() {
            $root.remove();
            if ( done ) {
                done();
            }
        });
    }

    /**
     * Runs callback when a valid username exists (cloud register + load).
     */
    function ensureUsername(done) {
        buildHtml();
        var $root = $('#tgc-welcome');

        if ( !tgcCloud.enabled() ) {
            $root.show();
            $root.find('.tgc-welcome__tagline').text(i18._('tgc-welcome-no-cloud'));
            $root.find('.tgc-welcome__label, #tgc-welcome-name, .tgc-welcome__hint, #tgc-welcome-go').remove();
            return;
        }

        if ( tgcProfile.getUsername() ) {
            $root.remove();
            if ( done ) {
                done();
            }
            return;
        }

        tgcProfile.restoreSessionUser(function() {
            if ( tgcProfile.getUsername() ) {
                $root.remove();
                if ( done ) {
                    done();
                }
                return;
            }

            $root.show();
            var $input = $('#tgc-welcome-name');
            var $btn = $('#tgc-welcome-go');
            $input.focus();

            function submit() {
                var name = $input.val();
                tgcProfile.setUsername(name, function(ok) {
                    if ( !ok ) {
                        $input.addClass('tgc-welcome__input--error');
                        return;
                    }
                    $input.removeClass('tgc-welcome__input--error');
                    finish($root, done);
                });
            }

            $btn.off('click.tgc').on('click.tgc', function(e) {
                e.preventDefault();
                submit();
            });
            $input.off('keydown.tgc').on('keydown.tgc', function(e) {
                if ( e.keyCode === 13 ) {
                    e.preventDefault();
                    submit();
                }
            });
        });
    }

    return {
        ensureUsername: ensureUsername
    };
});
