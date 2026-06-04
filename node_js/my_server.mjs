import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Конфигурация
const PORT = 3000;
const ESP32_TARGET = 'http://dashboard'; // Твоето ESP IP или http://dashboard

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Четене на JSON и Текст от фронтенда при POST заявки
app.use(express.json());
app.use(express.text());

/**
 * 2. ЧИСТО ПРОКСИ (Без външни библиотеки)
 * Закачаме го с app.use('/api') - така хваща всичко след /api без чупливи звездички!
 */
app.use('/api', async (req, res) => {
    // ВАЖНО: Тъй като ползваме app.use('/api'), req.originalUrl съдържа пълния път (напр. /api/v1/system/info)
    const targetUrl = `${ESP32_TARGET}${req.originalUrl}`;
    
    console.log(`📡 Проксиране на заявка: [${req.method}] ${req.originalUrl} -> ${targetUrl}`);

    try {
        // Правим заявката директно към ESP32
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                ...req.headers,
                host: new URL(ESP32_TARGET).host
            },
            // Препращаме тялото само ако заявката е метод за модификация (POST/PUT/PATCH)
            body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined
        });

        // Взимаме текста/JSON данните от ESP32
        const data = await response.text();
        
        // Връщаме статус кода и данните обратно към браузъра
        res.status(response.status).send(data);

    } catch (error) {
        console.error(`❌ Грешка при връзка с ESP32:`, error.message);
        res.status(502).send(`Грешка при комуникация с ESP32 платката.`);
    }
});

/**
 * 3. СЕРВИРАНЕ НА СТАТИЧНИ ФАЙЛОВЕ
 */
const staticFilesPath = path.join(__dirname, '../html_files');
app.use(express.static(staticFilesPath));

/**
 * 4. ДЕФОЛТЕН РУТЕР (Fallback)
 * И тук махаме уилдкард звездите - просто празен app.use в края хваща всичко останало!
 */
app.use((req, res) => {
    res.sendFile(path.join(staticFilesPath, 'index.html'));
});

// 5. Стартиране
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Сървърът стартира успешно на http://localhost:${PORT}`);
    console.log(`📡 Всички '/api' заявки се проксират към: ${ESP32_TARGET}`);
    console.log(`====================================================`);
});
