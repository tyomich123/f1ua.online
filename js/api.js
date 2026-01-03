// API functions for Strapi v5 (REST) + OpenF1
const API = {
  // ---------- helpers ----------
  _buildUrl(base, endpoint, params = {}) {
    const url = new URL(`${base}${endpoint}`);
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      // set() щоб не плодити дублікати ключів
      url.searchParams.set(k, String(v));
    }
    return url.toString();
  },

  async fetch(endpoint, params = {}) {
    const url = this._buildUrl(CONFIG.API_URL, endpoint, params);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error('[Strapi API error]', endpoint, res.status, txt.slice(0, 800));
        return [];
      }

      const json = await res.json();
      // Strapi v5 REST: { data: [...], meta: {...} }
      return json?.data || [];
    } catch (e) {
      console.error('[Strapi API fetch failed]', endpoint, e);
      return [];
    }
  },

  // ---------- TEAMS ----------
  async getTeams(activeOnly = false) {
    const params = {
      'sort': 'name:asc',
      'pagination[pageSize]': 50
    };
    if (activeOnly) params['filters[isActive][$eq]'] = true;

    // IMPORTANT: не просимо populate[logo]/[carImage] поки поля не підтверджені в Strapi
    return this.fetch('/teams', params);
  },

  async getTeam(slug) {
    const res = await this.fetch('/teams', {
      'filters[slug][$eq]': slug,
      'pagination[pageSize]': 1,

      // drivers для сторінки команди
      'populate[drivers][fields][0]': 'firstName',
      'populate[drivers][fields][1]': 'lastName',
      'populate[drivers][fields][2]': 'slug',
      'populate[drivers][fields][3]': 'number',
      'populate[drivers][fields][4]': 'abbreviation'
    });
    return res[0] || null;
  },

  // ---------- DRIVERS ----------
  async getDrivers(activeOnly = false) {
    const params = {
      'sort': 'number:asc',
      'pagination[pageSize]': 50
    };
    if (activeOnly) params['filters[isActive][$eq]'] = true;

    // team name/color для карток пілотів
    params['populate[team][fields][0]'] = 'name';
    params['populate[team][fields][1]'] = 'slug';
    params['populate[team][fields][2]'] = 'color';

    // IMPORTANT: не просимо headshot/photo поки не підтверджено що це media-поля
    return this.fetch('/drivers', params);
  },

  async getDriver(slug) {
    const res = await this.fetch('/drivers', {
      'filters[slug][$eq]': slug,
      'pagination[pageSize]': 1,

      'populate[team][fields][0]': 'name',
      'populate[team][fields][1]': 'slug',
      'populate[team][fields][2]': 'color'
    });
    return res[0] || null;
  },

  // ---------- STANDINGS ----------
  async getStandings(_seasonYear = null) {
    // В тебе filters[season] не працює (Invalid key season) — не використовуємо.
    // Так само уникаємо wildcard populate, бо воно може спробувати “logo” і впасти.
    return this.fetch('/standings', {
      'filters[type][$eq]': 'driver',
      'sort': 'position:asc',
      'pagination[pageSize]': 60,

      // driver (мінімум)
      'populate[driver][fields][0]': 'firstName',
      'populate[driver][fields][1]': 'lastName',
      'populate[driver][fields][2]': 'slug',
      'populate[driver][fields][3]': 'number',
      'populate[driver][fields][4]': 'abbreviation',

      // team (мінімум, без logo)
      'populate[driver][populate][team][fields][0]': 'name',
      'populate[driver][populate][team][fields][1]': 'slug',
      'populate[driver][populate][team][fields][2]': 'color',
      'populate[driver][populate][team][fields][3]': 'base'
    });
  },

  // ---------- RACES ----------
  async getRaces(season = 2025) {
    // Якщо в твоєму Strapi races НЕ мають season relation — цей filters[season] теж впаде.
    // Тому робимо обережно: пробуємо з фільтром, якщо прийде пусто — сторінка просто покаже “нема даних”.
    return this.fetch('/races', {
      'sort': 'round:asc',
      'pagination[pageSize]': 90,

      // якщо season існує як relation — ок
      'filters[season][year][$eq]': season
    });
  },

  // ---------- ARTICLES ----------
  async getArticles(limit = 6) {
    // cover теж може бути media; якщо в Strapi нема — прибери populate[cover]
    return this.fetch('/articles', {
      'pagination[pageSize]': limit,
      'sort': 'publishedAt:desc'
    });
  },

  async getArticle(slug) {
    const res = await this.fetch('/articles', {
      'filters[slug][$eq]': slug,
      'pagination[pageSize]': 1
    });
    return res[0] || null;
  },

  // ---------- OpenF1 ----------
  async openf1Fetch(endpoint, params = {}) {
    const url = this._buildUrl('https://api.openf1.org', endpoint, params);

    try {
      const res = await fetch(url, {
        method: 'GET',
        // важливо для діагностики
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error('[OpenF1 error]', endpoint, res.status, txt.slice(0, 800));
        return [];
      }
      return await res.json();
    } catch (e) {
      console.error('OpenF1 fetch failed', endpoint, e);
      return [];
    }
  },

  async getSessions(year = 2025) {
    // У OpenF1 правильний фільтр для sessions: year
    return this.openf1Fetch('/v1/sessions', { year });
  },

  async getLaps(sessionKey, driverNumber = null, lapNumberMax = 5) {
    // ГОЛОВНИЙ ФІКС: не качай усі laps одразу.
    // Візьмемо тільки перші кілька кіл (або для конкретного пілота) — щоб fetch не “вмирав”.
    const params = { session_key: sessionKey };

    // якщо хочеш на графіках порівняння — викликай цю функцію по driverNumber окремо
    if (driverNumber) params.driver_number = driverNumber;

    // OpenF1 підтримує фільтри типу lap_number<=N (див. їх Data filtering)
    if (lapNumberMax) params['lap_number<='] = lapNumberMax;

    return this.openf1Fetch('/v1/laps', params);
  }
};