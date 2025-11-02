# 📖 PROJECT INDEX - Where to Find Everything

Welcome to the Mini Wallet Application! This index will help you find what you need quickly.

## 🚀 Getting Started (Start Here!)

1. **First Time Setup** → Read `QUICK_START.md`
2. **Complete Overview** → Read `README.md`
3. **Delivery Summary** → Read `DELIVERY_PACKAGE.md`

## 📚 Documentation by Purpose

### I want to... Set Up the Project
- **Quick setup (5 min)** → `QUICK_START.md`
- **Automated setup** → Run `./setup.sh`
- **Docker setup** → `docker-compose.yml` + `QUICK_START.md`
- **Manual setup** → `README.md` → Installation section

### I want to... Understand the Project
- **Overview & features** → `README.md`
- **Architecture & decisions** → `PROJECT_SUMMARY.md`
- **Technical specifications** → `PROJECT_SUMMARY.md` → Tech Stack
- **Security details** → `README.md` → Security section

### I want to... Use the API
- **Complete API reference** → `API_DOCUMENTATION.md`
- **GraphQL schema** → `src/graphql/typeDefs.js`
- **Test with Postman** → Import `postman_collection.json`
- **Code examples** → `API_DOCUMENTATION.md` → Examples section

### I want to... Deploy the Application
- **Deployment guide** → `DEPLOYMENT.md`
- **Platform options** → `DEPLOYMENT.md` → Choose platform
- **Environment setup** → `.env.example`
- **Docker deployment** → `docker-compose.yml`

### I want to... Test the Application
- **Run tests** → `npm test`
- **Test files** → `src/__tests__/` directory
- **Test coverage** → `npm test -- --coverage`
- **Integration testing** → `postman_collection.json`

### I want to... Understand the Code
- **Main entry point** → `src/server.js`
- **GraphQL API** → `src/graphql/` directory
- **Services** → `src/services/` directory
- **Database** → `src/config/database.js` + `src/database/migrate.js`
- **Security** → `src/utils/encryption.js` + `src/middleware/`

## 📁 File Directory

### 📄 Documentation Files
```
README.md                    - Main documentation (start here!)
QUICK_START.md              - 5-minute quick start guide
DELIVERY_PACKAGE.md         - Complete delivery summary
PROJECT_SUMMARY.md          - Technical deep dive
API_DOCUMENTATION.md        - Complete API reference  
DEPLOYMENT.md               - Multi-platform deployment guide
LICENSE                     - MIT License
```

### ⚙️ Configuration Files
```
package.json                - Dependencies and scripts
.env.example                - Environment variables template
.gitignore                  - Git ignore rules
.eslintrc.json             - Code linting rules
.prettierrc                - Code formatting rules
docker-compose.yml         - Docker services configuration
Dockerfile                 - Docker image definition
```

### 🔧 Setup & Tools
```
setup.sh                   - Automated setup script (run this!)
postman_collection.json    - API testing collection (import this!)
.github/workflows/ci-cd.yml - CI/CD pipeline configuration
```

### 💻 Source Code Structure
```
src/
├── server.js                          - Main application entry point
│
├── config/
│   └── database.js                    - PostgreSQL connection & pooling
│
├── database/
│   └── migrate.js                     - Database schema migrations
│
├── graphql/
│   ├── typeDefs.js                    - GraphQL schema definitions
│   └── resolvers.js                   - GraphQL query/mutation logic
│
├── middleware/
│   ├── auth.middleware.js             - JWT authentication
│   ├── rateLimiter.middleware.js      - API rate limiting
│   └── errorHandler.middleware.js     - Global error handling
│
├── services/
│   ├── auth.service.js                - User registration & login
│   ├── blockchain.service.js          - Ethereum/Alchemy integration
│   └── wallet.service.js              - Wallet CRUD operations
│
├── utils/
│   ├── encryption.js                  - AES-256-GCM encryption
│   ├── logger.js                      - Winston logging setup
│   └── validation.js                  - Joi validation schemas
│
└── __tests__/
    ├── encryption.test.js             - Encryption utility tests
    ├── validation.test.js             - Validation tests
    ├── auth.service.test.js           - Auth service tests
    └── blockchain.service.test.js     - Blockchain service tests
```

### 🎨 Frontend
```
public/
└── index.html             - Simple web UI for wallet management
```

## 🎯 Common Tasks & Where to Look

### Task: Create a New User
**Files**: `src/services/auth.service.js`, `src/graphql/resolvers.js`  
**API**: See `API_DOCUMENTATION.md` → Register mutation  
**Test**: `postman_collection.json` → Authentication → Register

### Task: Create a Wallet
**Files**: `src/services/wallet.service.js`, `src/services/blockchain.service.js`  
**API**: See `API_DOCUMENTATION.md` → CreateWallet mutation  
**Test**: `postman_collection.json` → Wallet → Create Wallet

### Task: Check Balance
**Files**: `src/services/blockchain.service.js`  
**API**: See `API_DOCUMENTATION.md` → Balance query  
**Test**: `postman_collection.json` → Wallet → Get Wallet Balance

### Task: Send Funds
**Files**: `src/services/wallet.service.js`, `src/services/blockchain.service.js`  
**API**: See `API_DOCUMENTATION.md` → SendFunds mutation  
**Test**: `postman_collection.json` → Transactions → Send Funds

### Task: View Transactions
**Files**: `src/services/wallet.service.js`, `src/services/blockchain.service.js`  
**API**: See `API_DOCUMENTATION.md` → Transactions query  
**Test**: `postman_collection.json` → Transactions → Get History

### Task: Modify Database Schema
**Files**: `src/database/migrate.js`  
**Run**: `npm run migrate`  
**Guide**: Add new migration object to migrations array

### Task: Add New GraphQL Endpoint
**Files**: `src/graphql/typeDefs.js` (schema), `src/graphql/resolvers.js` (logic)  
**Guide**: Define type → Add to Query/Mutation → Implement resolver

### Task: Deploy to Production
**Files**: `DEPLOYMENT.md`, `.env.example`  
**Steps**: Choose platform → Set env vars → Follow platform guide  
**Platforms**: Render, Railway, Heroku, AWS, Docker

## 🔍 Quick Reference

### Environment Variables (All in `.env`)
```
PORT                    - Server port (default: 4000)
DATABASE_URL           - PostgreSQL connection string
JWT_SECRET             - JWT signing key (auto-generated by setup.sh)
ENCRYPTION_KEY         - Private key encryption key (auto-generated)
ALCHEMY_API_KEY        - Alchemy API key (get free at alchemy.com)
ETHERSCAN_API_KEY      - Etherscan API key (get free at etherscan.io)
```

### NPM Commands
```
npm run dev            - Start development server (with auto-reload)
npm start              - Start production server
npm test               - Run all tests
npm run test:watch     - Run tests in watch mode
npm run migrate        - Run database migrations
npm run lint           - Run ESLint
npm run format         - Format code with Prettier
```

### Docker Commands
```
docker-compose up -d   - Start all services in background
docker-compose logs -f - Follow logs
docker-compose down    - Stop all services
```

### Important URLs (when running locally)
```
http://localhost:4000/              - Root endpoint (API info)
http://localhost:4000/graphql       - GraphQL Playground
http://localhost:4000/health        - Health check endpoint
http://localhost:4000 (in browser)  - Web UI
```

## 🆘 Troubleshooting Guide

**Issue**: Can't connect to database  
→ See `QUICK_START.md` → Troubleshooting → Database connection

**Issue**: Port already in use  
→ See `QUICK_START.md` → Troubleshooting → Port 4000

**Issue**: API key errors  
→ See `QUICK_START.md` → Troubleshooting → Blockchain API errors

**Issue**: Tests failing  
→ Run `npm install` → Check `.env` → See test files for details

**Issue**: Deployment problems  
→ See `DEPLOYMENT.md` → Your platform → Troubleshooting section

## 📞 Need More Help?

1. **Search the docs**: Use Ctrl+F in any .md file
2. **Check examples**: `API_DOCUMENTATION.md` has request/response examples
3. **Review tests**: `src/__tests__/` shows how components work
4. **Read comments**: Code is well-commented throughout

## ✅ Pre-Flight Checklist

Before starting development:
- [ ] Read `QUICK_START.md`
- [ ] Run `./setup.sh` or setup manually
- [ ] Configure `.env` with API keys
- [ ] Run `npm test` to verify setup
- [ ] Import `postman_collection.json`
- [ ] Access http://localhost:4000/health

Before deploying:
- [ ] All tests pass (`npm test`)
- [ ] `.env` configured for production
- [ ] Database accessible
- [ ] API keys valid
- [ ] Read `DEPLOYMENT.md`

## 🎉 You're All Set!

Everything is organized and documented. Pick a task above and dive in!

**Pro Tip**: Start with `QUICK_START.md` → run `setup.sh` → import Postman collection → start coding!

Happy developing! 🚀
