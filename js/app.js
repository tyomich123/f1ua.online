// Ініціалізація додатку
document.addEventListener('DOMContentLoaded', () => {
    console.log('F1 Ukraine App Loading...');
    console.log('API URL:', CONFIG.API_URL);

    // Реєстрація маршрутів
    router.register('/', Pages.home);
    router.register('/teams', Pages.teams);
    router.register('/team/:slug', Pages.team);
    router.register('/drivers', Pages.drivers);
    router.register('/driver/:slug', Pages.driver);
    router.register('/standings', Pages.standings);
    router.register('/news', Pages.news);
    router.register('/article/:slug', Pages.article);
    router.register('/404', Pages.notFound);

    // Завантажити початковий маршрут
    const path = window.location.pathname;
    router.handleRoute(path);

    console.log('F1 Ukraine App Ready!');
});
