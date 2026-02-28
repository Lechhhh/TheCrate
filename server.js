const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const ytSearch = require('yt-search');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const dbPath = path.join(__dirname, 'database.json');

const defaultDB = {
  "us_kendrick_drake_24": { "category": "news", "region": "US", "searchTags": "kendrick lamar drake beef not like us", "title": "Kendrick Lamar vs Drake: Ostateczny upadek OVO.", "snippet": "Największy beef tej dekady. Jak Kendrick zdominował popkulturę i zniszczył wizerunek Drake'a.", "content": "<p>Wiosna 2024 roku zapisze się na kartach historii hip-hopu pogrubioną czcionką. Konflikt, który kiełkował od ponad dekady, ostatecznie eksplodował. Kendrick Lamar metodycznie zdemontował publiczny wizerunek Drake'a. Największym ciosem okazało się 'Not Like Us'. Zdominowało ono listy przebojów bronią, którą Drake zawsze uważał za swoją własną domenę.</p><br><iframe class=\"media-embed\" src=\"https://www.youtube.com/embed/T6eK-2OQtew\" frameborder=\"0\" allowfullscreen></iframe>" },
  "pl_underground_nowa_fala": { "category": "news", "region": "PL", "searchTags": "mlody west wane aleshen underground polska nowa fala", "title": "Młody West, Wane, Aleshen: Cyfrowy bunt.", "snippet": "Bez wielkich labeli, bez kompromisów. Jak nowa fala zdominowała SoundClouda.", "content": "<p>Polska scena undergroundowa przechodzi potężną transformację. Odcinając się od starych schematów, artyści tacy jak Młody West, Wane czy Aleshen udowadniają, że inspiracje z USA można przekuć w coś autorskiego. Nieszablonowe flow i melodie tonące w efektach to dzisiaj ich wizytówka.</p><br><iframe class=\"media-embed\" src=\"https://www.youtube.com/embed/W5TbzL5r1hM\" frameborder=\"0\" allowfullscreen></iframe>" },
  "us_carti_all_red_leak": { "category": "leak", "region": "US", "searchTags": "playboi carti all red deep voice leak snippet opium", "title": "Playboi Carti - 'ALL RED' (Studio Leak)", "snippet": "Najbardziej poszukiwany plik na serwerach Discorda, który ukształtował nową erę Cartiego.", "content": "<p>Zanim utwór 'All Red' wyszedł oficjalnie, ten konkretny snippet dosłownie trząsł całym amerykańskim podziemiem. To właśnie tutaj po raz pierwszy w pełni słyszymy Cartiego eksperymentującego z tzw. 'deep voice'. Sprawdź to uderzenie poniżej:</p><br><iframe class=\"media-embed\" src=\"https://www.youtube.com/embed/kYJjH1k821o\" frameborder=\"0\" allowfullscreen></iframe>" }
};

app.use(express.json()); 
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/articles', (req, res) => {
    try {
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify(defaultDB, null, 2), 'utf8');
        const rawData = fs.readFileSync(dbPath, 'utf8');
        const parsedData = JSON.parse(rawData);
        if (!parsedData || Object.keys(parsedData).length < 2) return res.json(defaultDB);
        res.json(parsedData);
    } catch (err) { res.json(defaultDB); }
});

// SILNIK AI DARMOWY GPT-4o
function callSmartAI(systemMsg, userMsg, isJsonMode = false) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }],
            model: 'openai',
            jsonMode: isJsonMode
        });
        const options = { hostname: 'text.pollinations.ai', path: '/', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        });
        req.on('error', e => reject(e));
        req.write(payload);
        req.end();
    });
}

// MÓZG CHATBOTA
app.post('/api/chat', async (req, res) => {
    const userMsg = req.body.message;
    try {
        const sysPrompt = `Jesteś redaktorem polskiego serwisu o rapie 'The Crate'. Odpowiadaj TYLKO po polsku. 
        1. Bądź krótki i wyluzowany (max 2-3 zdania). 
        2. KATEGORYCZNY ZAKAZ używania "yo", "bro". 
        3. Używaj polskiego slangu: "mordo", "kocur", "rozjebane".
        4. Używaj HTML (<br>, <strong>).`;
        const responseText = await callSmartAI(sysPrompt, userMsg, false);
        res.json({ reply: responseText.replace(/\n/g, '<br>') });
    } catch (error) { res.json({ reply: "Serwery dymią. Daj mi sekundę." }); }
});

// MULTIPLAYER I GRY
const activeRooms = {};
io.on('connection', (socket) => {
    socket.emit('updateRooms', activeRooms);
    socket.on('createRoom', (data) => {
        const roomId = 'CYPHER-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        activeRooms[roomId] = { id: roomId, hostName: data.alias, hostSocket: socket.id, isLocked: !!data.password, password: data.password, players: 1 };
        socket.join(roomId); socket.emit('roomCreated', activeRooms[roomId]); io.emit('updateRooms', activeRooms);
    });
    socket.on('joinRoom', (data) => {
        const room = activeRooms[data.roomId];
        if (!room || (room.isLocked && room.password !== data.password) || room.players >= 2) return socket.emit('gameFeedback', { type: 'error', msg: 'Błąd dołączania.' });
        room.players++; room.player2Name = data.alias; room.player2Socket = socket.id;
        socket.join(room.id); io.to(room.id).emit('gameStarted', room); io.emit('updateRooms', activeRooms);
    });
    socket.on('searchTrack', async (query) => {
        try { const r = await ytSearch(query); socket.emit('searchResults', r.videos.slice(0, 4).map(v => ({ id: v.videoId, title: v.title, thumb: v.thumbnail }))); } catch (e) {}
    });
    socket.on('searchTrackMixer', async (data) => {
        try { 
            const r = await ytSearch(data.query); 
            if(r && r.videos && r.videos.length > 0) socket.emit('searchResultsMixer', { videos: r.videos.slice(0, 4).map(v => ({ id: v.videoId, title: v.title, thumb: v.thumbnail })), deck: data.deck, error: false }); 
            else socket.emit('searchResultsMixer', { videos: [], deck: data.deck, error: true }); 
        } catch (e) { socket.emit('searchResultsMixer', { videos: [], deck: data.deck, error: true }); }
    });
    socket.on('submitTrack', (data) => {
        const room = activeRooms[data.roomId];
        if(room) { room.currentTrack = data.ytId; room.originalTitle = data.title; io.to(room.id).emit('trackPlaying', { currentTrack: room.currentTrack }); }
    });
    socket.on('updateStatus', (data) => socket.to(data.roomId).emit('opponentStatus', data.msg));
    socket.on('makeGuess', (data) => {
        const room = activeRooms[data.roomId];
        if(room) {
            if(data.guess === "timeout") io.to(room.id).emit('gameOver', { winner: room.hostName, points: 0, msg: `CZAS MINĄŁ! To było: ${room.originalTitle}` });
            else {
                const g = data.title.toLowerCase().replace(/[^a-z0-9]/g, ''); const c = room.originalTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
                if(data.ytId === room.currentTrack || c.includes(g) || g.includes(c)) io.to(room.id).emit('gameOver', { winner: room.player2Name, points: data.points, msg: `TRAFIENIE! Wygrywa: ${room.player2Name} (+${data.points} PKT). Track: ${room.originalTitle}` });
                else io.to(room.id).emit('gameOver', { winner: room.hostName, points: 0, msg: `PUDŁO! To było: ${room.originalTitle}` });
            }
            delete activeRooms[data.roomId]; io.emit('updateRooms', activeRooms);
        }
    });
});

// AUTODIGGER Z NOWYMI RYGORYSTYCZNYMI ZASADAMI
async function runAutoDigger() {
    console.log('[AUTODIGGER] Szukam ŚWIEŻYCH i precyzyjnych wycieków...');
    let currentDB = {}; 
    try {
        if (fs.existsSync(dbPath)) currentDB = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch(e) { currentDB = JSON.parse(JSON.stringify(defaultDB)); }

    try {
        const sysPrompt = `Jesteś profesjonalnym, polskim dziennikarzem rapowym THE CRATE. 
        ZŁOTA ZASADA 1: Treść (content) oraz zajawka (snippet) MUSZĄ BYĆ W 100% NAPISANE PO POLSKU, aby polski czytelnik to zrozumiał. 
        ZŁOTA ZASADA 2: Zakaz tłumaczenia na polski tytułów piosenek i rapowego slangu (słowa leak, snippet, type beat, swag zostają po angielsku). 
        ZŁOTA ZASADA 3: Wymyślasz artykuł o JEDNYM DOKŁADNYM utworze/wycieku. W polu searchQuery wpisujesz DOKŁADNIE ksywę rapera, tytuł tego wycieku i słowo "leak", aby youtube znalazł ten konkretny materiał.`;

        const usrPrompt = `Wybierz LOSOWEGO rapera (PL np. Wane, Młody West LUB US np. Playboi Carti, Travis Scott). Napisz długi artykuł (4 akapity) o jego najnowszym WYCIEKU (leak).
        ZWRÓĆ TYLKO PONIŻSZĄ STRUKTURĘ JSON (bez wyrazu json i markdownu):
        {
          "region": "PL lub US",
          "title": "Tytuł artykułu z ksywą rapera", 
          "snippet": "Długa, polska zajawka", 
          "content": "Bardzo długa treść w formacie HTML po polsku (użyj tagów <p>).", 
          "searchQuery": "[Ksywa rapera] [DOKŁADNY TYTUŁ UTWORU Z ARTYKUŁU] leak audio"
        }`;

        let aiText = await callSmartAI(sysPrompt, usrPrompt, true);
        aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        let jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if(!jsonMatch) return console.log("[AUTODIGGER] Błąd formatowania JSON.");

        const newsObj = JSON.parse(jsonMatch[0]);
        if (!newsObj.title || !newsObj.content || !newsObj.searchQuery) return;
        if (Object.values(currentDB).some(item => item.title === newsObj.title)) return console.log("[AUTODIGGER] Duplikat. Pomijam.");

        console.log(`[AUTODIGGER] Szukam na YouTube DOKŁADNIE frazy: "${newsObj.searchQuery}"`);
        const searchResults = await ytSearch(newsObj.searchQuery);
        let finalContent = newsObj.content;

        if (searchResults && searchResults.videos.length > 0) {
            const videoId = searchResults.videos[0].videoId;
            finalContent += `<h3 style="color: var(--accent-blood); margin-top: 2rem;">/ ZNALEZIONY DŹWIĘK (FRESH LEAK)</h3><iframe class="media-embed" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
        } else {
            console.log("[AUTODIGGER] Nie znalazłem dokładnego filmu na YouTube. Anuluję dodanie artykułu, by uniknąć błędu.");
            return;
        }

        currentDB['auto_' + Date.now()] = {
            category: "leak", 
            region: newsObj.region === 'PL' ? 'PL' : 'US',
            searchTags: newsObj.title.toLowerCase() + " ai news leak",
            title: newsObj.title, 
            snippet: newsObj.snippet, 
            content: finalContent
        };

        fs.writeFileSync(dbPath, JSON.stringify(currentDB, null, 2), 'utf8');
        console.log(`[AUTODIGGER] SUKCES! Dodano DŁUGI artykuł o: ${newsObj.title}`);

        // WYSYŁANIE ALERTU DO WSZYSTKICH NA STRONIE!
        io.emit('newArticleAdded', { title: newsObj.title, snippet: newsObj.snippet });

    } catch(e) { console.log("[AUTODIGGER] Błąd przesyłu, powtórka wkrótce."); }
}

setTimeout(runAutoDigger, 4000); 
setInterval(runAutoDigger, 180000);

const PORT = 3000;
server.listen(PORT, () => console.log(`[THE CRATE] System działa (Port: ${PORT}). GPT-4o AKTYWNE.`));