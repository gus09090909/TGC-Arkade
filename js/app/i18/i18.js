
define('app/i18/i18', 
[
    'app/i18/languages/en-us'
],
function(enUs) {

    var _strings = {
            'lang-full-name:en-us': 'English'
        },
        _code = 'en-us';

    $.extend(_strings, enUs);

    function Lang() {

    }

    Lang.prototype._ = function(key) {
        return _strings[key];
    };

    Lang.prototype.setLanguage = function() {
        _code = 'en-us';
        $.extend(_strings, require('app/i18/languages/en-us'));
    };

    Lang.prototype.getLanguageCode = function() {
        return _code;
    };

    Lang.prototype.getLanguageName = function(code) {
        return _strings['lang-full-name:' + (code || _code)];
    };

    Lang.prototype.exists = function(code) {
        return code === 'en-us';
    };

    var instance = null;

    if ( instance === null ) {
        instance = new Lang();
    }

    return instance;
});
