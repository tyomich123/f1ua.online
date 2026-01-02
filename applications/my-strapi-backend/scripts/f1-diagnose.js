/**
 * Діагностика F1 сайту
 * Перевіряє всі API endpoints та дані
 */

const axios = require('axios');

const API_URL = 'https://f1ua.online/api';

async function checkEndpoint(name, url) {
    try {
        const response = await axios.get(url);
        console.log(`✅ ${name}: ${response.data.data?.length || 0} записів`);
        
        if (response.data.data && response.data.data.length > 0) {
            const first = response.data.data[0];
            console.log(`   Приклад: ${JSON.stringify(first, null, 2).substring(0, 200)}...`);
        }
        
        return true;
    } catch (error) {
        console.error(`❌ ${name}: ${error.message}`);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        }
        return false;
    }
}

async function diagnose() {
    console.log('\n🔍 F1 API ДІАГНОСТИКА\n');
    console.log('═'.repeat(60));
    
    // Перевірка базових endpoints
    console.log('\n📡 БАЗОВІ ENDPOINTS:\n');
    await checkEndpoint('Teams', `${API_URL}/teams`);
    await checkEndpoint('Drivers', `${API_URL}/drivers`);
    await checkEndpoint('Standings', `${API_URL}/standings`);
    await checkEndpoint('Races', `${API_URL}/races`);
    await checkEndpoint('Articles', `${API_URL}/articles`);
    
    // Перевірка з populate
    console.log('\n📊 ENDPOINTS З POPULATE:\n');
    await checkEndpoint('Teams з пілотами', `${API_URL}/teams?populate[drivers][populate]=*`);
    await checkEndpoint('Drivers з командами', `${API_URL}/drivers?populate[team]=*`);
    await checkEndpoint('Standings повний', `${API_URL}/standings?populate[driver][populate][team]=*&populate[team]=*`);
    
    // Перевірка конкретних записів
    console.log('\n🎯 КОНКРЕТНІ ЗАПИСИ:\n');
    
    try {
        const teams = await axios.get(`${API_URL}/teams?populate[drivers]=*`);
        if (teams.data.data.length > 0) {
            const team = teams.data.data[0];
            console.log(`✅ Перша команда: ${team.name}`);
            console.log(`   Slug: ${team.slug}`);
            console.log(`   DocumentId: ${team.documentId}`);
            console.log(`   Пілотів: ${team.drivers?.length || 0}`);
            
            // Спробувати отримати за slug
            const bySlug = await axios.get(`${API_URL}/teams?filters[slug][$eq]=${team.slug}&populate[drivers]=*`);
            console.log(`✅ Пошук за slug '${team.slug}': ${bySlug.data.data.length} знайдено`);
        }
    } catch (error) {
        console.error(`❌ Помилка перевірки команд:`, error.message);
    }
    
    try {
        const drivers = await axios.get(`${API_URL}/drivers?populate[team]=*`);
        if (drivers.data.data.length > 0) {
            const driver = drivers.data.data[0];
            console.log(`✅ Перший пілот: ${driver.firstName} ${driver.lastName}`);
            console.log(`   Slug: ${driver.slug}`);
            console.log(`   DocumentId: ${driver.documentId}`);
            console.log(`   Команда: ${driver.team?.name || 'немає'}`);
            
            // Спробувати отримати за slug
            const bySlug = await axios.get(`${API_URL}/drivers?filters[slug][$eq]=${driver.slug}&populate[team]=*`);
            console.log(`✅ Пошук за slug '${driver.slug}': ${bySlug.data.data.length} знайдено`);
        }
    } catch (error) {
        console.error(`❌ Помилка перевірки пілотів:`, error.message);
    }
    
    // Перевірка standings
    console.log('\n📈 STANDINGS:\n');
    try {
        const standings = await axios.get(`${API_URL}/standings?populate[driver][populate][team]=*&populate[team]=*&filters[season][$eq]=2025&filters[type][$eq]=driver&sort=position:asc`);
        console.log(`✅ Standings 2025: ${standings.data.data.length} записів`);
        
        if (standings.data.data.length > 0) {
            const top3 = standings.data.data.slice(0, 3);
            top3.forEach((s, i) => {
                console.log(`   ${i + 1}. Pos ${s.position}: ${s.driver?.firstName} ${s.driver?.lastName} - ${s.points} pts`);
                console.log(`      Driver documentId: ${s.driver?.documentId}`);
                console.log(`      Team: ${s.team?.name}`);
            });
        }
    } catch (error) {
        console.error(`❌ Помилка standings:`, error.message);
        if (error.response) {
            console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        }
    }
    
    // Перевірка публічних прав
    console.log('\n🔓 ПУБЛІЧНІ ПРАВА:\n');
    console.log('   Щоб сайт працював, потрібно налаштувати:');
    console.log('   Settings → Roles → Public → Permissions:');
    console.log('   ✅ Team: find, findOne');
    console.log('   ✅ Driver: find, findOne');
    console.log('   ✅ Standing: find, findOne');
    console.log('   ✅ Race: find, findOne');
    console.log('   ✅ Article: find, findOne');
    
    console.log('\n═'.repeat(60));
    console.log('🏁 Діагностика завершена\n');
}

diagnose().catch(console.error);
