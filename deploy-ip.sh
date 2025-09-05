#!/bin/bash

# Agri-Scout AI Deployment Script for Digital Ocean (IP Address Only)
# Run this script on your Digital Ocean droplet

set -e  # Exit on any error

echo "🌾 Starting Agri-Scout AI deployment (IP address mode)..."

# Configuration
APP_DIR="/var/www/agri-scout-ai"
REPO_URL="https://github.com/YOUR_USERNAME/agri-scout-ai.git"  # Update this

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not installed)
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_status "Node.js already installed: $(node --version)"
fi

# Install PM2 globally (if not installed)
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
else
    print_status "PM2 already installed: $(pm2 --version)"
fi

# Install Nginx (if not installed)
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt install -y nginx
else
    print_status "Nginx already installed"
fi

# Create application directory
print_status "Setting up application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    print_status "Updating existing repository..."
    cd $APP_DIR
    git pull origin main
else
    print_status "Cloning repository..."
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install --production

# Create logs directory
mkdir -p logs

# Set up environment file
if [ ! -f ".env" ]; then
    print_warning "Creating .env file..."
    cp env.example .env
    print_warning "⚠️  IMPORTANT: Edit .env file and add your Gemini API key!"
    print_warning "Run: nano .env"
else
    print_status ".env file already exists"
fi

# Configure Nginx for IP address access
print_status "Configuring Nginx for IP address access..."
sudo cp nginx-ip.conf /etc/nginx/sites-available/agri-scout-ai

# Enable site
sudo ln -sf /etc/nginx/sites-available/agri-scout-ai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
    sudo systemctl reload nginx
else
    print_error "Nginx configuration is invalid!"
    exit 1
fi

# Start/restart application with PM2
print_status "Starting application with PM2..."
pm2 delete agri-scout-ai 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Enable services
print_status "Enabling services..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Get the server's IP address
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || curl -s ipecho.net/plain)

print_status "Deployment completed! 🎉"
echo ""
echo "Next steps:"
echo "1. Edit your .env file: nano $APP_DIR/.env"
echo "2. Add your Gemini API key to the .env file"
echo "3. Restart the application: pm2 restart agri-scout-ai"
echo ""
echo "Your app is available at:"
echo "- HTTP: http://$SERVER_IP"
if [ ! -z "$SERVER_IP" ]; then
    echo "- Direct link: http://$SERVER_IP"
fi
echo ""
echo "Useful commands:"
echo "- Check app status: pm2 status"
echo "- View app logs: pm2 logs agri-scout-ai"
echo "- Restart app: pm2 restart agri-scout-ai"
echo "- Check nginx status: sudo systemctl status nginx"