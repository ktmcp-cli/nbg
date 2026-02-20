import axios from 'axios';
import { getConfig } from './config.js';

function getClient() {
  const baseUrl = getConfig('baseUrl') || 'https://apis.nbg.gr/uk/v3_1';
  const accessToken = getConfig('accessToken');
  const sandboxId = getConfig('sandboxId');

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (sandboxId) {
    headers['sandbox-id'] = sandboxId;
  }

  return axios.create({
    baseURL: baseUrl,
    headers
  });
}

// Account Access Consents
export async function createConsent(data) {
  const client = getClient();
  const response = await client.post('/account-access-consents', data);
  return response.data;
}

export async function getConsent(consentId) {
  const client = getClient();
  const response = await client.get(`/account-access-consents/${consentId}`);
  return response.data;
}

export async function deleteConsent(consentId) {
  const client = getClient();
  const response = await client.delete(`/account-access-consents/${consentId}`);
  return response.data;
}

// Accounts
export async function getAccounts(params = {}) {
  const client = getClient();
  const response = await client.get('/accounts', { params });
  return response.data;
}

export async function getAccount(accountId) {
  const client = getClient();
  const response = await client.get(`/accounts/${accountId}`);
  return response.data;
}

// Balances
export async function getAccountBalances(accountId) {
  const client = getClient();
  const response = await client.get(`/accounts/${accountId}/balances`);
  return response.data;
}

export async function getAllBalances(params = {}) {
  const client = getClient();
  const response = await client.get('/balances', { params });
  return response.data;
}

// Transactions
export async function getAccountTransactions(accountId, params = {}) {
  const client = getClient();
  const response = await client.get(`/accounts/${accountId}/transactions`, { params });
  return response.data;
}

export async function getAllTransactions(params = {}) {
  const client = getClient();
  const response = await client.get('/transactions', { params });
  return response.data;
}

// Beneficiaries
export async function getAccountBeneficiaries(accountId) {
  const client = getClient();
  const response = await client.get(`/accounts/${accountId}/beneficiaries`);
  return response.data;
}

// Standing Orders
export async function getAccountStandingOrders(accountId) {
  const client = getClient();
  const response = await client.get(`/accounts/${accountId}/standing-orders`);
  return response.data;
}

// Scheduled Payments
export async function getAccountScheduledPayments(accountId) {
  const client = getClient();
  const response = await client.get(`/accounts/${accountId}/scheduled-payments`);
  return response.data;
}

// Statements
export async function getAccountStatements(accountId, params = {}) {
  const client = getClient();
  const response = await client.get(`/accounts/${accountId}/statements`, { params });
  return response.data;
}

// Party
export async function getAccountParty(accountId) {
  const client = getClient();
  const response = await client.get(`/accounts/${accountId}/party`);
  return response.data;
}

// Sandbox
export async function createSandbox(data) {
  const client = getClient();
  const response = await client.post('/sandbox', data);
  return response.data;
}
