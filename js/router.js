const router = {
  routes: {
    '/': 'home',
    '/teams': 'teams',
    '/team/:slug': 'team',
    '/drivers': 'drivers',
    '/driver/:slug': 'driver',
    '/standings': 'standings',
    '/telemetry': 'telemetry',
    '/historical': 'historical',
    '/news': 'news',
    '/article/:slug': 'article'
  },

  init() {
    // перехоплюємо кліки по внутрішніх лінках <a href="/...">
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;

      const href = a.getAttribute('href');
      if (!href) return;

      // зовнішні/якорі/файли не чіпаємо
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) return;

      // тільки внутрішні
      if (href.startsWith('/')) {
        e.preventDefault();
        this.navigate(href);
      }
    });

    window.addEventListener('popstate', () => this.resolve());
    this.resolve();
  },

  navigate(path) {
    history.pushState({}, '', path);
    this.resolve();
  },

  // матчинг простий: /team/:slug
  match(path) {
    const clean = path.split('?')[0].replace(/\/+$/, '') || '/';

    for (const [pattern, page] of Object.entries(this.routes)) {
      const keys = [];
      const regex = new RegExp('^' + pattern
        .replace(/\/+$/, '')
        .replace(/\//g, '\\/')
        .replace(/:([A-Za-z0-9_]+)/g, (_, k) => {
          keys.push(k);
          return '([^\\/]+)';
        }) + '$'
      );

      const m = clean.match(regex);
      if (m) {
        const params = {};
        keys.forEach((k, i) => params[k] = decodeURIComponent(m[i + 1]));
        return { page, params };
      }
    }

    return { page: 'home', params: {} };
  },

  async resolve() {
    const { page, params } = this.match(location.pathname);

    try {
      if (!Pages[page]) throw new Error(`Unknown page: ${page}`);
      await Pages[page](params);
      window.scrollTo(0, 0);
    } catch (e) {
      console.error('Route error:', e);
      const app = document.getElementById('app');
      if (app) app.innerHTML = `<div class="error">Помилка завантаження сторінки</div>`;
    }
  }
};