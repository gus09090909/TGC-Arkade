
define('app/tgc-welcome', ['app/tgc-profile', 'app/i18/_', 'app/tgc-cloud'], function(tgcProfile, i18, tgcCloud) {

    function buildHtml() {
        if ( $('#tgc-welcome').length ) {
            return;
        }
        var html = [
            '<div id="tgc-welcome" class="tgc-welcome" role="dialog" aria-modal="true">',
            '<div class="tgc-welcome__backdrop" aria-hidden="true"></div>',
            '<div class="tgc-welcome__vignette" aria-hidden="true"></div>',
            '<div class="tgc-welcome__panel">',
            '<div class="tgc-welcome__hero">',
            '<div class="tgc-welcome__badge">', i18._('tgc-welcome-badge'), '</div>',
            '<h1 class="tgc-welcome__title" aria-label="TGC-Arkade">',
            '<span class="tgc-welcome__title-main">TGC</span>',
            '<span class="tgc-welcome__title-sep">·</span>',
            '<span class="tgc-welcome__title-sub">ARKADE</span>',
            '</h1>',
            '<p class="tgc-welcome__tagline">', i18._('tgc-welcome-tagline'), '</p>',
            '<p class="tgc-welcome__hook">', i18._('tgc-welcome-hook'), '</p>',
            '</div>',
            '<div class="tgc-welcome__card">',
            '<div class="tgc-welcome__card-glow" aria-hidden="true"></div>',
            '<label class="tgc-welcome__label" for="tgc-welcome-name">', i18._('tgc-welcome-username-label'), '</label>',
            '<input id="tgc-welcome-name" class="tgc-welcome__input" type="text" maxlength="24" autocomplete="username" placeholder="', i18._('tgc-welcome-placeholder'), '" />',
            '<button type="button" class="tgc-welcome__btn" id="tgc-welcome-go">',
            '<span class="tgc-welcome__btn-glow" aria-hidden="true"></span>',
            '<span class="tgc-welcome__btn-label">', i18._('tgc-welcome-play'), '</span>',
            '</button>',
            '</div>',
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
            $root.addClass('tgc-welcome--no-cloud').show();
            $root.find('.tgc-welcome__hook').remove();
            $root.find('.tgc-welcome__tagline').text(i18._('tgc-welcome-no-cloud'));
            $root.find('.tgc-welcome__card').remove();
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
