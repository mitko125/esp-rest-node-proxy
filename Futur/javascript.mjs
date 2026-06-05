import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dgram from 'dgram'; // Вграден модул за UDP пакети

const PORT = 3000;
const UDP_PORT = 41234; // Портът, на който ESP32 ще изпраща broadcast пакети

// В началото слагаме дефолтна стойност (фалбек)
let ESP32_TARGET = 'http://dashboard.local'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json());
app.use(express.text());

/**
 * АВТОМАТИЧНО ОТКРИВАНЕ ЧРЕЗ UDP BROADCAST
 */
const udpServer = dgram.createSocket('udp4');

udpServer.on('message', (msg, rinfo) => {
    const messageStr = msg.toString().trim();
    
    // Проверяваме дали съобщението идва от нашето ESP32
    if (messageStr.startsWith('ESP32_IDENT:')) {
        const detectedUrl = messageStr.replace('ESP32_IDENT:', '');
        
        // Ако IP-то се е променило, го обновяваме в движение!
        if (ESP32_TARGET !== detectedUrl) {
            ESP32_TARGET = detectedUrl;
            console.log(`📡 [Автоматично откриване] Намерено ESP32 на адрес: ${ESP32_TARGET}`);
        }
    }
});

// Старт на UDP слушателя
udpServer.bind(UDP_PORT, () => {
    console.log(`🔍 Слушане за ESP32 в локалната мрежа на UDP порт ${UDP_PORT}...`);
});

/**
 * 2. ЧИСТО ПРОКСИ (Сега използва динамичното ESP32_TARGET)
 */
app.use('/api', async (req, res) => {
    // Ако ESP32 все още не е открито и караме на дефолт, targetUrl ще се сглоби с него
    const targetUrl = `${ESP32_TARGET}${req.originalUrl}`;
    
    console.log(`📡 Проксиране: [${req.method}] ${req.originalUrl} -> ${targetUrl}`);

    try {
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                ...req.headers,
                host: new URL(ESP32_TARGET).host
            },
            body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined
        });

        const data = await response.text();
        res.status(response.status).send(data);
    } catch (error) {
        console.error(`❌ Грешка при връзка с ${ESP32_TARGET}:`, error.message);
        res.status(502).send(`Грешка при комуникация с ESP32 платката.`);
    }
});

// 3. Статични файлове
const staticFilesPath = path.join(__dirname, '../html_files');
app.use(express.static(staticFilesPath));

// 4. Fallback
app.use((req, res) => {
    res.sendFile(path.join(staticFilesPath, 'index.html'));
});

// 5. Стартиране
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Сървърът работи на http://localhost:${PORT}`);
    console.log(`====================================================`);
});
