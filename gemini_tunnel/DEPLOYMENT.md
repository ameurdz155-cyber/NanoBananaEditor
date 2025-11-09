# Gemini Tunnel API Deployment

## Service Details
- **Domain**: aipod-api.findapply.com
- **Local Port**: 8001
- **Service**: FastAPI (Gemini Image Tunnel)
- **Location**: /root/NanoBananaEditor/gemini_tunnel

## Architecture
- **Traefik** (Docker) handles incoming requests on ports 80/443
- Routes traffic to FastAPI service on localhost:8001
- SSL certificates managed by Let's Encrypt via Traefik

## Configuration Files
1. **Traefik Config**: `/etc/dokploy/traefik/dynamic/aipod-api.yml`
2. **Systemd Service**: `/etc/systemd/system/gemini-tunnel-api.service`
3. **FastAPI App**: `/root/NanoBananaEditor/gemini_tunnel/main.py`

## Management Commands

### Check Service Status
```bash
ps aux | grep uvicorn | grep 8001
curl http://127.0.0.1:8001/docs
```

### Restart Service
```bash
# Kill current process
pkill -f "uvicorn.*8001"

# Start manually
cd /root/NanoBananaEditor/gemini_tunnel
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8001

# Or use systemd (recommended)
systemctl start gemini-tunnel-api
systemctl status gemini-tunnel-api
```

### View Logs
```bash
# If running manually
tail -f /tmp/gemini-api.log

# If using systemd
journalctl -u gemini-tunnel-api -f
```

### Test API
```bash
# Health check
curl http://127.0.0.1:8001/health

# Via domain (requires DNS setup)
curl https://aipod-api.findapply.com/health

# API Documentation
curl http://127.0.0.1:8001/docs
```

## API Endpoints
- `/health` - Health check
- `/generate/gemini` - Generate images with Gemini
- `/generate/imagen` - Generate images with Imagen
- `/edit/gemini` - Edit images
- `/upscale` - Upscale images
- `/inpaint` - Inpainting
- `/prompt/improve` - Improve prompts
- `/segment/gemini` - Image segmentation
- `/auth/login` - Authentication

## Environment Variables
Check `.env` file in `/root/NanoBananaEditor/gemini_tunnel/`

## Dependencies
```bash
cd /root/NanoBananaEditor/gemini_tunnel
source venv/bin/activate
pip install -r requirements.txt
```

## Troubleshooting

### Port Already in Use
```bash
# Find process
lsof -i :8001
# Kill it
kill <PID>
```

### Traefik Not Routing
```bash
# Check Traefik logs
docker logs dokploy-traefik --tail 50

# Verify config
cat /etc/dokploy/traefik/dynamic/aipod-api.yml

# Traefik auto-reloads, no restart needed
```

### DNS Issues
Ensure DNS record points to server IP:
```bash
dig aipod-api.findapply.com
```

## Security
- CORS enabled for all origins
- 100MB upload limit for images
- 300s timeout for AI operations
- SSL/TLS via Let's Encrypt
