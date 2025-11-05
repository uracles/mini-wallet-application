# API Documentation: This link is the API collections on Postman.
  https://web.postman.co/workspace/My-Workspace~f820e2b6-40e3-4203-88df-2dab18bc111c/collection/31055006-8a9599fc-6885-4990-b95d-32976df2538a?action=share&source=copy-link&creator=31055006

## Base URL

- **Development**: `http://localhost:10000`
- **Production**: `https://your-app-name.onrender.com`

## Authentication

All protected endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## GraphQL Endpoint

**URL**: `/graphql`  
**Method**: `POST`

## Complete GraphQL Schema

```graphql
type User {
  id: Int!
  username: String!
  createdAt: String!
}

type AuthPayload {
  user: User!
  token: String!
}

type Wallet {
  id: Int!
  userId: Int!
  address: String!
  network: String!
  createdAt: String!
  updatedAt: String!
}

type WalletCreated {
  id: Int!
  userId: Int!
  address: String!
  network: String!
  createdAt: String!
  mnemonic: String
}

type Balance {
  walletId: Int!
  address: String!
  network: String!
  wei: String!
  ether: String!
}

type Transaction {
  id: Int!
  walletId: Int!
  transactionHash: String!
  fromAddress: String!
  toAddress: String!
  amount: String!
  gasPrice: String
  gasUsed: String
  status: String!
  blockNumber: String
  timestamp: String
  createdAt: String!
}

type TransactionResult {
  transaction: Transaction!
  hash: String!
  from: String!
  to: String!
  amount: String!
}

type Query {
  me: User!
  wallets: [Wallet!]!
  wallet(id: Int!): Wallet
  balance(walletId: Int!): Balance!
  transactions(walletId: Int!, limit: Int, offset: Int): [Transaction!]!
  transaction(hash: String!): Transaction
}

type Mutation {
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  createWallet(input: CreateWalletInput): WalletCreated!
  sendFunds(input: SendFundsInput!): TransactionResult!
}
```

## Examples

### 1. Register a New User

**Request**:
```graphql
mutation {
  register(input: {
    username: "johndoe"
    password: "SecurePass123!"
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

**Response**:
```json
{
  "data": {
    "register": {
      "user": {
        "id": 1,
        "username": "johndoe",
        "createdAt": "2025-10-31T10:30:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### 2. Login

**Request**:
```graphql
mutation {
  login(input: {
    username: "johndoe"
    password: "SecurePass123!"
  }) {
    user {
      id
      username
    }
    token
  }
}
```

### 3. Create a Wallet

**Request**:
```graphql
mutation {
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

**Response**:
```json
{
  "data": {
    "createWallet": {
      "id": 1,
      "address": "0x1234567890abcdef1234567890abcdef12345678",
      "network": "sepolia",
      "mnemonic": "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12",
      "createdAt": "2025-10-31T10:35:00.000Z"
    }
  }
}
```

**⚠️ IMPORTANT**: Save the mnemonic phrase securely! It's only shown once.

### 4. Get All Wallets

**Request**:
```graphql
query {
  wallets {
    id
    address
    network
    createdAt
  }
}
```

### 5. Check Wallet Balance

**Request**:
```graphql
query {
  balance(walletId: 1) {
    walletId
    address
    ether
    wei
  }
}
```

**Response**:
```json
{
  "data": {
    "balance": {
      "walletId": 1,
      "address": "0x1234567890abcdef1234567890abcdef12345678",
      "ether": "0.5",
      "wei": "500000000000000000"
    }
  }
}
```

### 6. Send Funds

**Request**:
```graphql
mutation {
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

**Response**:
```json
{
  "data": {
    "sendFunds": {
      "transaction": {
        "id": 1,
        "transactionHash": "0xabc123...",
        "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
        "toAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "amount": "0.01",
        "status": "pending"
      },
      "hash": "0xabc123..."
    }
  }
}
```

### 7. Get Transaction History

**Request**:
```graphql
query {
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

### 8. Get Current User Info

**Request**:
```graphql
query {
  me {
    id
    username
    createdAt
  }
}
```

## Error Handling

Errors are returned in the standard GraphQL format:

```json
{
  "errors": [
    {
      "message": "Authentication required",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

### Common Error Codes

- `UNAUTHENTICATED`: Missing or invalid authentication token
- `BAD_USER_INPUT`: Invalid input data (validation errors)
- `INTERNAL_SERVER_ERROR`: Server-side error
- `NOT_FOUND`: Resource not found

## Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 attempts per 15 minutes per IP
- **Transaction endpoints**: 10 transactions per hour per user

When rate limit is exceeded:

```json
{
  "error": "Too many requests",
  "message": "Please try again later",
  "retryAfter": 900
}
```

## Networks Supported

- `mainnet` - Ethereum Mainnet (use with caution, real ETH)
- `sepolia` - Sepolia Testnet (recommended for testing)
- `goerli` - Goerli Testnet (deprecated, but still supported)

## Transaction Status Values

- `pending` - Transaction submitted to network
- `confirmed` - Transaction confirmed on blockchain
- `failed` - Transaction failed

## Getting Test ETH

To test transactions on Sepolia testnet:

1. **Alchemy Faucet**: https://sepoliafaucet.com/
2. **Infura Faucet**: https://www.infura.io/faucet/sepolia
3. **Sepolia PoW Faucet**: https://sepolia-faucet.pk910.de/

## Postman Collection

Import the `postman_collection.json` file into Postman for easy API testing. The collection includes:

- All API endpoints
- Example requests and responses
- Automatic token management
- Pre-configured variables

## GraphQL Playground

When running in development mode, access the GraphQL Playground at:

```
http://localhost:4000/graphql
```

The playground provides:
- Interactive API exploration
- Auto-completion
- Documentation browser
- Query history

## Best Practices

1. **Always store tokens securely** - Never expose JWT tokens in client-side code
2. **Save mnemonic phrases** - They are only shown once during wallet creation
3. **Use testnet for development** - Always test with Sepolia before using mainnet
4. **Handle errors gracefully** - Implement proper error handling in your application
5. **Respect rate limits** - Implement exponential backoff for retries
6. **Validate inputs** - Always validate data before sending to API
7. **Monitor transactions** - Check transaction status after sending funds
