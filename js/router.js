// Простий роутер для SPA
const router = {
    routes: {},
    currentRoute: null,

    // Зареєструвати маршрут
    register(path, handler) {
        this.routes[path] = handler;
    },

    // Перейти на маршрут
    navigate(path, params = {}) {
        window.history.pushState({ path, params }, '', path);
        this.handleRoute(path, params);
    },

    // Обробити маршрут
    handleRoute(path, params = {}) {
        this.currentRoute = path;
        
        // Оновити активне посилання в навігації
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Знайти обробник маршруту
        let handler = this.routes[path];
        
        // Динамічні маршрути
        if (!handler) {
            if (path.startsWith('/team/')) {
                handler = this.routes['/team/:slug'];
                params.slug = path.split('/')[2];
            } else if (path.startsWith('/driver/')) {
                handler = this.routes['/driver/:slug'];
                params.slug = path.split('/')[2];
            } else if (path.startsWith('/article/')) {
                handler = this.routes['/article/:slug'];
                params.slug = path.split('/')[2];
            }
        }

        // Виконати обробник або показати 404
        if (handler) {
            handler(params);
        } else {
            this.routes['/404']();
        }

        // Прокрутити вгору
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Обробка кнопок браузера назад/вперед
window.addEventListener('popstate', (e) => {
    const state = e.state || { path: '/', params: {} };
    router.handleRoute(state.path, state.params);
});
