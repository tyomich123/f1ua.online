// Ініціалізація застосунку
document.addEventListener('DOMContentLoaded', () => {
  try {
    if (typeof router === 'undefined') {
      console.error('router is not defined. Check script loading order in index.html');
      return;
    }

    // Для history-router (URL без #)
    if (typeof router.init === 'function') {
      router.init();
      return;
    }

    // Фолбек на старий роутер (якщо в тебе ще router.render)
    if (typeof router.render === 'function') {
      router.render(location.pathname);
      return;
    }

    // Фолбек на resolve()
    if (typeof router.resolve === 'function') {
      router.resolve();
      return;
    }

    console.error('router has no init/render/resolve method');
  } catch (e) {
    console.error('App init error:', e);
    const app = document.getElementById('app');
    if (app) app.innerHTML = `<div class="error">Помилка ініціалізації застосунку</div>`;
  }
});