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
    /**
     * Empty = same origin (/api/...) cuando el juego y el servidor van juntos (Render con npm start, localhost).
     * En GitHub Pages no hay API: usa tu URL pública de Render (cambia el nombre si tu servicio no es tgc-arkade).
     */
    TGC_CLOUD_SYNC_URL = (typeof location !== 'undefined' && /\.github\.io$/i.test(location.hostname))
        ? 'https://tgc-arkade.onrender.com'
        : '',
    TGC_CLOUD_SYNC_TOKEN = '';