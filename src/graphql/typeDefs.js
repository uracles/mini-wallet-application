import gql from 'graphql-tag';

export const typeDefs = gql`
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

  input RegisterInput {
    username: String!
    password: String!
  }

  input LoginInput {
    username: String!
    password: String!
  }

  input CreateWalletInput {
    network: String
  }

  input SendFundsInput {
    walletId: Int!
    toAddress: String!
    amount: String!
  }

  type Query {
    """
    Get current user information
    """
    me: User!

    """
    Get all wallets for the authenticated user
    """
    wallets: [Wallet!]!

    """
    Get a specific wallet by ID
    """
    wallet(id: Int!): Wallet

    """
    Get balance for a specific wallet
    """
    balance(walletId: Int!): Balance!

    """
    Get transaction history for a wallet
    """
    transactions(walletId: Int!, limit: Int, offset: Int): [Transaction!]!

    """
    Get a specific transaction by hash
    """
    transaction(hash: String!): Transaction
  }

  type Mutation {
    """
    Register a new user
    """
    register(input: RegisterInput!): AuthPayload!

    """
    Login with username and password
    """
    login(input: LoginInput!): AuthPayload!

    """
    Create a new wallet
    """
    createWallet(input: CreateWalletInput): WalletCreated!

    """
    Send funds from a wallet to another address
    """
    sendFunds(input: SendFundsInput!): TransactionResult!
  }

  schema {
    query: Query
    mutation: Mutation
  }
`;
