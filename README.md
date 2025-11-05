# Mini Wallet Application

Mini Wallet Application built with Node.js, GraphQL, and PostgreSQL that integrates with Ethereum blockchain APIs. This application provides secure wallet management, balance checking, fund transfers, and transaction history tracking on Ethereum testnet.


##  Features

- **Wallet Management**
  - Create new Ethereum wallets
  - Secure private key encryption and storage
  - Multi-wallet support per user
  
- **Blockchain Operations**
  - Check wallet balances
  - Send ETH to other addresses (testnet)
  - View transaction history
  - Real-time transaction status updates

- **Security**
  - JWT-based authentication
  - Password hashing with bcrypt
  - Private key encryption (AES-256-GCM)
  - Rate limiting on all endpoints
  - Input validation and sanitization
  - Helmet.js security headers

- **Production-Ready**
  - Comprehensive unit tests (70%+ coverage)
  - Docker support with docker-compose
  - CI/CD pipeline with GitHub Actions
  - Structured logging with Winston
  - Error handling and monitoring
  - Database migrations

## Tech Stack

- **Backend**: Node.js 18+, Express.js
- **GraphQL**: Apollo Server 4
- **Database**: PostgreSQL
- **Blockchain**: Ethereum (Sepolia Testnet), Ethers.js v6
- **APIs**: Alchemy, Etherscan
- **Testing**: Jest
- **DevOps**: Docker, Docker Compose, GitHub Actions
- **Security**: JWT, bcrypt, Helmet, rate-limiter-flexible

##  Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 13
- Alchemy API key (free tier available at [alchemy.com](https://www.alchemy.com/))
- Etherscan API key (free at [etherscan.io](https://etherscan.io/apis))

##  Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mini-wallet-app.git
cd mini-wallet-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp  .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=10000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/mini_wallet_db

# JWT Secret (generate a strong secret)
JWT_SECRET={secret}

# Ethereum Configuration
ETHEREUM_NETWORK=sepolia
ALCHEMY_API_KEY={alchemy_key}
ETHERSCAN_API_KEY={etherscan-api-key}

# Encryption Key (32 characters minimum)
ENCRYPTION_KEY={encryption-key}

### 4. Database Setup

Create PostgreSQL database:

```bash
createdb mini_wallet_db
```

Run migrations:

```bash
npm run migrate
```

### 5. Start the Application

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start at `http://localhost:10000`

## Docker Setup

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will start both PostgreSQL and the application in containers.

### Using Docker Only

```bash
# Build image
docker build -t mini-wallet-app .

# Run container
docker run -p 10000:10000 --env-file .env mini-wallet-app
```

##  API Documentation

### GraphQL Endpoint

`POST http://localhost:10000/graphql`

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Schema Overview

#### Mutations

##### Register User
```graphql
mutation Register {
  register(input: {
    username: "tuser"
    password: "PassWord2@"
  }) {
    user {
      id
      username
      createdAt
    }
    token
  }
}
```

##### Login
```graphql
mutation Login {
  login(input: {
    username: "tuser"
    password: "PassWord@2"
  }) {
    user {
      id
      username
    }
    token
  }
}
```

##### Create Wallet
```graphql
mutation CreateWallet {
  createWallet(input: {
    network: "sepolia"
  }) {
    id
    address
    network
    mnemonic
    createdAt
  }
}
```

** Important**: Save the `mnemonic` phrase securely! It's only returned once during wallet creation.

##### Send Funds
```graphql
mutation SendFunds {
  sendFunds(input: {
    walletId: 1
    toAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    amount: "0.01"
  }) {
    transaction {
      id
      transactionHash
      fromAddress
      toAddress
      amount
      status
    }
    hash
  }
}
```

#### Queries

##### Get Current User
```graphql
query Me {
  me {
    id
    username
    createdAt
  }
}
```

##### Get All Wallets
```graphql
query Wallets {
  wallets {
    id
    address
    network
    createdAt
  }
}
```

##### Get Wallet Balance
```graphql
query Balance {
  balance(walletId: 1) {
    walletId
    address
    ether
    wei
  }
}
```

##### Get Transaction History
```graphql
query Transactions {
  transactions(walletId: 1, limit: 10, offset: 0) {
    id
    transactionHash
    fromAddress
    toAddress
    amount
    status
    timestamp
  }
}
```

##  Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

##  Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Private Keys**: Encrypted using AES-256-GCM with unique salt/IV per encryption
3. **Passwords**: Hashed using bcrypt with salt rounds = 10
4. **JWT Tokens**: Signed with strong secret, expires in 24 hours
5. **Rate Limiting**: 
   - General API: 100 requests per 15 minutes
   - Auth endpoints: 5 attempts per 15 minutes
   - Transactions: 10 per hour
6. **Input Validation**: All inputs validated using Joi schemas
7. **SQL Injection**: Protected via parameterized queries
8. **CORS**: Configured for specific origins in production

##  Architecture Decisions

### 1. Database Choice: PostgreSQL
- **Why**: ACID compliance, excellent support for transactions, mature ecosystem
- **Alternative considered**: MongoDB - rejected due to need for relational data integrity

### 2. GraphQL over REST
- **Why**: Flexible data fetching, type safety, single endpoint
- **Benefit**: Reduces over-fetching and under-fetching of data

### 3. Ethers.js v6
- **Why**: Modern, well-maintained, TypeScript support, extensive documentation
- **Benefit**: Simplified blockchain interactions with better error handling

### 4. Alchemy + Etherscan
- **Why**: Reliable infrastructure, generous free tier, comprehensive APIs
- **Benefit**: Alchemy for node access, Etherscan for transaction history

### 5. AES-256-GCM Encryption
- **Why**: Authenticated encryption, prevents tampering
- **Benefit**: Secure private key storage with integrity verification

### 6. JWT Authentication
- **Why**: Stateless, scalable, industry standard
- **Benefit**: Easy to implement, works well with GraphQL context

##  Deployment

### Recommended Platforms

1. **Render** (Recommended)
   - Automatic deploys from GitHub
   - Free PostgreSQL database
   - Environment variable management
   - [Deploy Guide](https://render.com/docs)


### Deployment Steps (Render Example)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Add PostgreSQL database
5. Set environment variables
6. Deploy!


