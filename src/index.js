import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig } from './config.js';
import {
  createConsent,
  getConsent,
  deleteConsent,
  getAccounts,
  getAccount,
  getAccountBalances,
  getAllBalances,
  getAccountTransactions,
  getAllTransactions,
  getAccountBeneficiaries,
  getAccountStandingOrders,
  getAccountScheduledPayments,
  getAccountStatements,
  getAccountParty,
  createSandbox
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 50);
  });

  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));

  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });

  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('nbg')
  .description(chalk.bold('NBG CLI') + ' - UK Open Banking Account & Transaction API')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--base-url <url>', 'API base URL (default: https://apis.nbg.gr/uk/v3_1)')
  .option('--access-token <token>', 'OAuth access token')
  .option('--sandbox-id <id>', 'Sandbox ID for testing')
  .action((options) => {
    if (options.baseUrl) {
      setConfig('baseUrl', options.baseUrl);
      printSuccess('Base URL set');
    }
    if (options.accessToken) {
      setConfig('accessToken', options.accessToken);
      printSuccess('Access token set');
    }
    if (options.sandboxId) {
      setConfig('sandboxId', options.sandboxId);
      printSuccess('Sandbox ID set');
    }
    if (!options.baseUrl && !options.accessToken && !options.sandboxId) {
      printError('No options provided. Use --base-url, --access-token, or --sandbox-id');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const baseUrl = getConfig('baseUrl') || 'https://apis.nbg.gr/uk/v3_1 (default)';
    const accessToken = getConfig('accessToken') || 'Not set';
    const sandboxId = getConfig('sandboxId') || 'Not set';

    console.log(chalk.bold('\nNBG CLI Configuration\n'));
    console.log('Base URL:      ', chalk.cyan(baseUrl));
    console.log('Access Token:  ', accessToken === 'Not set' ? chalk.yellow(accessToken) : chalk.green('Set'));
    console.log('Sandbox ID:    ', sandboxId === 'Not set' ? chalk.yellow(sandboxId) : chalk.cyan(sandboxId));
    console.log('');
  });

// ============================================================
// CONSENTS
// ============================================================

const consentsCmd = program.command('consents').description('Manage account access consents');

consentsCmd
  .command('create')
  .description('Create a new account access consent')
  .option('--permissions <permissions...>', 'Permissions (e.g., ReadAccountsBasic ReadBalances)', ['ReadAccountsBasic', 'ReadBalances'])
  .option('--expiration <date>', 'Expiration date (ISO 8601)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const payload = {
        Data: {
          Permissions: options.permissions
        }
      };

      if (options.expiration) {
        payload.Data.ExpirationDateTime = options.expiration;
      }

      const data = await withSpinner('Creating consent...', () => createConsent(payload));

      if (options.json) {
        printJson(data);
        return;
      }

      const consent = data.Data || {};
      console.log(chalk.bold('\nConsent Created\n'));
      console.log('Consent ID:    ', chalk.cyan(consent.ConsentId || 'N/A'));
      console.log('Status:        ', chalk.green(consent.Status || 'N/A'));
      console.log('Permissions:   ', consent.Permissions?.join(', ') || 'N/A');
      console.log('');
      printSuccess('Consent created successfully');
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

consentsCmd
  .command('get <consentId>')
  .description('Get consent details')
  .option('--json', 'Output as JSON')
  .action(async (consentId, options) => {
    try {
      const data = await withSpinner(`Fetching consent ${consentId}...`, () => getConsent(consentId));

      if (options.json) {
        printJson(data);
        return;
      }

      const consent = data.Data || {};
      console.log(chalk.bold('\nConsent Details\n'));
      console.log('Consent ID:    ', chalk.cyan(consent.ConsentId || 'N/A'));
      console.log('Status:        ', chalk.green(consent.Status || 'N/A'));
      console.log('Permissions:   ', consent.Permissions?.join(', ') || 'N/A');
      console.log('Created:       ', consent.CreationDateTime || 'N/A');
      console.log('Expires:       ', consent.ExpirationDateTime || 'N/A');
      console.log('');
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

consentsCmd
  .command('delete <consentId>')
  .description('Delete/revoke a consent')
  .option('--json', 'Output as JSON')
  .action(async (consentId, options) => {
    try {
      const data = await withSpinner(`Deleting consent ${consentId}...`, () => deleteConsent(consentId));

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess(`Consent ${consentId} deleted successfully`);
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// ============================================================
// ACCOUNTS
// ============================================================

const accountsCmd = program.command('accounts').description('Manage accounts');

accountsCmd
  .command('list')
  .description('List all accounts')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const data = await withSpinner('Fetching accounts...', () => getAccounts());

      if (options.json) {
        printJson(data);
        return;
      }

      const accounts = data.Data?.Account || [];
      const tableData = accounts.map(a => ({
        id: a.AccountId,
        name: a.Nickname || a.Account?.[0]?.Name || 'N/A',
        type: a.AccountType || 'N/A',
        subtype: a.AccountSubType || 'N/A'
      }));

      printTable(tableData, [
        { key: 'id', label: 'Account ID' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'subtype', label: 'Subtype' }
      ]);
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

accountsCmd
  .command('get <accountId>')
  .description('Get account details')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    try {
      const data = await withSpinner(`Fetching account ${accountId}...`, () => getAccount(accountId));

      if (options.json) {
        printJson(data);
        return;
      }

      const account = data.Data?.Account?.[0] || {};
      console.log(chalk.bold('\nAccount Details\n'));
      console.log('Account ID:    ', chalk.cyan(account.AccountId || 'N/A'));
      console.log('Nickname:      ', account.Nickname || 'N/A');
      console.log('Type:          ', account.AccountType || 'N/A');
      console.log('Subtype:       ', account.AccountSubType || 'N/A');
      console.log('Currency:      ', account.Currency || 'N/A');
      console.log('');
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// ============================================================
// BALANCES
// ============================================================

const balancesCmd = program.command('balances').description('Manage balances');

balancesCmd
  .command('get <accountId>')
  .description('Get balances for a specific account')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    try {
      const data = await withSpinner(`Fetching balances for account ${accountId}...`, () => getAccountBalances(accountId));

      if (options.json) {
        printJson(data);
        return;
      }

      const balances = data.Data?.Balance || [];
      const tableData = balances.map(b => ({
        type: b.Type,
        amount: b.Amount?.Amount,
        currency: b.Amount?.Currency,
        creditDebit: b.CreditDebitIndicator,
        datetime: b.DateTime
      }));

      printTable(tableData, [
        { key: 'type', label: 'Type' },
        { key: 'amount', label: 'Amount' },
        { key: 'currency', label: 'Currency' },
        { key: 'creditDebit', label: 'Credit/Debit' },
        { key: 'datetime', label: 'DateTime' }
      ]);
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

balancesCmd
  .command('list')
  .description('Get balances across all accounts')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const data = await withSpinner('Fetching all balances...', () => getAllBalances());

      if (options.json) {
        printJson(data);
        return;
      }

      const balances = data.Data?.Balance || [];
      const tableData = balances.map(b => ({
        accountId: b.AccountId,
        type: b.Type,
        amount: b.Amount?.Amount,
        currency: b.Amount?.Currency,
        creditDebit: b.CreditDebitIndicator
      }));

      printTable(tableData, [
        { key: 'accountId', label: 'Account ID' },
        { key: 'type', label: 'Type' },
        { key: 'amount', label: 'Amount' },
        { key: 'currency', label: 'Currency' },
        { key: 'creditDebit', label: 'Credit/Debit' }
      ]);
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// ============================================================
// TRANSACTIONS
// ============================================================

const transactionsCmd = program.command('transactions').description('Manage transactions');

transactionsCmd
  .command('get <accountId>')
  .description('Get transactions for a specific account')
  .option('--from <date>', 'From date (ISO 8601)')
  .option('--to <date>', 'To date (ISO 8601)')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    try {
      const params = {};
      if (options.from) params.fromBookingDateTime = options.from;
      if (options.to) params.toBookingDateTime = options.to;

      const data = await withSpinner(`Fetching transactions for account ${accountId}...`, () => getAccountTransactions(accountId, params));

      if (options.json) {
        printJson(data);
        return;
      }

      const transactions = data.Data?.Transaction || [];
      const tableData = transactions.map(t => ({
        id: t.TransactionId,
        amount: t.Amount?.Amount,
        currency: t.Amount?.Currency,
        creditDebit: t.CreditDebitIndicator,
        status: t.Status,
        bookingDate: t.BookingDateTime,
        description: t.TransactionInformation || 'N/A'
      }));

      printTable(tableData, [
        { key: 'id', label: 'Transaction ID' },
        { key: 'amount', label: 'Amount' },
        { key: 'currency', label: 'Currency' },
        { key: 'creditDebit', label: 'Credit/Debit' },
        { key: 'bookingDate', label: 'Booking Date' },
        { key: 'description', label: 'Description' }
      ]);
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

transactionsCmd
  .command('list')
  .description('Get transactions across all accounts')
  .option('--from <date>', 'From date (ISO 8601)')
  .option('--to <date>', 'To date (ISO 8601)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const params = {};
      if (options.from) params.fromBookingDateTime = options.from;
      if (options.to) params.toBookingDateTime = options.to;

      const data = await withSpinner('Fetching all transactions...', () => getAllTransactions(params));

      if (options.json) {
        printJson(data);
        return;
      }

      const transactions = data.Data?.Transaction || [];
      const tableData = transactions.map(t => ({
        accountId: t.AccountId,
        id: t.TransactionId,
        amount: t.Amount?.Amount,
        currency: t.Amount?.Currency,
        creditDebit: t.CreditDebitIndicator,
        bookingDate: t.BookingDateTime
      }));

      printTable(tableData, [
        { key: 'accountId', label: 'Account ID' },
        { key: 'id', label: 'Transaction ID' },
        { key: 'amount', label: 'Amount' },
        { key: 'currency', label: 'Currency' },
        { key: 'creditDebit', label: 'Credit/Debit' },
        { key: 'bookingDate', label: 'Booking Date' }
      ]);
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// ============================================================
// BENEFICIARIES
// ============================================================

const beneficiariesCmd = program.command('beneficiaries').description('Get account beneficiaries');

beneficiariesCmd
  .command('get <accountId>')
  .description('Get beneficiaries for a specific account')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    try {
      const data = await withSpinner(`Fetching beneficiaries for account ${accountId}...`, () => getAccountBeneficiaries(accountId));

      if (options.json) {
        printJson(data);
        return;
      }

      const beneficiaries = data.Data?.Beneficiary || [];
      const tableData = beneficiaries.map(b => ({
        id: b.BeneficiaryId,
        name: b.CreditorAccount?.Name || 'N/A',
        accountId: b.CreditorAccount?.Identification || 'N/A',
        reference: b.Reference || 'N/A'
      }));

      printTable(tableData, [
        { key: 'id', label: 'Beneficiary ID' },
        { key: 'name', label: 'Name' },
        { key: 'accountId', label: 'Account ID' },
        { key: 'reference', label: 'Reference' }
      ]);
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// ============================================================
// STANDING ORDERS
// ============================================================

const standingOrdersCmd = program.command('standing-orders').description('Get standing orders');

standingOrdersCmd
  .command('get <accountId>')
  .description('Get standing orders for a specific account')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    try {
      const data = await withSpinner(`Fetching standing orders for account ${accountId}...`, () => getAccountStandingOrders(accountId));

      if (options.json) {
        printJson(data);
        return;
      }

      const orders = data.Data?.StandingOrder || [];
      const tableData = orders.map(o => ({
        id: o.StandingOrderId,
        frequency: o.Frequency,
        amount: o.FirstPaymentAmount?.Amount || o.FinalPaymentAmount?.Amount,
        currency: o.FirstPaymentAmount?.Currency || o.FinalPaymentAmount?.Currency,
        nextPayment: o.NextPaymentDateTime,
        reference: o.Reference || 'N/A'
      }));

      printTable(tableData, [
        { key: 'id', label: 'Standing Order ID' },
        { key: 'frequency', label: 'Frequency' },
        { key: 'amount', label: 'Amount' },
        { key: 'currency', label: 'Currency' },
        { key: 'nextPayment', label: 'Next Payment' },
        { key: 'reference', label: 'Reference' }
      ]);
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// ============================================================
// SCHEDULED PAYMENTS
// ============================================================

const scheduledPaymentsCmd = program.command('scheduled-payments').description('Get scheduled payments');

scheduledPaymentsCmd
  .command('get <accountId>')
  .description('Get scheduled payments for a specific account')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    try {
      const data = await withSpinner(`Fetching scheduled payments for account ${accountId}...`, () => getAccountScheduledPayments(accountId));

      if (options.json) {
        printJson(data);
        return;
      }

      const payments = data.Data?.ScheduledPayment || [];
      const tableData = payments.map(p => ({
        id: p.ScheduledPaymentId,
        scheduledDate: p.ScheduledPaymentDateTime,
        amount: p.InstructedAmount?.Amount,
        currency: p.InstructedAmount?.Currency,
        reference: p.Reference || 'N/A'
      }));

      printTable(tableData, [
        { key: 'id', label: 'Payment ID' },
        { key: 'scheduledDate', label: 'Scheduled Date' },
        { key: 'amount', label: 'Amount' },
        { key: 'currency', label: 'Currency' },
        { key: 'reference', label: 'Reference' }
      ]);
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// ============================================================
// STATEMENTS
// ============================================================

const statementsCmd = program.command('statements').description('Get account statements');

statementsCmd
  .command('get <accountId>')
  .description('Get statements for a specific account')
  .option('--from <date>', 'From date (ISO 8601)')
  .option('--to <date>', 'To date (ISO 8601)')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    try {
      const params = {};
      if (options.from) params.fromStatementDateTime = options.from;
      if (options.to) params.toStatementDateTime = options.to;

      const data = await withSpinner(`Fetching statements for account ${accountId}...`, () => getAccountStatements(accountId, params));

      if (options.json) {
        printJson(data);
        return;
      }

      const statements = data.Data?.Statement || [];
      const tableData = statements.map(s => ({
        id: s.StatementId,
        type: s.Type,
        startDate: s.StartDateTime,
        endDate: s.EndDateTime,
        description: s.StatementDescription?.[0] || 'N/A'
      }));

      printTable(tableData, [
        { key: 'id', label: 'Statement ID' },
        { key: 'type', label: 'Type' },
        { key: 'startDate', label: 'Start Date' },
        { key: 'endDate', label: 'End Date' },
        { key: 'description', label: 'Description' }
      ]);
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// ============================================================
// PARTY
// ============================================================

const partyCmd = program.command('party').description('Get account party information');

partyCmd
  .command('get <accountId>')
  .description('Get party information for a specific account')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    try {
      const data = await withSpinner(`Fetching party info for account ${accountId}...`, () => getAccountParty(accountId));

      if (options.json) {
        printJson(data);
        return;
      }

      const party = data.Data?.Party || {};
      console.log(chalk.bold('\nParty Information\n'));
      console.log('Party ID:      ', chalk.cyan(party.PartyId || 'N/A'));
      console.log('Name:          ', party.Name || 'N/A');
      console.log('Type:          ', party.PartyType || 'N/A');
      console.log('Email:         ', party.EmailAddress || 'N/A');
      console.log('Phone:         ', party.Phone || 'N/A');
      console.log('');
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// ============================================================
// SANDBOX
// ============================================================

const sandboxCmd = program.command('sandbox').description('Manage sandbox environment');

sandboxCmd
  .command('create')
  .description('Create a new sandbox')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const payload = {
        Data: {
          sandboxId: `sandbox-${Date.now()}`
        }
      };

      const data = await withSpinner('Creating sandbox...', () => createSandbox(payload));

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nSandbox Created\n'));
      console.log('Sandbox ID:    ', chalk.cyan(data.Data?.sandboxId || 'N/A'));
      console.log('');
      printSuccess('Sandbox created successfully. Use "nbg config set --sandbox-id <id>" to configure it.');
    } catch (error) {
      printError(error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
