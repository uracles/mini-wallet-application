#!/bin/bash

# Mini Wallet Application Setup Script
# This script helps you set up the application quickly

set -e

echo "🚀 Mini Wallet Application Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18 or higher is required${NC}"
    echo "Current version: $(node -v)"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version OK: $(node -v)${NC}"

# Check npm
echo "📦 Checking npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm OK: $(npm -v)${NC}"

# Check PostgreSQL
echo "🐘 Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL client not found${NC}"
    echo "Please install PostgreSQL or provide a remote database URL"
else
    echo -e "${GREEN}✓ PostgreSQL client found${NC}"
fi

echo ""
echo "📥 Installing dependencies..."
npm install

echo ""
echo "🔐 Setting up environment variables..."

if [ -f .env ]; then
    echo -e "${YELLOW}⚠ .env file already exists${NC}"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file"
    else
        cp .env.example .env
        echo -e "${GREEN}✓ Created new .env file${NC}"
    fi
else
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file from template${NC}"
fi

# Generate secrets
echo ""
echo "🔑 Generating secure secrets..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Update .env file on macOS and Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i '' "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
else
    # Linux
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
fi

echo -e "${GREEN}✓ Generated JWT_SECRET${NC}"
echo -e "${GREEN}✓ Generated ENCRYPTION_KEY${NC}"

echo ""
echo "⚙️  Configuration"
echo "================"
echo ""
echo "You need to configure the following in the .env file:"
echo ""
echo "1. Database Configuration:"
echo "   DATABASE_URL=postgresql://username:password@localhost:5432/mini_wallet_db"
echo ""
echo "2. Alchemy API Key (get free key at https://www.alchemy.com/):"
echo "   ALCHEMY_API_KEY=your-key-here"
echo ""
echo "3. Etherscan API Key (get free key at https://etherscan.io/apis):"
echo "   ETHERSCAN_API_KEY=your-key-here"
echo ""

read -p "Do you want to edit the .env file now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ${EDITOR:-nano} .env
fi

echo ""
echo "🗄️  Database Setup"
echo "================"
echo ""

# Ask if user wants to create database
read -p "Do you want to create the PostgreSQL database now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter database name (default: mini_wallet_db): " DB_NAME
    DB_NAME=${DB_NAME:-mini_wallet_db}
    
    echo "Creating database: $DB_NAME"
    createdb $DB_NAME 2>/dev/null || echo -e "${YELLOW}⚠ Database may already exist or you don't have PostgreSQL locally${NC}"
    
    echo ""
    echo "Running migrations..."
    npm run migrate
    echo -e "${GREEN}✓ Database migrations completed${NC}"
else
    echo -e "${YELLOW}⚠ Skipping database creation${NC}"
    echo "Remember to run 'npm run migrate' after setting up your database"
fi

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the development server:"
echo "   npm run dev"
echo ""
echo "2. The API will be available at:"
echo "   http://localhost:4000/graphql"
echo ""
echo "3. Health check:"
echo "   http://localhost:4000/health"
echo ""
echo "4. Import postman_collection.json into Postman for testing"
echo ""
echo "5. Read the documentation:"
echo "   - README.md - Overview and getting started"
echo "   - API_DOCUMENTATION.md - Complete API reference"
echo "   - DEPLOYMENT.md - Deployment guide"
echo ""
echo "🎉 Happy coding!"
