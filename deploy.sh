#!/bin/bash

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt-get install -y nginx

# Install Certbot and Nginx plugin
sudo apt-get install -y certbot python3-certbot-nginx

# Install PM2 globally
sudo npm install -g pm2

# Install project dependencies
npm install

# Build the application
npm run build

# Configure Nginx
sudo tee /etc/nginx/sites-available/palisnest.in << EOF
server {
    listen 80;
    server_name palisnest.in www.palisnest.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/palisnest.in /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Obtain SSL certificate
sudo certbot --nginx -d palisnest.in -d www.palisnest.in --non-interactive --agree-tos --email your-email@example.com

# Start the application with PM2
pm2 start npm --name "next-app" -- start
pm2 save
pm2 startup 