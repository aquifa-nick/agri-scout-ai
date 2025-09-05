# 🚀 Digital Ocean Deployment Guide

This guide will help you deploy your Agri-Scout AI app to a Digital Ocean droplet.

## Prerequisites

- Digital Ocean droplet (Ubuntu 20.04 or 22.04 recommended)
- Domain name pointed to your droplet's IP address
- SSH access to your droplet
- Gemini API key

## Quick Deployment

### 1. Prepare Your Repository

First, push your code to GitHub:

```bash
# Add all files and commit
git add .
git commit -m "🚀 Prepare for Digital Ocean deployment"
git push origin main
```

### 2. Connect to Your Droplet

```bash
ssh root@your-droplet-ip
# or
ssh your-username@your-droplet-ip
```

### 3. Create a Non-Root User (if using root)

```bash
adduser deployer
usermod -aG sudo deployer
su - deployer
```

### 4. Run the Automated Deployment

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/agri-scout-ai.git
cd agri-scout-ai

# Update the deployment script with your details
nano deploy.sh
# Update REPO_URL and DOMAIN variables

# Run deployment
./deploy.sh
```

### 5. Configure Your API Key

```bash
# Edit environment file
nano /var/www/agri-scout-ai/.env

# Add your Gemini API key:
GEMINI_API_KEY=your_actual_api_key_here

# Restart the application
pm2 restart agri-scout-ai
```

## Manual Deployment Steps

If you prefer to deploy manually:

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 and Nginx
sudo npm install -g pm2
sudo apt install -y nginx

# Install Git (if not installed)
sudo apt install -y git
```

### 2. Set Up Application

```bash
# Create app directory
sudo mkdir -p /var/www/agri-scout-ai
sudo chown -R $USER:$USER /var/www/agri-scout-ai

# Clone repository
git clone https://github.com/YOUR_USERNAME/agri-scout-ai.git /var/www/agri-scout-ai
cd /var/www/agri-scout-ai

# Install dependencies
npm install --production

# Create logs directory
mkdir -p logs

# Set up environment
cp env.example .env
nano .env  # Add your Gemini API key
```

### 3. Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/agri-scout-ai

# Update domain name in config
sudo sed -i 's/your-domain.com/youractual-domain.com/g' /etc/nginx/sites-available/agri-scout-ai

# Enable site
sudo ln -s /etc/nginx/sites-available/agri-scout-ai /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Start Application with PM2

```bash
# Start app
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup  # Follow the instructions to set up auto-start
```

### 5. Configure Firewall

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

## SSL Certificate Setup (Recommended)

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Useful Commands

### Application Management
```bash
# Check app status
pm2 status

# View logs
pm2 logs agri-scout-ai

# Restart app
pm2 restart agri-scout-ai

# Stop app
pm2 stop agri-scout-ai

# Monitor app
pm2 monit
```

### Server Management
```bash
# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Test nginx config
sudo nginx -t
```

### Updates and Maintenance
```bash
# Update application
cd /var/www/agri-scout-ai
git pull origin main
npm install --production
pm2 restart agri-scout-ai

# View system resources
htop
df -h  # Disk usage
free -h  # Memory usage
```

## Troubleshooting

### Common Issues

1. **App not starting**
   ```bash
   pm2 logs agri-scout-ai
   # Check for errors in the logs
   ```

2. **Nginx 502 Bad Gateway**
   ```bash
   # Check if Node.js app is running
   pm2 status
   
   # Check nginx error logs
   sudo tail -f /var/log/nginx/error.log
   ```

3. **API Key Issues**
   ```bash
   # Check if .env file exists and has the key
   cat /var/www/agri-scout-ai/.env
   
   # Test API endpoint
   curl http://localhost:3000/api/health
   ```

4. **Domain not resolving**
   - Check DNS settings
   - Ensure domain points to droplet IP
   - Wait for DNS propagation (up to 24 hours)

### Performance Optimization

1. **Enable Gzip compression** (already in nginx config)
2. **Set up Redis caching** (optional)
3. **Configure log rotation**
   ```bash
   sudo nano /etc/logrotate.d/agri-scout-ai
   ```

## Security Best Practices

1. **Regular Updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Firewall Configuration**
   ```bash
   sudo ufw status
   ```

3. **SSH Key Authentication** (disable password login)
4. **Regular Backups** of your application and database
5. **Monitor logs** for suspicious activity

## Monitoring

Set up basic monitoring:

```bash
# Install htop for system monitoring
sudo apt install -y htop

# Set up PM2 monitoring
pm2 install pm2-logrotate
```

Your Agri-Scout AI app should now be live at your domain! 🎉

For support or issues, check the logs and troubleshooting section above.
