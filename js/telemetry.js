// Телеметрія та графіки
const Telemetry = {
    // Ініціалізація Chart.js
    charts: {},

    // Створити speed trace графік
    async createSpeedTrace(canvasId, sessionKey, driverNumbers) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const datasets = [];
        
        for (const driverNum of driverNumbers) {
            const carData = await API.getCarData(sessionKey, driverNum);
            if (carData.length === 0) continue;

            // Сортувати по даті
            const sortedData = carData.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Створити dataset
            datasets.push({
                label: `Driver #${driverNum}`,
                data: sortedData.map((d, i) => ({ x: i, y: d.speed || 0 })),
                borderColor: this.getDriverColor(driverNum),
                backgroundColor: this.getDriverColor(driverNum) + '20',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4
            });
        }

        // Видалити старий графік якщо існує
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        // Створити новий графік
        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        labels: { color: '#fff' }
                    },
                    title: {
                        display: true,
                        text: 'Speed Trace (km/h)',
                        color: '#e10600',
                        font: { size: 18, weight: 'bold' }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Time', color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#888' }
                    },
                    y: {
                        title: { display: true, text: 'Speed (km/h)', color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#888' }
                    }
                }
            }
        });
    },

    // Створити throttle/brake графік
    async createThrottleBrake(canvasId, sessionKey, driverNumber) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const carData = await API.getCarData(sessionKey, driverNumber);
        if (carData.length === 0) return;

        const sortedData = carData.sort((a, b) => new Date(a.date) - new Date(b.date));

        const datasets = [
            {
                label: 'Throttle',
                data: sortedData.map((d, i) => ({ x: i, y: d.throttle || 0 })),
                borderColor: '#00ff00',
                backgroundColor: '#00ff0030',
                borderWidth: 2,
                pointRadius: 0,
                fill: true
            },
            {
                label: 'Brake',
                data: sortedData.map((d, i) => ({ x: i, y: d.brake ? 100 : 0 })),
                borderColor: '#ff0000',
                backgroundColor: '#ff000030',
                borderWidth: 2,
                pointRadius: 0,
                fill: true
            }
        ];

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#fff' } },
                    title: {
                        display: true,
                        text: 'Throttle & Brake Application',
                        color: '#e10600',
                        font: { size: 18, weight: 'bold' }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Time', color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#888' }
                    },
                    y: {
                        title: { display: true, text: 'Application %', color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#888' },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    },

    // Створити gear changes графік
    async createGearChanges(canvasId, sessionKey, driverNumber) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const carData = await API.getCarData(sessionKey, driverNumber);
        if (carData.length === 0) return;

        const sortedData = carData.sort((a, b) => new Date(a.date) - new Date(b.date));

        const dataset = {
            label: 'Gear',
            data: sortedData.map((d, i) => ({ x: i, y: d.n_gear || 0 })),
            borderColor: '#00d4ff',
            backgroundColor: '#00d4ff40',
            borderWidth: 2,
            stepped: true,
            pointRadius: 0
        };

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: { datasets: [dataset] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#fff' } },
                    title: {
                        display: true,
                        text: 'Gear Changes',
                        color: '#e10600',
                        font: { size: 18, weight: 'bold' }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Time', color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#888' }
                    },
                    y: {
                        title: { display: true, text: 'Gear', color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { 
                            color: '#888',
                            stepSize: 1
                        },
                        min: 0,
                        max: 8
                    }
                }
            }
        });
    },

    // Lap times comparison
    async createLapComparison(canvasId, sessionKey, driverNumbers) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const datasets = [];

        for (const driverNum of driverNumbers) {
            const laps = await API.getLaps(sessionKey, driverNum);
            if (laps.length === 0) continue;

            const lapTimes = laps
                .filter(lap => lap.lap_duration && lap.lap_duration > 0)
                .map(lap => ({
                    x: lap.lap_number,
                    y: lap.lap_duration
                }));

            datasets.push({
                label: `Driver #${driverNum}`,
                data: lapTimes,
                borderColor: this.getDriverColor(driverNum),
                backgroundColor: this.getDriverColor(driverNum) + '40',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5
            });
        }

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#fff' } },
                    title: {
                        display: true,
                        text: 'Lap Times Comparison (seconds)',
                        color: '#e10600',
                        font: { size: 18, weight: 'bold' }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Lap Number', color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#888' }
                    },
                    y: {
                        title: { display: true, text: 'Lap Time (s)', color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#888' }
                    }
                }
            }
        });
    },

    // RPM графік
    async createRPM(canvasId, sessionKey, driverNumber) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const carData = await API.getCarData(sessionKey, driverNumber);
        if (carData.length === 0) return;

        const sortedData = carData.sort((a, b) => new Date(a.date) - new Date(b.date));

        const dataset = {
            label: 'RPM',
            data: sortedData.map((d, i) => ({ x: i, y: d.rpm || 0 })),
            borderColor: '#ff6b00',
            backgroundColor: '#ff6b0030',
            borderWidth: 2,
            pointRadius: 0,
            fill: true
        };

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: { datasets: [dataset] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#fff' } },
                    title: {
                        display: true,
                        text: 'Engine RPM',
                        color: '#e10600',
                        font: { size: 18, weight: 'bold' }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Time', color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#888' }
                    },
                    y: {
                        title: { display: true, text: 'RPM', color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#888' }
                    }
                }
            }
        });
    },

    // Отримати колір для пілота
    getDriverColor(driverNum) {
        const colors = {
            1: '#3671C6',   // Verstappen - Red Bull
            4: '#FF8000',   // Norris - McLaren
            16: '#E8002D',  // Leclerc - Ferrari
            44: '#27F4D2',  // Hamilton - Mercedes
            55: '#E8002D',  // Sainz - Ferrari
            63: '#27F4D2',  // Russell - Mercedes
            81: '#FF8000',  // Piastri - McLaren
        };
        return colors[driverNum] || '#e10600';
    },

    // Cleanup
    destroy(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }
};
