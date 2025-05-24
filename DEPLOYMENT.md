# Deployment Guide

## Production Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker and Docker Compose installed
- Domain name (optional)
- SSL certificate (optional, can use Let's Encrypt)

#### Steps

1. **Clone the repository on your server:**
   ```bash
   git clone https://github.com/tom2tomtomtom/Playbook.git
   cd Playbook
   ```

2. **Set up environment variables:**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your production values
   
   # Frontend
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your API URL
   ```

3. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d --build
   ```

4. **Set up Nginx (optional, for custom domain):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5173;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /api {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Option 2: Cloud Platform Deployment

#### AWS EC2

1. **Launch EC2 instance:**
   - Ubuntu 22.04 LTS
   - t3.medium or larger
   - Security groups: Allow ports 80, 443, 22

2. **Install dependencies:**
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose nginx certbot
   ```

3. **Follow Docker deployment steps above**

#### Google Cloud Platform

1. **Create Compute Engine instance**
2. **Install Docker and deploy**
3. **Set up Cloud Load Balancer (optional)**

#### Azure

1. **Create Virtual Machine**
2. **Install Docker and deploy**
3. **Configure Azure Load Balancer (optional)**

### Option 3: Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: playbook-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: playbook-backend
  template:
    metadata:
      labels:
        app: playbook-backend
    spec:
      containers:
      - name: backend
        image: your-registry/playbook-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: playbook-secrets
              key: openai-api-key
---
apiVersion: v1
kind: Service
metadata:
  name: playbook-backend-service
spec:
  selector:
    app: playbook-backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8000
  type: LoadBalancer
```

## Environment Variables

### Backend (Production)
```bash
# API Keys
OPENAI_API_KEY=sk-...

# Security
SECRET_KEY=generate-a-strong-random-key
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 hours

# Database
CHROMA_PERSIST_DIRECTORY=/data/chroma_db
UPLOAD_DIRECTORY=/data/uploads

# CORS
FRONTEND_URL=https://your-domain.com

# Logging
LOG_LEVEL=INFO
```

### Frontend (Production)
```bash
VITE_API_URL=https://api.your-domain.com/api/v2
```

## SSL/TLS Setup

### Using Let's Encrypt
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Using CloudFlare
1. Add your domain to CloudFlare
2. Enable "Full (strict)" SSL mode
3. Use CloudFlare origin certificates

## Monitoring and Logging

### Application Metrics
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Monitor resource usage
docker stats
```

### Set up Prometheus + Grafana (optional)
```yaml
# Add to docker-compose.yml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3000:3000"
```

## Backup and Recovery

### Automated Backups
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup ChromaDB
docker exec playbook_backend_1 tar -czf /tmp/chroma_backup_$DATE.tar.gz /app/chroma_db
docker cp playbook_backend_1:/tmp/chroma_backup_$DATE.tar.gz $BACKUP_DIR/

# Backup uploads
docker exec playbook_backend_1 tar -czf /tmp/uploads_backup_$DATE.tar.gz /app/uploads
docker cp playbook_backend_1:/tmp/uploads_backup_$DATE.tar.gz $BACKUP_DIR/

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Restore from Backup
```bash
# Stop services
docker-compose down

# Restore data
docker cp chroma_backup.tar.gz playbook_backend_1:/tmp/
docker exec playbook_backend_1 tar -xzf /tmp/chroma_backup.tar.gz -C /

# Restart services
docker-compose up -d
```

## Performance Optimization

### Backend
- Use Redis for caching frequently accessed data
- Enable connection pooling for database
- Use CDN for static assets

### Frontend
- Enable gzip compression
- Use lazy loading for components
- Implement service workers for offline support

### Database
- Regular VACUUM operations on ChromaDB
- Monitor and optimize embedding dimensions
- Implement data retention policies

## Security Hardening

1. **Use strong passwords and rotate keys regularly**
2. **Enable rate limiting on all endpoints**
3. **Implement IP whitelisting for admin endpoints**
4. **Regular security updates:**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```
5. **Monitor for suspicious activity**
6. **Implement audit logging**

## Troubleshooting

### Common Issues

1. **Backend won't start:**
   - Check OpenAI API key
   - Verify file permissions on volumes
   - Check logs: `docker logs playbook_backend_1`

2. **Frontend can't connect to backend:**
   - Verify CORS settings
   - Check API URL configuration
   - Test backend directly: `curl http://localhost:8000/api/v2/health`

3. **Out of memory errors:**
   - Increase Docker memory limits
   - Optimize chunk size in document processing
   - Implement document size limits

### Health Checks
```bash
# Backend health
curl http://localhost:8000/api/v2/health

# Frontend health
curl http://localhost:5173
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Implement session persistence
- Use shared storage for uploads (S3, GCS)

### Vertical Scaling
- Increase container resources
- Optimize embedding batch sizes
- Use GPU instances for faster processing

## Support

For deployment issues:
1. Check the logs
2. Review environment variables
3. Open an issue on GitHub
4. Contact support (if applicable)
