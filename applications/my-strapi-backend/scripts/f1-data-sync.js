/**
 * F1 Data Sync Script v5.0 - STABLE
 * Повністю переписаний для Strapi v5
 * 
 * ВИПРАВЛЕНО:
 * - Усунуто всі проблеми з populate
 * - Правильна робота з documentId
 * - Стабільні relations без вкладених populate
 */

require('dotenv').config();
const axios = require('axios');

// ==================== КОНФІГУРАЦІЯ ====================

const OPENF1_API = 'https://api.openf1.org/v1';
const STRAPI_API = 'https://f1ua.online/api';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || 'YOUR_STRAPI_API_TOKEN';
const CURRENT_SEASON = 2025;

const strapiAPI = axios.create({
    baseURL: STRAPI_API,
    headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ==================== OPENF1 API ====================

async function getSeasonSessions(year = CURRENT_SEASON) {
    try {
        const response = await axios.get(`${OPENF1_API}/sessions`, { params: { year } });
        return response.data;
    } catch (error) {
        console.error('❌ Помилка отримання сесій:', error.message);
        return [];
    }
}

async function getLatestDrivers() {
    try {
        const sessions = await getSeasonSessions(CURRENT_SEASON);
        if (sessions.length === 0) return [];
        
        const latestSession = sessions[sessions.length - 1];
        const response = await axios.get(`${OPENF1_API}/drivers`, {
            params: { session_key: latestSession.session_key }
        });
        return response.data;
    } catch (error) {
        console.error('❌ Помилка отримання пілотів:', error.message);
        return [];
    }
}

async function getSessionResults(sessionKey) {
    try {
        const response = await axios.get(`${OPENF1_API}/position`, {
            params: { session_key: sessionKey }
        });
        return response.data;
    } catch (error) {
        console.error('❌ Помилка отримання результатів:', error.message);
        return [];
    }
}

async function getMeetings(year = CURRENT_SEASON) {
    try {
        const response = await axios.get(`${OPENF1_API}/meetings`, { params: { year } });
        return response.data;
    } catch (error) {
        console.error('❌ Помилка отримання meetings:', error.message);
        return [];
    }
}

// ==================== УТІЛІТИ ====================

function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// ==================== STRAPI v5 CRUD ====================

async function findOrCreateTeam(teamData) {
    try {
        const search = await strapiAPI.get('/teams', {
            params: { 'filters[name][$eq]': teamData.name }
        });

        if (search.data.data && search.data.data.length > 0) {
            const existing = search.data.data[0];
            await strapiAPI.put(`/teams/${existing.documentId}`, { data: teamData });
            console.log(`✅ Оновлено команду: ${teamData.name}`);
            return existing;
        } else {
            const created = await strapiAPI.post('/teams', { data: teamData });
            console.log(`🆕 Створено команду: ${teamData.name}`);
            return created.data.data;
        }
    } catch (error) {
        console.error(`❌ Команда ${teamData.name}:`, error.response?.data?.error?.message || error.message);
        return null;
    }
}

async function findOrCreateDriver(driverData, teamDocumentId) {
    try {
        const search = await strapiAPI.get('/drivers', {
            params: { 'filters[number][$eq]': driverData.number }
        });

        const payload = { ...driverData, team: teamDocumentId };

        if (search.data.data && search.data.data.length > 0) {
            const existing = search.data.data[0];
            await strapiAPI.put(`/drivers/${existing.documentId}`, { data: payload });
            console.log(`✅ Оновлено пілота: ${driverData.firstName} ${driverData.lastName}`);
            return existing;
        } else {
            const created = await strapiAPI.post('/drivers', { data: payload });
            console.log(`🆕 Створено пілота: ${driverData.firstName} ${driverData.lastName}`);
            return created.data.data;
        }
    } catch (error) {
        console.error(`❌ Пілот ${driverData.firstName} ${driverData.lastName}:`, error.response?.data?.error?.message || error.message);
        return null;
    }
}

async function createOrUpdateRace(meetingData, sessionData) {
    try {
        const search = await strapiAPI.get('/races', {
            params: {
                'filters[name][$eq]': meetingData.meeting_name,
                'filters[season][$eq]': meetingData.year
            }
        });

        let round = meetingData.meeting_key % 100;
        if (round > 24) round = round % 24;
        if (round === 0) round = 24;

        const raceData = {
            name: meetingData.meeting_name,
            slug: generateSlug(meetingData.meeting_name),
            circuit: meetingData.circuit_short_name,
            country: meetingData.country_name,
            round: round,
            season: meetingData.year,
            date: sessionData.date_start,
            statuss: new Date(sessionData.date_end) < new Date() ? 'completed' : 'upcoming',
            publishedAt: new Date().toISOString()
        };

        if (search.data.data && search.data.data.length > 0) {
            const existing = search.data.data[0];
            await strapiAPI.put(`/races/${existing.documentId}`, { data: raceData });
            console.log(`✅ Оновлено гонку: ${raceData.name} (round ${round})`);
        } else {
            await strapiAPI.post('/races', { data: raceData });
            console.log(`🆕 Створено гонку: ${raceData.name} (round ${round})`);
        }
    } catch (error) {
        console.error(`❌ Гонка ${meetingData.meeting_name}:`, error.response?.data?.error?.message || error.message);
    }
}

async function createOrUpdateStanding(driverDocumentId, teamDocumentId, position, points, season = CURRENT_SEASON) {
    try {
        // Отримати standings БЕЗ populate для уникнення помилок
        const search = await strapiAPI.get('/standings', {
            params: {
                'filters[season][$eq]': season,
                'filters[type][$eq]': 'driver',
                'pagination[pageSize]': 100
            }
        });

        // Знайти в результатах
        let existing = null;
        if (search.data.data) {
            // Отримати кожен standing окремо з populate для порівняння
            for (const standing of search.data.data) {
                try {
                    const detailed = await strapiAPI.get(`/standings/${standing.documentId}`, {
                        params: { 'populate[driver]': 'documentId' }
                    });
                    
                    if (detailed.data.data?.driver?.documentId === driverDocumentId) {
                        existing = standing;
                        break;
                    }
                } catch (e) {
                    // Якщо помилка populate - порівнюємо по driver relation напряму
                    if (standing.driver === driverDocumentId) {
                        existing = standing;
                        break;
                    }
                }
            }
        }

        const standingData = {
            driver: driverDocumentId,
            team: teamDocumentId,
            position,
            points,
            season,
            type: 'driver',
            publishedAt: new Date().toISOString()
        };

        if (existing) {
            await strapiAPI.put(`/standings/${existing.documentId}`, { data: standingData });
            console.log(`✅ Оновлено standing: #${position} (${points} pts)`);
        } else {
            await strapiAPI.post('/standings', { data: standingData });
            console.log(`🆕 Створено standing: #${position} (${points} pts)`);
        }
    } catch (error) {
        console.error(`❌ Standing #${position}:`, error.response?.data?.error?.message || error.message);
    }
}

// ==================== СИНХРОНІЗАЦІЯ ====================

async function syncTeamsAndDrivers() {
    console.log('\n🔄 Синхронізація команд та пілотів\n');

    const drivers = await getLatestDrivers();
    if (drivers.length === 0) {
        console.log('❌ Немає пілотів для синхронізації');
        return;
    }

    console.log(`📊 Знайдено ${drivers.length} пілотів\n`);

    const processedTeams = new Map();
    let teamCount = 0;
    let driverCount = 0;

    for (const driver of drivers) {
        // Обробити команду
        if (!processedTeams.has(driver.team_name)) {
            const teamData = {
                name: driver.team_name,
                slug: generateSlug(driver.team_name),
                color: `#${driver.team_colour}`,
                fullName: driver.team_name,
                publishedAt: new Date().toISOString()
            };

            const team = await findOrCreateTeam(teamData);
            if (team) {
                processedTeams.set(driver.team_name, team.documentId);
                teamCount++;
            }
            await delay(100);
        }

        // Обробити пілота
        const teamDocumentId = processedTeams.get(driver.team_name);
        if (teamDocumentId) {
            const driverData = {
                firstName: driver.first_name,
                lastName: driver.last_name,
                slug: generateSlug(driver.last_name),
                number: driver.driver_number,
                nationality: driver.country_code,
                publishedAt: new Date().toISOString()
            };

            const createdDriver = await findOrCreateDriver(driverData, teamDocumentId);
            if (createdDriver) driverCount++;
            await delay(100);
        }
    }

    console.log(`\n✅ Синхронізація завершена: ${teamCount} команд, ${driverCount} пілотів\n`);
}

async function syncRaces() {
    console.log('\n🔄 Синхронізація гонок\n');

    const meetings = await getMeetings(CURRENT_SEASON);
    const sessions = await getSeasonSessions(CURRENT_SEASON);

    console.log(`📊 Знайдено ${meetings.length} Grand Prix\n`);

    let raceCount = 0;

    for (const meeting of meetings) {
        const raceSession = sessions.find(s => 
            s.meeting_key === meeting.meeting_key && 
            s.session_type === 'Race'
        );

        if (raceSession) {
            await createOrUpdateRace(meeting, raceSession);
            raceCount++;
            await delay(200);
        }
    }

    console.log(`\n✅ Синхронізація гонок: ${raceCount} гонок\n`);
}

async function syncStandings() {
    console.log('\n🔄 Синхронізація турнірної таблиці\n');

    const sessions = await getSeasonSessions(CURRENT_SEASON);
    const raceSessions = sessions.filter(s => 
        s.session_type === 'Race' && 
        new Date(s.date_end) < new Date()
    );
    
    if (raceSessions.length === 0) {
        console.log('❌ Немає завершених гонок');
        return;
    }

    console.log(`📊 Знайдено ${raceSessions.length} завершених гонок`);

    const driverPoints = new Map();
    const pointsSystem = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

    for (const race of raceSessions) {
        console.log(`⚙️ Обробка: ${race.session_name}`);
        const positions = await getSessionResults(race.session_key);
        
        const finalPositions = new Map();
        positions.forEach(pos => {
            finalPositions.set(pos.driver_number, pos.position);
        });

        for (const [driverNumber, position] of finalPositions.entries()) {
            const points = pointsSystem[position - 1] || 0;
            const currentPoints = driverPoints.get(driverNumber) || 0;
            driverPoints.set(driverNumber, currentPoints + points);
        }

        await delay(500);
    }

    // Отримати всіх пілотів БЕЗ populate
    console.log('\n📊 Отримання пілотів з Strapi...');
    const driversResponse = await strapiAPI.get('/drivers', {
        params: { 'pagination[pageSize]': 100 }
    });
    const strapiDrivers = driversResponse.data.data;

    const standings = [];
    for (const [driverNumber, totalPoints] of driverPoints.entries()) {
        const driver = strapiDrivers.find(d => d.number === driverNumber);
        if (driver) {
            standings.push({
                driverDocumentId: driver.documentId,
                teamDocumentId: driver.team, // В Strapi v5 це вже documentId
                driverNumber,
                points: totalPoints
            });
        }
    }

    standings.sort((a, b) => b.points - a.points);

    console.log('\n📊 Оновлення standings...\n');
    for (let i = 0; i < standings.length; i++) {
        const standing = standings[i];
        await createOrUpdateStanding(
            standing.driverDocumentId,
            standing.teamDocumentId,
            i + 1,
            standing.points,
            CURRENT_SEASON
        );
        await delay(150);
    }

    console.log(`\n✅ Турнірна таблиця оновлена: ${standings.length} пілотів\n`);
}

async function fullSync() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   F1 DATA SYNC v5.0 - STABLE           ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`🕐 Початок: ${new Date().toLocaleString('uk-UA')}`);
    console.log(`📅 Сезон: ${CURRENT_SEASON}\n`);
    
    const startTime = Date.now();

    try {
        await syncTeamsAndDrivers();
        await syncRaces();
        await syncStandings();
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('╔════════════════════════════════════════╗');
        console.log('║        ✅ СИНХРОНІЗАЦІЯ ЗАВЕРШЕНА      ║');
        console.log('╚════════════════════════════════════════╝');
        console.log(`🕐 Завершено: ${new Date().toLocaleString('uk-UA')}`);
        console.log(`⏱️ Час виконання: ${duration}с\n`);
    } catch (error) {
        console.error('\n❌ КРИТИЧНА ПОМИЛКА:', error.message);
        process.exit(1);
    }
}

function checkConfig() {
    if (!STRAPI_TOKEN || STRAPI_TOKEN === 'YOUR_STRAPI_API_TOKEN') {
        console.error('\n❌ ПОМИЛКА: STRAPI_TOKEN не налаштований!');
        process.exit(1);
    }
}

// ==================== ЗАПУСК ====================

if (require.main === module) {
    checkConfig();

    const args = process.argv.slice(2);
    const command = args[0] || 'full';

    console.log('\n🏁 F1 Data Sync v5.0 - STABLE');

    switch (command) {
        case 'teams':
            syncTeamsAndDrivers()
                .then(() => process.exit(0))
                .catch(err => { console.error('❌', err.message); process.exit(1); });
            break;

        case 'standings':
            syncStandings()
                .then(() => process.exit(0))
                .catch(err => { console.error('❌', err.message); process.exit(1); });
            break;

        case 'races':
            syncRaces()
                .then(() => process.exit(0))
                .catch(err => { console.error('❌', err.message); process.exit(1); });
            break;

        case 'full':
        default:
            fullSync()
                .then(() => process.exit(0))
                .catch(err => { console.error('❌', err.message); process.exit(1); });
            break;
    }
}

module.exports = { syncTeamsAndDrivers, syncStandings, syncRaces, fullSync };