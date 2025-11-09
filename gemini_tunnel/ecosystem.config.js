module.exports = {
  apps: [{
    name: 'gemini-tunnel-api',
    script: 'uvicorn',
    args: 'main:app --host 0.0.0.0 --port 8001 --reload',
    cwd: '/root/NanoBananaEditor/gemini_tunnel',
    interpreter: 'python3',
    watch: ['*.py', '*.json', '*.yaml', '*.yml'],
    ignore_watch: ['node_modules', '__pycache__', '*.pyc', '.git', 'logs', 'venv'],
    env: {
      'PYTHONUNBUFFERED': '1'
    },
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
