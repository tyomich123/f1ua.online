// API функції для Strapi v5
const API = {
    // Базова функція для запитів
    async fetch(endpoint, params = {}) {
        const url = new URL(`${CONFIG.API_URL}${endpoint}`);
        
        // Додаємо параметри до URL
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        console.log('API Request:', url.toString());

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error('API Error:', response.status, response.statusText);
                const errorData = await response.json();
                console.error('Error details:', errorData);
                return [];
            }

            const data = await response.json();
            console.log('API Response:', data);
            
            return data.data || [];
        } catch (error) {
            console.error('Fetch error:', error);
            return [];
        }
    },

    // Отримати всі команди
    async getTeams() {
        // БЕЗ populate - уникаємо помилок
        return this.fetch('/teams');
    },

    // Отримати команду за slug
    async getTeam(slug) {
        const teams = await this.fetch('/teams', {
            'filters[slug][$eq]': slug
        });
        return teams[0] || null;
    },

    // Отримати пілотів команди
    async getTeamDrivers(teamDocumentId) {
        return this.fetch('/drivers', {
            'filters[team][documentId][$eq]': teamDocumentId
        });
    },

    // Отримати всіх пілотів
    async getDrivers() {
        return this.fetch('/drivers');
    },

    // Отримати пілота за slug
    async getDriver(slug) {
        const drivers = await this.fetch('/drivers', {
            'filters[slug][$eq]': slug
        });
        return drivers[0] || null;
    },

    // Отримати команду пілота
    async getDriverTeam(teamDocumentId) {
        if (!teamDocumentId) return null;
        
        const teams = await this.fetch('/teams', {
            'filters[documentId][$eq]': teamDocumentId
        });
        return teams[0] || null;
    },

    // Отримати турнірну таблицю
    async getStandings() {
        return this.fetch('/standings', {
            'filters[season][$eq]': CONFIG.CURRENT_SEASON,
            'filters[type][$eq]': 'driver',
            'sort': 'position:asc'
        });
    },

    // Отримати інфо про пілота для standing
    async getStandingDriver(driverDocumentId) {
        if (!driverDocumentId) return null;
        
        const drivers = await this.fetch('/drivers', {
            'filters[documentId][$eq]': driverDocumentId
        });
        return drivers[0] || null;
    },

    // Отримати команду для standing
    async getStandingTeam(teamDocumentId) {
        if (!teamDocumentId) return null;
        
        const teams = await this.fetch('/teams', {
            'filters[documentId][$eq]': teamDocumentId
        });
        return teams[0] || null;
    },

    // Отримати гонки
    async getRaces() {
        return this.fetch('/races', {
            'filters[season][$eq]': CONFIG.CURRENT_SEASON,
            'sort': 'round:asc'
        });
    },

    // Отримати статті
    async getArticles(limit = 6) {
        return this.fetch('/articles', {
            'sort': 'publishedAt:desc',
            'pagination[limit]': limit
        });
    },

    // Отримати статтю за slug
    async getArticle(slug) {
        const articles = await this.fetch('/articles', {
            'filters[slug][$eq]': slug
        });
        return articles[0] || null;
    }
};
