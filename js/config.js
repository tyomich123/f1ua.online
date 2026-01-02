// Конфігурація сайту
const CONFIG = {
    API_URL: 'https://f1ua.online/api',
    CURRENT_SEASON: 2025,
    SITE_NAME: 'F1 Ukraine',
    SITE_DESCRIPTION: 'Неофіційний україномовний сайт про Формулу 1'
};

// Кольори команд
const TEAM_COLORS = {
    'McLaren': '#FF8000',
    'Mercedes': '#00D2BE',
    'Red Bull Racing': '#0600EF',
    'Ferrari': '#DC0000',
    'Aston Martin': '#006F62',
    'Alpine': '#0090FF',
    'Williams': '#005AFF',
    'Racing Bulls': '#6C98FF',
    'Kick Sauber': '#01C00E',
    'Haas F1 Team': '#B6BABD'
};

// Отримати колір команди
function getTeamColor(teamName) {
    return TEAM_COLORS[teamName] || '#E10600';
}
