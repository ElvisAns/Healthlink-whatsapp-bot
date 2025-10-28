# Security Checklist for Production Deployment

## ✅ Pre-Deployment Security Review

### 1. Environment Configuration
- [ ] **Strong API Token**: `WHATSAPP_SECRET` is a strong, random token (32+ characters)
- [ ] **Local API Binding**: `WHATSAPP_API_HOST=127.0.0.1` (not 0.0.0.0)
- [ ] **Non-standard Ports**: Using non-standard ports (15852, 8000)
- [ ] **Production Mode**: `NODE_ENV=production` set
- [ ] **Log Level**: Appropriate log level set (`info` or `warn`)

### 2. System Security
- [ ] **Dedicated User**: Bot runs as `whatsapp-bot` user (not root)
- [ ] **File Permissions**: Proper ownership and permissions set
- [ ] **Firewall**: Only necessary ports open (SSH, HTTP/HTTPS)
- [ ] **System Updates**: Server is up to date
- [ ] **SSH Security**: SSH keys configured, password auth disabled

### 3. Application Security
- [ ] **API Authentication**: Token-based authentication implemented
- [ ] **Input Validation**: User input is validated and sanitized
- [ ] **Error Handling**: No sensitive information in error messages
- [ ] **Logging**: Comprehensive audit trail
- [ ] **Graceful Shutdown**: Proper signal handling

### 4. Network Security
- [ ] **Local Binding**: Services bind to 127.0.0.1 only
- [ ] **No External Access**: WhatsApp API not accessible from internet
- [ ] **HTTPS**: If exposing via web, SSL certificates configured
- [ ] **Rate Limiting**: Consider implementing rate limiting for API

### 5. Data Security
- [ ] **Backup Encryption**: Backups are encrypted
- [ ] **Log Rotation**: Logs are rotated and cleaned up
- [ ] **Sensitive Data**: No hardcoded secrets in code
- [ ] **File Permissions**: `.env` file has restricted permissions (600)

## 🔒 Security Hardening Recommendations

### Additional Security Measures

1. **Fail2ban Protection**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

2. **SSL Certificates** (if exposing via web)
   ```bash
   sudo apt install certbot
   sudo certbot --nginx -d yourdomain.com
   ```

3. **Regular Security Updates**
   ```bash
   # Set up automatic security updates
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

4. **Monitoring and Alerting**
   ```bash
   # Set up log monitoring
   sudo apt install logwatch
   ```

5. **Backup Security**
   ```bash
   # Encrypt backups
   sudo apt install gpg
   # Modify backup script to encrypt files
   ```

## 🚨 Security Incident Response

### If Security Breach Suspected

1. **Immediate Actions**
   - Stop services: `sudo systemctl stop healthlink-bot.service healthlink-semantic.service`
   - Check logs: `sudo journalctl -u healthlink-bot.service -n 100`
   - Check network connections: `sudo netstat -tlnp`
   - Change API token in `.env`

2. **Investigation**
   - Review access logs
   - Check for unauthorized file modifications
   - Verify user accounts
   - Check system integrity

3. **Recovery**
   - Restore from clean backup
   - Update all passwords and tokens
   - Patch system vulnerabilities
   - Restart services

## 📋 Regular Security Maintenance

### Weekly Tasks
- [ ] Review system logs
- [ ] Check for system updates
- [ ] Verify service status
- [ ] Review backup integrity

### Monthly Tasks
- [ ] Security audit
- [ ] Update dependencies
- [ ] Review access logs
- [ ] Test backup restoration

### Quarterly Tasks
- [ ] Full security assessment
- [ ] Penetration testing
- [ ] Update security policies
- [ ] Review and rotate secrets

## 🔍 Security Monitoring

### Key Metrics to Monitor
- Failed authentication attempts
- Unusual network traffic
- High CPU/memory usage
- Service restarts
- File system changes

### Alert Thresholds
- More than 5 failed API calls per minute
- Service down for more than 5 minutes
- CPU usage above 80% for 10+ minutes
- Memory usage above 90%

## 📞 Security Contacts

- **System Administrator**: [Your contact]
- **Security Team**: [Your security team]
- **Emergency Contact**: [Emergency contact]

## 📄 Security Documentation

- Keep this checklist updated
- Document all security incidents
- Maintain security change log
- Regular security training for team

---

**Remember**: Security is an ongoing process, not a one-time setup. Regular reviews and updates are essential for maintaining a secure production environment.
