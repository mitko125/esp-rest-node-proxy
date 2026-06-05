// Настройки на графиката
const POLLING_INTERVAL = 500;  // Разпитване на ESP32 на всеки 0.5 секунди
const MAX_POINTS = 20;         // Колко точки максимално да се виждат на екрана
const dataPoints = [];         // Масив, в който ще пазим последните 20 стойности

// Взимаме HTML елементите
const canvas = document.getElementById('tempChart');
const ctx = canvas.getContext('2d');
const tempDisplay = document.getElementById('tempValue');

// Функция за изчертаване на графиката върху Canvas платното
function drawChart() {
    // 1. Изчистваме старото платно
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40; // Отстояния от краищата

    // Хоризонтални и вертикални граници на самата решетка
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // 2. Рисуваме фоновата решетка и скалата от 0 до 20
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';

    const steps = 4; // 4 деления през 5 единици (0, 5, 10, 15, 20)
    for (let i = 0; i <= steps; i++) {
        const val = (20 / steps) * i;
        // Изчисляваме Y координатата за съответната стойност
        const y = height - padding - (val / 20) * graphHeight;
        
        // Линия на решетката
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        // Текст на скалата (отляво)
        ctx.fillText(val + '°C', padding - 35, y + 4);
    }

    // Ако все още нямаме данни, спираме дотук
    if (dataPoints.length === 0) return;

    // 3. Изчисляваме координатите и рисуваме плавната линия на данните
    ctx.strokeStyle = '#3b82f6'; // Красиво синьо
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();

    for (let i = 0; i < dataPoints.length; i++) {
        // Разпределяме точките по Х оста равномерно
        const x = padding + (i / (MAX_POINTS - 1)) * graphWidth;
        // Обръщаме Y оста, защото при Canvas (0,0) е горният ляв ъгъл!
        const y = height - padding - (dataPoints[i] / 20) * graphHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    // 4. Нанасяме точки и лека сянка (градиент) под линията за професионален ефект
    if (dataPoints.length > 0) {
        const lastIndex = dataPoints.length - 1;
        const lastX = padding + (lastIndex / (MAX_POINTS - 1)) * graphWidth;
        const lastY = height - padding - (dataPoints[lastIndex] / 20) * graphHeight;

        // Рисуваме малко кръгче на последната точка
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// Функция за вземане на "raw" данните от ESP32 през проксито
async function fetchTemperature() {
    try {
        const response = await fetch('/api/v1/temp/raw');
        if (!response.ok) throw new Error(`Статус: ${response.status}`);

        const data = await response.json();
        const value = data.raw; // Взимаме стойността от { "raw": 3 }

        // Обновяваме големия текстов дисплей на екрана
        tempDisplay.textContent = `${value} °C`;

        // Добавяме новата точка в масива
        dataPoints.push(value);

        // Ако точките станат повече от 20, изтриваме най-старата отпред
        if (dataPoints.length > MAX_POINTS) {
            dataPoints.shift();
        }

        // Прерисуваме графиката с новите данни
        drawChart();

    } catch (error) {
        console.error("Грешка при вземане на температура:", error);
        tempDisplay.textContent = "Грешка при връзка";
    }
}

// Първоначално изчертаване на празната решетка веднага след зареждане
drawChart();

// Извикваме веднага първата точка
fetchTemperature();

// Стартираме таймера за разпитване на всеки 0.5 секунди
setInterval(fetchTemperature, POLLING_INTERVAL);
