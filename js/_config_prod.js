var
    // Static server
    SS = '',
    FULLADDR = '',
    // Backend API address
    API_ADDR = '',
    // Game version
    VERSION = '1.0.0',
    // Revision of your all static files (after update you should increase this value)
    REVISION = '?v=1',
    // Available episodes
    EPISODES = ['space'],
    ENV = 'prod',
    /** Empty = call /api on the same site (game + API served together). Set full URL only if API is elsewhere. */
    TGC_CLOUD_SYNC_URL = '',
    TGC_CLOUD_SYNC_TOKEN = '';