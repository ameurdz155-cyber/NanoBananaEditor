module.exports = {
  apps: [{
    name: 'aipod-lite',
    script: 'serve',
    args: 'dist -l 3006 -s',
    cwd: '/root/NanoBananaEditor',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
