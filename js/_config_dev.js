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
    ENV = 'dev',
    /** API base (no trailing slash), e.g. http://localhost:3847 — run server/npm start in /server */
    TGC_CLOUD_SYNC_URL = 'http://localhost:3847',
    /** Optional bearer token for your sync API */
    TGC_CLOUD_SYNC_TOKEN = '';