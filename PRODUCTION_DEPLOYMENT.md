# HealthLink WhatsApp Bot - Production Deployment Guide

An intelligent WhatsApp bot for HealthLink that uses semantic matching to answer user questions about the platform. This guide covers production deployment on Debian/Ubuntu servers.

## 🚀 Quick Production Deployment

### Automated Deployment (Recommended)

```bash
# Download and run the deployment script
sudo bash deploy_debian.sh
```

This script will:
- Install all dependencies
- Create a dedicated user
- Set up systemd services
- Configure firewall
- Set up logging and monitoring
- Create backup scripts

### Manual Deployment

If you prefer manual setup, follow the steps below.

## 📋 Prerequisites

- **Debian/Ubuntu Server** (tested on Ubuntu 20.04+)
- **Root access** or sudo privileges
- **Node.js 16+** and npm
- **Python 3.8+** and pip
- **Internet connection** for initial setup

## 🔧 Installation Steps

### 1. System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nodejs npm python3 python3-pip python3-venv curl git unzip htop nginx ufw
```

### 2. Create Bot User

```bash
# Create dedicated user for security
sudo useradd -r -s /bin/bash -d /opt/healthlink-bot -m whatsapp-bot
```

### 3. Deploy Application

```bash
# Copy files to production directory
sudo cp -r . /opt/healthlink-bot/
sudo chown -R whatsapp-bot:whatsapp-bot /opt/healthlink-bot
```

### 4. Install Dependencies

```bash
# Node.js dependencies
sudo -u whatsapp-bot bash -c "cd /opt/healthlink-bot && npm install --production"

# Python dependencies
sudo -u whatsapp-bot bash -c "cd /opt/healthlink-bot && pip3 install -r requirements.txt"
```

### 5. Configuration

```bash
# Copy and edit configuration
sudo cp /opt/healthlink-bot/config.env.example /opt/healthlink-bot/.env
sudo nano /opt/healthlink-bot/.env
```

**Required configuration:**
```env
WHATSAPP_SECRET=your_strong_secret_token_here
WHATSAPP_API_PORT=15852
SEMANTIC_SERVER_PORT=8000
NODE_ENV=production
LOG_LEVEL=info
```

### 6. Systemd Services

```bash
# Install services
sudo cp /opt/healthlink-bot/healthlink-bot.service /etc/systemd/system/
sudo cp /opt/healthlink-bot/healthlink-semantic.service /etc/systemd/system/

# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable healthlink-semantic.service
sudo systemctl enable healthlink-bot.service
sudo systemctl start healthlink-semantic.service
sudo systemctl start healthlink-bot.service
```

### 7. Firewall Configuration

```bash
# Enable firewall
sudo ufw enable

# Allow SSH and HTTP/HTTPS
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Note: WhatsApp API port (15852) should only be accessible locally
```

## 🔍 Verification

### Check Service Status

```bash
# Check if services are running
sudo systemctl status healthlink-semantic.service
sudo systemctl status healthlink-bot.service

# Or use the monitoring script
healthlink-status
```

### Test Semantic Server

```bash
# Test semantic search directly
curl "http://127.0.0.1:8000/?q=Qu'est-ce%20que%20HealthLink%3F"
```

### Check Logs

```bash
# View real-time logs
sudo journalctl -u healthlink-bot.service -f
sudo journalctl -u healthlink-semantic.service -f
```

## 🎯 Production Features

### ✅ What's Included

- **High Performance**: < 50ms response time
- **Scalable**: Handles hundreds of concurrent requests
- **Secure**: Dedicated user, firewall, proper permissions
- **Reliable**: Auto-restart on failure, graceful shutdown
- **Monitored**: Comprehensive logging and status monitoring
- **Backed Up**: Automated daily backups
- **Production Ready**: Environment-based configuration

### 🔧 Management Commands

```bash
# Service management
sudo systemctl start healthlink-semantic.service healthlink-bot.service
sudo systemctl stop healthlink-bot.service healthlink-semantic.service
sudo systemctl restart healthlink-semantic.service healthlink-bot.service

# Status and monitoring
healthlink-status                    # Check service status
sudo journalctl -u healthlink-bot.service -f    # View logs
healthlink-backup                    # Create backup

# Configuration
sudo nano /opt/healthlink-bot/.env   # Edit configuration
sudo systemctl reload healthlink-bot.service     # Reload config
```

## 📊 Monitoring & Maintenance

### Log Files

- **System logs**: `journalctl -u healthlink-bot.service`
- **Application logs**: Built into systemd journal
- **Error logs**: Automatically rotated

### Performance Monitoring

```bash
# Check resource usage
htop

# Check service health
healthlink-status

# Test response time
time curl "http://127.0.0.1:8000/?q=test"
```

### Backup & Recovery

```bash
# Manual backup
healthlink-backup

# Restore from backup
sudo tar -xzf /opt/backups/healthlink-bot/healthlink-bot_YYYYMMDD_HHMMSS.tar.gz -C /opt/
sudo chown -R whatsapp-bot:whatsapp-bot /opt/healthlink-bot
sudo systemctl restart healthlink-semantic.service healthlink-bot.service
```

## 🔒 Security Considerations

### Production Security Checklist

- ✅ **Dedicated user**: Bot runs as `whatsapp-bot` user
- ✅ **Firewall**: Only necessary ports open
- ✅ **API security**: Token-based authentication
- ✅ **File permissions**: Proper ownership and permissions
- ✅ **Logging**: Comprehensive audit trail
- ✅ **Updates**: Regular system updates

### Additional Security (Optional)

```bash
# Enable fail2ban for SSH protection
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Set up SSL certificates (if exposing via web)
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com
```

## 🚨 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs for errors
sudo journalctl -u healthlink-bot.service -n 50
sudo journalctl -u healthlink-semantic.service -n 50

# Check file permissions
sudo chown -R whatsapp-bot:whatsapp-bot /opt/healthlink-bot
```

**Semantic server not responding:**
```bash
# Test connectivity
curl "http://127.0.0.1:8000/?q=test"

# Check if port is in use
sudo netstat -tlnp | grep 8000
```

**WhatsApp connection issues:**
```bash
# Check QR code generation
sudo journalctl -u healthlink-bot.service -f

# Restart WhatsApp service
sudo systemctl restart healthlink-bot.service
```

**High memory usage:**
```bash
# Check memory usage
htop

# Restart services
sudo systemctl restart healthlink-semantic.service healthlink-bot.service
```

### Performance Optimization

**For high traffic:**
```bash
# Increase system limits
echo "whatsapp-bot soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "whatsapp-bot hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

**For better performance:**
```bash
# Use SSD storage
# Increase RAM if needed
# Consider load balancing for multiple instances
```

## 📈 Scaling

### Horizontal Scaling

For high-traffic scenarios, you can run multiple instances:

```bash
# Run multiple semantic servers on different ports
python3 semantic_server.py 8000 &
python3 semantic_server.py 8001 &
python3 semantic_server.py 8002 &

# Use load balancer (nginx) to distribute requests
```

### Vertical Scaling

- **CPU**: More cores for better concurrency
- **RAM**: More memory for larger knowledge bases
- **Storage**: SSD for faster I/O

## 🔄 Updates & Maintenance

### Updating the Bot

```bash
# Create backup first
healthlink-backup

# Update code
sudo -u whatsapp-bot git pull origin main

# Restart services
sudo systemctl restart healthlink-semantic.service healthlink-bot.service
```

### Updating Knowledge Base

```bash
# Edit knowledge base
sudo nano /opt/healthlink-bot/qa_knowledge.json

# Restart semantic server to reload
sudo systemctl restart healthlink-semantic.service
```

### System Updates

```bash
# Regular system updates
sudo apt update && sudo apt upgrade -y

# Restart services after updates
sudo systemctl restart healthlink-semantic.service healthlink-bot.service
```

## 📞 Support

- **Documentation**: This README and `UPDATE_QA.md`
- **Logs**: `sudo journalctl -u healthlink-bot.service -f`
- **Status**: `healthlink-status`
- **Backup**: `healthlink-backup`

## 🎉 Success!

Your HealthLink WhatsApp Bot is now running in production! 

**Next steps:**
1. Scan the QR code with WhatsApp (check logs for QR code)
2. Test the bot with sample messages
3. Monitor performance and logs
4. Set up regular backups
5. Consider SSL certificates if exposing via web

**Remember to:**
- Keep your `.env` file secure
- Monitor logs regularly
- Update the system regularly
- Test backups periodically

Happy botting! 🤖
