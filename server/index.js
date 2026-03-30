/**
 * TGC-Arkade cloud API — profiles, progressive unlock, session scores, leaderboard.
 * Run: npm install && npm start  (default port 3847)
 *
 * CORS: open for development; tighten for production.
 */

var fs = require('fs');
var path = require('path');
var express = require('express');
var cors = require('cors');

var PORT = process.env.PORT || 3847;
var DATA_FILE = path.join(__dirname, 'data.json');
var GAME_ROOT = path.resolve(__dirname, '..');

function loadDb() {
    try {
        var raw = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        return { profiles: {}, leaderboard: [] };
    }
}

function saveDb(db) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function defaultProfile(username) {
    return {
        username: username,
        maxUnlockedLevelIndex: 0,
        stats: {
            playTimeMs: 0,
            deaths: 0,
            bestSessionScore: 0,
            highScore: 0,
            totalScore: 0,
            roundsWon: 0,
            maxLevelBeat: 0,
            fastestRoundSec: 0,
            fullLivesWins: 0
        },
        achievements: {},
        cloudSyncedAt: Date.now()
    };
}

function mergeProfile(server, client) {
    if ( !client || typeof client !== 'object' ) {
        return server;
    }
    var out = JSON.parse(JSON.stringify(server));
    if ( typeof client.maxUnlockedLevelIndex === 'number' ) {
        out.maxUnlockedLevelIndex = Math.max(
            out.maxUnlockedLevelIndex | 0,
            client.maxUnlockedLevelIndex | 0
        );
    }
    if ( client.stats && typeof client.stats === 'object' ) {
        var s = out.stats;
        var cs = client.stats;
        s.playTimeMs = Math.max(s.playTimeMs | 0, cs.playTimeMs | 0);
        s.deaths = Math.max(s.deaths | 0, cs.deaths | 0);
        s.bestSessionScore = Math.max(s.bestSessionScore | 0, cs.bestSessionScore | 0);
        s.highScore = Math.max(s.highScore | 0, cs.highScore | 0);
        s.totalScore = Math.max(s.totalScore | 0, cs.totalScore | 0);
        s.roundsWon = Math.max(s.roundsWon | 0, cs.roundsWon | 0);
        s.maxLevelBeat = Math.max(s.maxLevelBeat | 0, cs.maxLevelBeat | 0);
        if ( cs.fastestRoundSec | 0 ) {
            if ( !s.fastestRoundSec || (cs.fastestRoundSec | 0) < (s.fastestRoundSec | 0) ) {
                s.fastestRoundSec = cs.fastestRoundSec | 0;
            }
        }
        s.fullLivesWins = Math.max(s.fullLivesWins | 0, cs.fullLivesWins | 0);
    }
    if ( client.achievements && typeof client.achievements === 'object' ) {
        out.achievements = out.achievements || {};
        Object.keys(client.achievements).forEach(function(k) {
            var a = client.achievements[k];
            var b = out.achievements[k];
            if ( !b || (a | 0) < (b | 0) ) {
                out.achievements[k] = a;
            }
        });
    }
    return out;
}

function recomputeLeaderboard(db) {
    var bestByUser = {};
    db.leaderboard.forEach(function(row) {
        var u = row.username;
        if ( !bestByUser[u] || row.score > bestByUser[u].score ) {
            bestByUser[u] = { username: u, score: row.score, at: row.at };
        }
    });
    var list = Object.keys(bestByUser).map(function(u) {
        return bestByUser[u];
    });
    list.sort(function(a, b) {
        return b.score - a.score;
    });
    return list.slice(0, 200);
}

var app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '256kb' }));

app.get('/api/health', function(req, res) {
    res.json({ ok: true, t: Date.now() });
});

app.get('/api/leaderboard', function(req, res) {
    var db = loadDb();
    var top = recomputeLeaderboard(db).slice(0, 100);
    res.json({ entries: top, updatedAt: Date.now() });
});

app.get('/api/profile/:username', function(req, res) {
    var name = decodeURIComponent(req.params.username || '').trim();
    if ( !name ) {
        return res.status(400).json({ error: 'username required' });
    }
    var db = loadDb();
    var p = db.profiles[name];
    if ( !p ) {
        return res.status(404).json({ error: 'not found' });
    }
    res.json(p);
});

app.put('/api/profile/:username', function(req, res) {
    var name = decodeURIComponent(req.params.username || '').trim();
    if ( !name || name.length > 32 ) {
        return res.status(400).json({ error: 'invalid username' });
    }
    var db = loadDb();
    var existing = db.profiles[name] || defaultProfile(name);
    var merged = mergeProfile(existing, req.body);
    merged.username = name;
    merged.cloudSyncedAt = Date.now();
    db.profiles[name] = merged;
    saveDb(db);
    res.json(merged);
});

app.post('/api/register', function(req, res) {
    var name = (req.body && req.body.username || '').trim();
    if ( name.length < 2 || name.length > 32 ) {
        return res.status(400).json({ error: 'invalid username' });
    }
    var db = loadDb();
    if ( !db.profiles[name] ) {
        db.profiles[name] = defaultProfile(name);
        saveDb(db);
    }
    res.json(db.profiles[name]);
});

app.post('/api/session-end', function(req, res) {
    var name = (req.body && req.body.username || '').trim();
    var sessionScore = parseInt(req.body && req.body.sessionScore, 10) || 0;
    if ( name.length < 2 ) {
        return res.status(400).json({ error: 'invalid username' });
    }
    if ( sessionScore < 0 || sessionScore > 999999999 ) {
        return res.status(400).json({ error: 'invalid score' });
    }
    var db = loadDb();
    var p = db.profiles[name] || defaultProfile(name);
    p.stats = p.stats || {};
    p.stats.deaths = (p.stats.deaths | 0) + 1;
    if ( sessionScore > (p.stats.bestSessionScore | 0) ) {
        p.stats.bestSessionScore = sessionScore;
    }
    if ( sessionScore > (p.stats.highScore | 0) ) {
        p.stats.highScore = sessionScore;
    }
    p.cloudSyncedAt = Date.now();
    db.profiles[name] = p;
    db.leaderboard.push({
        username: name,
        score: sessionScore,
        at: Date.now()
    });
    if ( db.leaderboard.length > 5000 ) {
        db.leaderboard = db.leaderboard.slice(-4000);
    }
    saveDb(db);
    res.json({
        profile: p,
        leaderboardTop: recomputeLeaderboard(db).slice(0, 10)
    });
});

app.get('/', function(req, res) {
    res.sendFile(path.join(GAME_ROOT, 'index.html'));
});

app.use(function(req, res, next) {
    var p = req.path || '';
    if ( p.indexOf('/node_modules') === 0 || p.indexOf('/.git') === 0 || p.indexOf('/server') === 0 ) {
        return res.status(404).end();
    }
    next();
});

app.use(express.static(GAME_ROOT, {
    index: false,
    dotfiles: 'ignore',
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
}));

app.listen(PORT, '0.0.0.0', function() {
    console.log('TGC-Arkade: game + API on port ' + PORT);
});
