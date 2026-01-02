// Рендеринг сторінок
const Pages = {
    // Головна сторінка
    async home() {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження...</div>';

        try {
            const [teams, articles] = await Promise.all([
                API.getTeams(),
                API.getArticles(3)
            ]);

            app.innerHTML = `
                <section class="hero">
                    <div class="hero-content">
                        <h1 class="hero-title">ФОРМУЛА 1 УКРАЇНА</h1>
                        <p class="hero-subtitle">Найшвидший спорт на планеті</p>
                    </div>
                </section>

                <section class="teams-section">
                    <div class="container">
                        <h2 class="section-title">КОМАНДИ F1 2025</h2>
                        <p class="section-subtitle">10 найкращих команд світу</p>
                        <div class="teams-grid">
                            ${teams.map(team => `
                                <div class="team-card" onclick="router.navigate('/team/${team.slug}')" style="border-color: ${team.color}">
                                    <div class="team-color" style="background: ${team.color}"></div>
                                    <h3>${team.name}</h3>
                                    <p class="team-base">${team.base || 'Milton Keynes, UK'}</p>
                                </div>
                            `).join('')}
                        </div>
                        ${teams.length === 0 ? '<p class="no-data">Команди не знайдені</p>' : ''}
                    </div>
                </section>

                <section class="news-section">
                    <div class="container">
                        <h2 class="section-title">ОСТАННІ НОВИНИ</h2>
                        <p class="section-subtitle">Актуальні події з світу F1</p>
                        <div class="news-grid">
                            ${articles.map(article => `
                                <div class="news-card" onclick="router.navigate('/article/${article.slug}')">
                                    <h3>${article.title}</h3>
                                    <p>${article.excerpt || 'Читати далі...'}</p>
                                    <span class="news-date">${new Date(article.publishedAt).toLocaleDateString('uk-UA')}</span>
                                </div>
                            `).join('')}
                        </div>
                        ${articles.length === 0 ? '<p class="no-data">Новини не знайдені</p>' : ''}
                    </div>
                </section>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження даних</div>';
            console.error('Home page error:', error);
        }
    },

    // Сторінка всіх команд
    async teams() {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження команд...</div>';

        try {
            const teams = await API.getTeams();

            app.innerHTML = `
                <div class="container page-container">
                    <h1 class="page-title">ВСІ КОМАНДИ</h1>
                    <p class="page-subtitle">Команди Формули 1 сезону ${CONFIG.CURRENT_SEASON}</p>
                    
                    <div class="teams-grid">
                        ${teams.map(team => `
                            <div class="team-card" onclick="router.navigate('/team/${team.slug}')" style="border-color: ${team.color}">
                                <div class="team-color" style="background: ${team.color}"></div>
                                <h3>${team.name}</h3>
                                <p class="team-base">${team.base || 'База не вказана'}</p>
                            </div>
                        `).join('')}
                    </div>
                    ${teams.length === 0 ? '<p class="no-data">Команди не знайдені</p>' : ''}
                </div>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження команд</div>';
            console.error('Teams page error:', error);
        }
    },

    // Детальна сторінка команди
    async team(params) {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження команди...</div>';

        try {
            const team = await API.getTeam(params.slug);
            
            if (!team) {
                app.innerHTML = '<div class="container"><h1>Команду не знайдено</h1></div>';
                return;
            }

            const drivers = await API.getTeamDrivers(team.documentId);

            app.innerHTML = `
                <div class="team-detail">
                    <div class="team-hero" style="background: linear-gradient(135deg, ${team.color}22, ${team.color}11)">
                        <div class="container">
                            <h1 class="team-name">${team.name}</h1>
                            <p class="team-full-name">${team.fullName || team.name}</p>
                        </div>
                    </div>

                    <div class="container">
                        <div class="team-info-grid">
                            <div class="team-main-info">
                                <h2>Про команду</h2>
                                <p>${team.description || 'Опис команди скоро з\'явиться.'}</p>

                                <h2>Пілоти команди</h2>
                                <div class="drivers-grid">
                                    ${drivers.map(driver => `
                                        <div class="driver-card" onclick="router.navigate('/driver/${driver.slug}')">
                                            <div class="driver-number" style="color: ${team.color}">#${driver.number}</div>
                                            <h3>${driver.firstName} ${driver.lastName}</h3>
                                            <p>${driver.nationality || 'Національність не вказана'}</p>
                                        </div>
                                    `).join('')}
                                </div>
                                ${drivers.length === 0 ? '<p class="no-data">Пілоти не знайдені</p>' : ''}
                            </div>

                            <div class="team-sidebar">
                                <div class="info-card">
                                    <h3>Інформація</h3>
                                    <div class="info-row">
                                        <span class="info-label">База:</span>
                                        <span>${team.base || 'Не вказано'}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">Керівник:</span>
                                        <span>${team.teamChief || 'Не вказано'}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">Техдиректор:</span>
                                        <span>${team.technicalChief || 'Не вказано'}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">Двигун:</span>
                                        <span>${team.powerUnit || 'Не вказано'}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">Шасі:</span>
                                        <span>${team.chassis || 'Не вказано'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження команди</div>';
            console.error('Team page error:', error);
        }
    },

    // Сторінка всіх пілотів
    async drivers() {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження пілотів...</div>';

        try {
            const drivers = await API.getDrivers();

            app.innerHTML = `
                <div class="container page-container">
                    <h1 class="page-title">ВСІ ПІЛОТИ</h1>
                    <p class="page-subtitle">Пілоти Формули 1 сезону ${CONFIG.CURRENT_SEASON}</p>
                    
                    <div class="drivers-grid">
                        ${drivers.map(driver => `
                            <div class="driver-card large" onclick="router.navigate('/driver/${driver.slug}')">
                                <div class="driver-number">#${driver.number}</div>
                                <h3>${driver.firstName} ${driver.lastName}</h3>
                                <p>${driver.nationality || 'Національність не вказана'}</p>
                            </div>
                        `).join('')}
                    </div>
                    ${drivers.length === 0 ? '<p class="no-data">Пілоти не знайдені</p>' : ''}
                </div>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження пілотів</div>';
            console.error('Drivers page error:', error);
        }
    },

    // Детальна сторінка пілота
    async driver(params) {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження пілота...</div>';

        try {
            const driver = await API.getDriver(params.slug);
            
            if (!driver) {
                app.innerHTML = '<div class="container"><h1>Пілота не знайдено</h1></div>';
                return;
            }

            const team = await API.getDriverTeam(driver.team);

            app.innerHTML = `
                <div class="driver-detail">
                    <div class="driver-hero" style="background: linear-gradient(135deg, ${team ? team.color + '22' : '#E1060022'}, ${team ? team.color + '11' : '#E1060011'})">
                        <div class="container">
                            <div class="driver-number-large">#${driver.number}</div>
                            <h1 class="driver-name">${driver.firstName} ${driver.lastName}</h1>
                            ${team ? `<p class="driver-team" onclick="router.navigate('/team/${team.slug}')" style="cursor: pointer; color: ${team.color}">${team.name}</p>` : ''}
                        </div>
                    </div>

                    <div class="container">
                        <div class="driver-info-grid">
                            <div class="driver-main-info">
                                <h2>Біографія</h2>
                                <p>${driver.biography || 'Біографія пілота скоро з\'явиться.'}</p>
                            </div>

                            <div class="driver-sidebar">
                                <div class="info-card">
                                    <h3>Інформація</h3>
                                    <div class="info-row">
                                        <span class="info-label">Номер:</span>
                                        <span>#${driver.number}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">Національність:</span>
                                        <span>${driver.nationality || 'Не вказано'}</span>
                                    </div>
                                    ${team ? `
                                    <div class="info-row">
                                        <span class="info-label">Команда:</span>
                                        <span onclick="router.navigate('/team/${team.slug}')" style="cursor: pointer; color: ${team.color}">${team.name}</span>
                                    </div>
                                    ` : ''}
                                    ${driver.birthDate ? `
                                    <div class="info-row">
                                        <span class="info-label">Дата народження:</span>
                                        <span>${new Date(driver.birthDate).toLocaleDateString('uk-UA')}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження пілота</div>';
            console.error('Driver page error:', error);
        }
    },

    // Турнірна таблиця
    async standings() {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження турнірної таблиці...</div>';

        try {
            const standings = await API.getStandings();
            
            // Отримати дані про пілотів та команди
            const standingsWithData = await Promise.all(
                standings.map(async (standing) => {
                    const driver = await API.getStandingDriver(standing.driver);
                    const team = await API.getStandingTeam(standing.team);
                    return { ...standing, driverData: driver, teamData: team };
                })
            );

            app.innerHTML = `
                <div class="container page-container">
                    <h1 class="page-title">ТУРНІРНА ТАБЛИЦЯ</h1>
                    <p class="page-subtitle">Чемпіонат Формули 1 ${CONFIG.CURRENT_SEASON}</p>
                    
                    <div class="standings-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Позиція</th>
                                    <th>Пілот</th>
                                    <th>Команда</th>
                                    <th>Очки</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${standingsWithData.map(standing => `
                                    <tr onclick="router.navigate('/driver/${standing.driverData?.slug || ''}')" style="cursor: pointer">
                                        <td class="position">${standing.position}</td>
                                        <td class="driver">
                                            <span class="driver-number">#${standing.driverData?.number || '?'}</span>
                                            ${standing.driverData ? `${standing.driverData.firstName} ${standing.driverData.lastName}` : 'Невідомо'}
                                        </td>
                                        <td class="team">
                                            <span class="team-indicator" style="background: ${standing.teamData?.color || '#ccc'}"></span>
                                            ${standing.teamData?.name || 'Невідомо'}
                                        </td>
                                        <td class="points">${standing.points}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        ${standings.length === 0 ? '<p class="no-data">Турнірна таблиця не знайдена</p>' : ''}
                    </div>
                </div>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження турнірної таблиці</div>';
            console.error('Standings page error:', error);
        }
    },

    // Сторінка новин
    async news() {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження новин...</div>';

        try {
            const articles = await API.getArticles(20);

            app.innerHTML = `
                <div class="container page-container">
                    <h1 class="page-title">НОВИНИ</h1>
                    <p class="page-subtitle">Останні події з світу Формули 1</p>
                    
                    <div class="news-list">
                        ${articles.map(article => `
                            <div class="news-item" onclick="router.navigate('/article/${article.slug}')">
                                <h2>${article.title}</h2>
                                <p>${article.excerpt || 'Читати далі...'}</p>
                                <span class="news-date">${new Date(article.publishedAt).toLocaleDateString('uk-UA')}</span>
                            </div>
                        `).join('')}
                    </div>
                    ${articles.length === 0 ? '<p class="no-data">Новини не знайдені</p>' : ''}
                </div>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження новин</div>';
            console.error('News page error:', error);
        }
    },

    // Детальна стаття
    async article(params) {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="loading">Завантаження статті...</div>';

        try {
            const article = await API.getArticle(params.slug);
            
            if (!article) {
                app.innerHTML = '<div class="container"><h1>Статтю не знайдено</h1></div>';
                return;
            }

            app.innerHTML = `
                <article class="article-detail">
                    <div class="container">
                        <h1 class="article-title">${article.title}</h1>
                        <p class="article-date">${new Date(article.publishedAt).toLocaleDateString('uk-UA')}</p>
                        <div class="article-content">
                            ${article.content || article.excerpt || 'Контент статті скоро з\'явиться.'}
                        </div>
                    </div>
                </article>
            `;
        } catch (error) {
            app.innerHTML = '<div class="error">Помилка завантаження статті</div>';
            console.error('Article page error:', error);
        }
    },

    // 404
    notFound() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="container page-container" style="text-align: center; padding: 100px 20px;">
                <h1 style="font-size: 120px; margin: 0;">404</h1>
                <p style="font-size: 24px; margin: 20px 0;">Сторінку не знайдено</p>
                <button onclick="router.navigate('/')" style="padding: 15px 30px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
                    Повернутися на головну
                </button>
            </div>
        `;
    }
};
