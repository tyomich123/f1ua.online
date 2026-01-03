// Всі сторінки сайту
const Pages = {
    // === ГОЛОВНА ===
    async home() {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження...</div>';

        try {
            const currentSeason = CONFIG.CURRENT_SEASON;

            const [teams, articles, standings, races] = await Promise.all([
                API.getTeams(true),
                API.getArticles(3),
                API.getStandings(currentSeason),
                API.getRaces(currentSeason)
            ]);

            const today = new Date();
            const nextRace = (races || [])
                .map(r => ({ ...r, _date: r.date ? new Date(r.date) : null }))
                .filter(r => r._date && !isNaN(r._date) && r._date >= new Date(today.toDateString()))
                .sort((a, b) => a._date - b._date)[0];

            const top10 = (standings || []).slice(0, 10);

            app.innerHTML = `
                <section class="hero">
                    <div class="hero-content">
                        <h1 class="hero-title">ФОРМУЛА 1 УКРАЇНА</h1>
                        <p class="hero-subtitle">Новини, турнірні таблиці, команди, пілоти та телеметрія сезону ${currentSeason}.</p>

                        <div class="hero-links">
                            <a class="btn-primary" href="#" onclick="event.preventDefault(); router.navigate('/standings')">Турнірна таблиця</a>
                            <a class="btn-secondary" href="#" onclick="event.preventDefault(); router.navigate('/teams')">Команди</a>
                            <a class="btn-secondary" href="#" onclick="event.preventDefault(); router.navigate('/drivers')">Пілоти</a>
                            <a class="btn-secondary" href="#" onclick="event.preventDefault(); router.navigate('/telemetry')">Телеметрія</a>
                            <a class="btn-secondary" href="#" onclick="event.preventDefault(); router.navigate('/historical')">Історія</a>
                        </div>
                    </div>
                </section>

                <section class="teams-section">
                    <div class="container">
                        <h2 class="section-title">Команди F1 ${currentSeason}</h2>
                        <div class="teams-grid">
                            ${teams.map(team => `
                                <div class="team-card" onclick="router.navigate('/team/${team.slug}')" style="border-color: ${team.color}">
                                    <div class="team-color" style="background: ${team.color}"></div>
                                    <h3>${team.name}</h3>
                                    <p class="team-base">${team.base || 'База не вказана'}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </section>

                <section class="standings-preview">
                    <div class="container">
                        <h2 class="section-title">Турнірна таблиця (топ-10) — сезон ${currentSeason}</h2>
                        ${top10.length ? `
                            <table class="standings-table">
                                <thead>
                                    <tr>
                                        <th>Поз</th>
                                        <th>Пілот</th>
                                        <th>Команда</th>
                                        <th>Очки</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${top10.map(s => {
                                        const d = s.driver;
                                        const t = d?.team;
                                        return `
                                            <tr>
                                                <td class="position">${s.position}</td>
                                                <td>
                                                    <a href="#" onclick="event.preventDefault(); router.navigate('/driver/${d?.slug || ''}')" style="color:${t?.color || '#fff'}">
                                                        ${d ? `${d.firstName} ${d.lastName}` : 'N/A'}
                                                    </a>
                                                </td>
                                                <td>${t?.name || 'N/A'}</td>
                                                <td class="points">${s.points}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                            <div style="margin-top:12px;">
                                <a class="btn-secondary" href="#" onclick="event.preventDefault(); router.navigate('/standings')">Відкрити повну таблицю</a>
                            </div>
                        ` : `<p class="no-data">Немає даних турнірної таблиці.</p>`}
                    </div>
                </section>

                <section class="calendar-preview">
                    <div class="container">
                        <h2 class="section-title">Найближча гонка</h2>
                        ${nextRace ? `
                            <div class="race-next">
                                <h3>${nextRace.name || nextRace.raceName || 'Гран-прі'}</h3>
                                <p>${nextRace.circuit || ''} ${nextRace.country ? `, ${nextRace.country}` : ''}</p>
                                <p><strong>Дата:</strong> ${new Date(nextRace.date).toLocaleDateString('uk-UA')}</p>
                            </div>
                        ` : `<p class="no-data">Немає даних календаря або всі гонки вже завершені.</p>`}
                    </div>
                </section>

                <section class="articles-section">
                    <div class="container">
                        <h2 class="section-title">Останні новини</h2>
                        <div class="articles-grid">
                            ${articles.map(a => `
                                <div class="article-card" onclick="router.navigate('/article/${a.slug}')">
                                    <h3>${a.title}</h3>
                                    <p>${a.excerpt || ''}</p>
                                    <span class="article-date">${a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('uk-UA') : ''}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </section>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження головної сторінки</div>';
        }
    },

    // === КОМАНДИ ===
    async teams() {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження...</div>';

        try {
            const teams = await API.getTeams(true);

            app.innerHTML = `
                <div class="container page-container">
                    <h1 class="page-title">КОМАНДИ</h1>
                    <p class="page-subtitle">Команди сезону ${CONFIG.CURRENT_SEASON}</p>

                    <div class="teams-grid teams-page">
                        ${teams.map(team => `
                            <div class="team-card-large" onclick="router.navigate('/team/${team.slug}')">
                                <div class="team-header" style="background: ${team.color}">
                                    <h2>${team.name}</h2>
                                </div>
                                <div class="team-content">
                                    <p><strong>База:</strong> ${team.base || 'Не вказано'}</p>
                                    <p><strong>Керівник:</strong> ${team.teamChief || 'Не вказано'}</p>
                                    <p><strong>Техдиректор:</strong> ${team.technicalChief || 'Не вказано'}</p>
                                    <p><strong>Двигун:</strong> ${team.powerUnit || 'Не вказано'}</p>
                                    <p><strong>Шасі:</strong> ${team.chassis || 'Не вказано'}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження команд</div>';
        }
    },

    async team(slug) {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження...</div>';

        try {
            const team = await API.getTeam(slug);

            if (!team) {
                app.innerHTML = '<div class="error">Команду не знайдено</div>';
                return;
            }

            const drivers = await API.getDrivers(true);
            const teamDrivers = (drivers || []).filter(d => d.team?.slug === team.slug);

            app.innerHTML = `
                <div class="container page-container">
                    <div class="team-detail">
                        <div class="team-hero" style="border-color: ${team.color}">
                            <div class="team-hero-color" style="background: ${team.color}"></div>
                            <h1 class="page-title">${team.name}</h1>
                            <p class="page-subtitle">${team.base || 'База не вказана'}</p>
                        </div>

                        <div class="team-info-grid">
                            <div class="info-card">
                                <h2>Інформація</h2>
                                <p><strong>База:</strong> ${team.base || 'Не вказано'}</p>
                                <p><strong>Керівник:</strong> ${team.teamChief || 'Не вказано'}</p>
                                <p><strong>Техдиректор:</strong> ${team.technicalChief || 'Не вказано'}</p>
                                <p><strong>Двигун:</strong> ${team.powerUnit || 'Не вказано'}</p>
                                <p><strong>Шасі:</strong> ${team.chassis || 'Не вказано'}</p>
                            </div>

                            <div class="info-card">
                                <h2>Пілоти</h2>
                                ${teamDrivers.length ? `
                                    <div class="drivers-list">
                                        ${teamDrivers.map(d => `
                                            <div class="driver-mini" onclick="router.navigate('/driver/${d.slug}')">
                                                <span class="driver-number">#${d.number}</span>
                                                <span class="driver-name">${d.firstName} ${d.lastName}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : `<p class="no-data">Немає пілотів у цій команді</p>`}
                            </div>
                        </div>

                        ${team.description ? `
                            <div class="content-block">
                                <h2>Опис</h2>
                                <div class="rich-text">${team.description}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження команди</div>';
        }
    },

    // === ПІЛОТИ ===
    async drivers() {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження...</div>';

        try {
            const drivers = await API.getDrivers(true);

            app.innerHTML = `
                <div class="container page-container">
                    <h1 class="page-title">ПІЛОТИ</h1>
                    <p class="page-subtitle">Пілоти сезону ${CONFIG.CURRENT_SEASON}</p>

                    <div class="drivers-grid">
                        ${drivers.map(d => `
                            <div class="driver-card" onclick="router.navigate('/driver/${d.slug}')" style="border-color:${d.team?.color || '#333'}">
                                <div class="driver-top">
                                    <span class="driver-number">#${d.number || ''}</span>
                                    <span class="driver-code">${d.abbreviation || ''}</span>
                                </div>
                                <h3>${d.firstName} ${d.lastName}</h3>
                                <p class="driver-team">${d.team?.name || 'Команда не вказана'}</p>
                                <p class="driver-nat">${d.nationality || 'Не вказано'}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження пілотів</div>';
        }
    },

    async driver(slug) {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження...</div>';

        try {
            const d = await API.getDriver(slug);

            if (!d) {
                app.innerHTML = '<div class="error">Пілота не знайдено</div>';
                return;
            }

            app.innerHTML = `
                <div class="container page-container">
                    <div class="driver-detail" style="border-color:${d.team?.color || '#333'}">
                        <div class="driver-hero">
                            <div class="driver-hero-left">
                                <span class="driver-number-big">#${d.number || ''}</span>
                                <h1 class="page-title">${d.firstName} ${d.lastName}</h1>
                                <p class="page-subtitle">${d.team?.name || 'Команда не вказана'}</p>
                                <p><strong>Національність:</strong> ${d.nationality || 'Не вказано'}</p>
                            </div>
                        </div>

                        <div class="driver-info-grid">
                            <div class="info-card">
                                <h2>Дані</h2>
                                <p><strong>Дата народження:</strong> ${d.birthDate || 'Не вказано'}</p>
                                <p><strong>Місце народження:</strong> ${d.placeOfBirth || 'Не вказано'}</p>
                                <p><strong>Титули:</strong> ${d.worldChampionships ?? 'Не вказано'}</p>
                                <p><strong>Подіуми:</strong> ${d.podiums ?? 'Не вказано'}</p>
                                <p><strong>Гран-прі:</strong> ${d.grandPrixEntered ?? 'Не вказано'}</p>
                                <p><strong>Найкращий фініш:</strong> ${d.highestRaceFinish ?? 'Не вказано'}</p>
                            </div>

                            <div class="info-card">
                                <h2>Команда</h2>
                                ${d.team ? `
                                    <p><strong>Назва:</strong> ${d.team.name}</p>
                                    <p><strong>База:</strong> ${d.team.base || 'Не вказано'}</p>
                                    <p><strong>Двигун:</strong> ${d.team.powerUnit || 'Не вказано'}</p>
                                ` : `<p class="no-data">Команда не вказана</p>`}
                            </div>
                        </div>

                        ${d.biography ? `
                            <div class="content-block">
                                <h2>Біографія</h2>
                                <div class="rich-text">${d.biography}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження пілота</div>';
        }
    },

    // === ТУРНІРНА ТАБЛИЦЯ ===
    async standings() {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження...</div>';

        try {
            const season = CONFIG.CURRENT_SEASON;
            const standings = await API.getStandings(season);

            app.innerHTML = `
                <div class="container page-container">
                    <h1 class="page-title">ТУРНІРНА ТАБЛИЦЯ</h1>
                    <p class="page-subtitle">Сезон ${season}</p>

                    ${standings.length ? `
                        <table class="standings-table">
                            <thead>
                                <tr>
                                    <th>Поз</th>
                                    <th>Пілот</th>
                                    <th>Команда</th>
                                    <th>Очки</th>
                                    <th>Перемоги</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${standings.map(s => {
                                    const d = s.driver;
                                    const t = d?.team;
                                    return `
                                        <tr>
                                            <td class="position">${s.position}</td>
                                            <td>
                                                <a href="#" onclick="event.preventDefault(); router.navigate('/driver/${d?.slug || ''}')" style="color:${t?.color || '#fff'}">
                                                    ${d ? `${d.firstName} ${d.lastName}` : 'N/A'}
                                                </a>
                                            </td>
                                            <td>${t?.name || 'N/A'}</td>
                                            <td class="points">${s.points}</td>
                                            <td class="wins">${s.wins || 0}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    ` : `<p class="no-data">Немає даних турнірної таблиці.</p>`}
                </div>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження турнірної таблиці</div>';
        }
    },

    // === ТЕЛЕМЕТРІЯ ===
    async telemetry() {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження...</div>';

        try {
            const sessions = await API.getSessions(CONFIG.CURRENT_SEASON);

            if (!sessions || sessions.length === 0) {
                app.innerHTML = '<div class="error">Немає доступних сесій</div>';
                return;
            }

            app.innerHTML = `
                <div class="container page-container">
                    <h1 class="page-title">ТЕЛЕМЕТРІЯ</h1>
                    <p class="page-subtitle">Дані OpenF1 (lap, speed, throttle, gear, rpm)</p>

                    <div class="telemetry-controls">
                        <label>Оберіть сесію:</label>
                        <select id="sessionSelect">
                            ${sessions.map(s => `
                                <option value="${s.session_key}">
                                    ${s.meeting_name} — ${s.session_name} (${s.date_start ? new Date(s.date_start).toLocaleDateString('uk-UA') : ''})
                                </option>
                            `).join('')}
                        </select>

                        <button class="btn-primary" onclick="Pages.loadTelemetry()">Показати</button>
                    </div>

                    <div id="telemetryContent"></div>
                </div>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження телеметрії</div>';
        }
    },

    async loadTelemetry() {
        const sessionKey = document.getElementById('sessionSelect')?.value;
        if (!sessionKey) return;
        await this.loadTelemetryData(sessionKey);
    },

    async loadTelemetryData(sessionKey) {
        const content = document.getElementById('telemetryContent');
        content.innerHTML = '<div class="loading">Завантаження телеметрії...</div>';

        try {
            const laps = await API.getLaps(sessionKey);

            if (!laps || laps.length === 0) {
                content.innerHTML = '<p class="no-data">Немає даних телеметрії для цієї гонки</p>';
                return;
            }

            // Унікальні пілоти (по driver_number)
            const drivers = [...new Set(laps.map(l => l.driver_number))].sort((a, b) => a - b);

            content.innerHTML = `
                <div class="telemetry-grid">
                    <div class="telemetry-panel">
                        <h2>Параметри</h2>
                        <p>Оберіть пілота(ів) і подивіться графіки.</p>

                        <div class="driver-multi">
                            ${drivers.map(dn => `
                                <label class="chk">
                                    <input type="checkbox" value="${dn}" onchange="Pages.updateTelemetryCharts(${sessionKey})">
                                    <span>Пілот #${dn}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="telemetry-panel">
                        <h2>Графіки</h2>
                        <div id="telemetryCharts"></div>
                    </div>
                </div>
            `;

            // Автовибір перших 2 пілотів
            const checks = content.querySelectorAll('input[type="checkbox"]');
            if (checks[0]) checks[0].checked = true;
            if (checks[1]) checks[1].checked = true;

            await this.updateTelemetryCharts(sessionKey);
        } catch (error) {
            content.innerHTML = '<div class="error">Помилка завантаження телеметрії</div>';
        }
    },

    async updateTelemetryCharts(sessionKey) {
        const content = document.getElementById('telemetryContent');
        const chartsDiv = document.getElementById('telemetryCharts');
        if (!content || !chartsDiv) return;

        const selectedDrivers = [...content.querySelectorAll('input[type="checkbox"]:checked')]
            .map(i => parseInt(i.value, 10))
            .filter(Boolean);

        if (selectedDrivers.length === 0) {
            chartsDiv.innerHTML = '<p class="no-data">Оберіть хоча б одного пілота</p>';
            return;
        }

        chartsDiv.innerHTML = `
            <div class="chart-container">
                <canvas id="speedChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="lapTimesChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="throttleBrakeChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="gearChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="rpmChart"></canvas>
            </div>
        `;

        // Створити графіки
        await Telemetry.createSpeedTrace('speedChart', sessionKey, selectedDrivers);
        await Telemetry.createLapComparison('lapTimesChart', sessionKey, selectedDrivers);

        if (selectedDrivers.length > 0) {
            await Telemetry.createThrottleBrake('throttleBrakeChart', sessionKey, selectedDrivers[0]);
            await Telemetry.createGearChanges('gearChart', sessionKey, selectedDrivers[0]);
            await Telemetry.createRPM('rpmChart', sessionKey, selectedDrivers[0]);
        }
    },

    // === ІСТОРИЧНІ ДАНІ ===
    async historical() {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження...</div>';

        const years = [];
        for (let y = 2024; y >= 1950; y--) {
            years.push(y);
        }

        app.innerHTML = `
            <div class="container page-container">
                <h1 class="page-title">ІСТОРИЧНІ ДАНІ</h1>
                <p class="page-subtitle">Результати з 1950 року</p>

                <div class="historical-controls">
                    <label>Оберіть сезон:</label>
                    <select id="historicalYear" onchange="Pages.loadHistoricalSeason(this.value)">
                        <option value="">-- Оберіть рік --</option>
                        ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
                    </select>
                </div>

                <div id="historicalContent" class="historical-content"></div>
            </div>
        `;
    },

    async loadHistoricalSeason(year) {
        if (!year) return;

        const content = document.getElementById('historicalContent');
        content.innerHTML = '<div class="loading">Завантаження сезону...</div>';

        try {
            const [standings, races] = await Promise.all([
                Historical.getStandings(year),
                Historical.getRaces(year)
            ]);

            content.innerHTML = `
                <div class="historical-grid">
                    <div class="historical-section">
                        <h2>Турнірна таблиця ${year}</h2>
                        <table class="standings-table">
                            <thead>
                                <tr>
                                    <th>Поз</th>
                                    <th>Пілот</th>
                                    <th>Команда</th>
                                    <th>Очки</th>
                                    <th>Перемоги</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${standings.map(s => `
                                    <tr>
                                        <td class="position">${s.position}</td>
                                        <td>${s.driver.firstName} ${s.driver.lastName}</td>
                                        <td>${s.team.name}</td>
                                        <td class="points">${s.points}</td>
                                        <td class="wins">${s.wins}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="historical-section">
                        <h2>Календар ${year}</h2>
                        <div class="races-list">
                            ${races.map(r => `
                                <div class="race-item">
                                    <div class="race-round">R${r.round}</div>
                                    <div class="race-info">
                                        <h4>${r.raceName}</h4>
                                        <p>${r.circuit}, ${r.country}</p>
                                        <span class="race-date">${Historical.formatDate(r.date)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            content.innerHTML = '<div class="error">Помилка завантаження історичних даних</div>';
        }
    }
};