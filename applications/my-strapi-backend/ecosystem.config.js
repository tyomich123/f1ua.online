module.exports = {
  apps: [{
    name: 'strapi-dev',
    script: 'npm',
    args: 'run develop',
    cwd: '/home/admin1/public_html/applications/my-strapi-backend',
    env: {
      NODE_ENV: 'development'
    },
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    kill_timeout: 5000,
    restart_delay: 4000
  }]
};
