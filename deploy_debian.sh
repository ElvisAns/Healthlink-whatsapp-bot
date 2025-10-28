#!/bin/bash

# HealthLink WhatsApp Bot - Debian Deployment Script
# This script sets up the bot for production on Debian/Ubuntu

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BOT_USER="whatsapp-bot"
BOT_DIR="/opt/healthlink-bot"
SERVICE_DIR="/etc/systemd/system"

echo -e "${BLUE}🚀 HealthLink WhatsApp Bot - Debian Deployment${NC}"
echo "=================================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ This script must be run as root${NC}"
    echo "   Use: sudo $0"
    exit 1
fi

# Update system packages
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install required system packages
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"
apt install -y \
    nodejs \
    npm \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    git \
    unzip \
    htop \
    nginx \
    ufw

# Create bot user
echo -e "${YELLOW}👤 Creating bot user...${NC}"
if ! id "$BOT_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d "$BOT_DIR" -m "$BOT_USER"
    echo -e "${GREEN}✅ User $BOT_USER created${NC}"
else
    echo -e "${YELLOW}⚠️  User $BOT_USER already exists${NC}"
fi

# Create bot directory
echo -e "${YELLOW}📁 Setting up bot directory...${NC}"
mkdir -p "$BOT_DIR"
chown "$BOT_USER:$BOT_USER" "$BOT_DIR"

# Copy bot files (assuming we're running from the bot directory)
echo -e "${YELLOW}📋 Copying bot files...${NC}"
cp -r . "$BOT_DIR/"
chown -R "$BOT_USER:$BOT_USER" "$BOT_DIR"

# Install Node.js dependencies
echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
sudo -u "$BOT_USER" bash -c "cd $BOT_DIR && npm install --production"

# Install Python dependencies
echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
sudo -u "$BOT_USER" bash -c "cd $BOT_DIR && pip3 install -r requirements.txt"

# Set up environment file
echo -e "${YELLOW}⚙️  Setting up environment configuration...${NC}"
if [ ! -f "$BOT_DIR/.env" ]; then
    cp "$BOT_DIR/config.env.example" "$BOT_DIR/.env"
    chown "$BOT_USER:$BOT_USER" "$BOT_DIR/.env"
    echo -e "${YELLOW}⚠️  Please edit $BOT_DIR/.env with your configuration${NC}"
fi

# Install systemd services
echo -e "${YELLOW}🔧 Installing systemd services...${NC}"
cp "$BOT_DIR/healthlink-bot.service" "$SERVICE_DIR/"
cp "$BOT_DIR/healthlink-semantic.service" "$SERVICE_DIR/"
systemctl daemon-reload

# Enable services
systemctl enable healthlink-semantic.service
systemctl enable healthlink-bot.service

# Set up firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
# Note: WhatsApp API port (15852) should only be accessible locally

# Set up log rotation
echo -e "${YELLOW}📝 Setting up log rotation...${NC}"
cat > /etc/logrotate.d/healthlink-bot << EOF
/var/log/healthlink-bot/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $BOT_USER $BOT_USER
    postrotate
        systemctl reload healthlink-bot.service healthlink-semantic.service
    endscript
}
EOF

# Create log directory
mkdir -p /var/log/healthlink-bot
chown "$BOT_USER:$BOT_USER" /var/log/healthlink-bot

# Set up monitoring script
echo -e "${YELLOW}📊 Setting up monitoring...${NC}"
cat > /usr/local/bin/healthlink-status << 'EOF'
#!/bin/bash
echo "HealthLink Bot Status"
echo "===================="
echo "Semantic Server: $(systemctl is-active healthlink-semantic.service)"
echo "WhatsApp Bot: $(systemctl is-active healthlink-bot.service)"
echo ""
echo "Recent logs:"
echo "Semantic Server:"
journalctl -u healthlink-semantic.service -n 5 --no-pager
echo ""
echo "WhatsApp Bot:"
journalctl -u healthlink-bot.service -n 5 --no-pager
EOF
chmod +x /usr/local/bin/healthlink-status

# Set up backup script
echo -e "${YELLOW}💾 Setting up backup script...${NC}"
cat > /usr/local/bin/healthlink-backup << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/healthlink-bot"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# Backup bot files
tar -czf "$BACKUP_DIR/healthlink-bot_$DATE.tar.gz" \
    -C /opt healthlink-bot \
    --exclude=node_modules \
    --exclude=.env

# Keep only last 7 backups
find "$BACKUP_DIR" -name "healthlink-bot_*.tar.gz" -mtime +7 -delete

echo "Backup created: $BACKUP_DIR/healthlink-bot_$DATE.tar.gz"
EOF
chmod +x /usr/local/bin/healthlink-backup

# Set up cron job for backups
echo "0 2 * * * /usr/local/bin/healthlink-backup" | crontab -u "$BOT_USER" -

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Edit configuration: nano $BOT_DIR/.env"
echo "2. Start services: systemctl start healthlink-semantic.service healthlink-bot.service"
echo "3. Check status: healthlink-status"
echo "4. View logs: journalctl -u healthlink-bot.service -f"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  Start services: systemctl start healthlink-semantic.service healthlink-bot.service"
echo "  Stop services: systemctl stop healthlink-bot.service healthlink-semantic.service"
echo "  Restart services: systemctl restart healthlink-semantic.service healthlink-bot.service"
echo "  Check status: healthlink-status"
echo "  View logs: journalctl -u healthlink-bot.service -f"
echo "  Backup: healthlink-backup"
echo ""
echo -e "${YELLOW}⚠️  Don't forget to:${NC}"
echo "  - Configure your .env file with proper secrets"
echo "  - Test the bot by scanning the QR code"
echo "  - Set up SSL certificates if exposing via web"
echo ""
echo -e "${GREEN}🎉 Your HealthLink WhatsApp Bot is ready for production!${NC}"
