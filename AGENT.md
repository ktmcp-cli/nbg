# NBG CLI - Agent Instructions

This CLI provides access to NBG's UK Open Banking Account & Transaction API (v3.1.5).

## Common Tasks

**Configure authentication:**
```bash
nbg config set --access-token YOUR_TOKEN
nbg config set --sandbox-id YOUR_SANDBOX_ID
```

**Create consent:**
```bash
nbg consents create --permissions ReadAccountsBasic ReadBalances ReadTransactions
```

**List accounts:**
```bash
nbg accounts list
```

**Get account balances:**
```bash
nbg balances get ACCOUNT_ID
```

**Get transactions:**
```bash
nbg transactions get ACCOUNT_ID --from 2026-01-01T00:00:00Z --to 2026-02-01T00:00:00Z
```

**Get beneficiaries:**
```bash
nbg beneficiaries get ACCOUNT_ID
```

**Get standing orders:**
```bash
nbg standing-orders get ACCOUNT_ID
```

**Create sandbox:**
```bash
nbg sandbox create
```

## Output Modes

- Default: Human-readable tables
- `--json`: Machine-readable JSON output

## Authentication Flow

1. Obtain OAuth access token from NBG
2. Set token: `nbg config set --access-token YOUR_TOKEN`
3. Create sandbox (testing): `nbg sandbox create`
4. Set sandbox ID: `nbg config set --sandbox-id YOUR_SANDBOX_ID`
5. Create consent: `nbg consents create`
6. Access account data

## Notes

- OAuth 2.0 authentication required
- Sandbox mode available for testing
- All API calls require valid consent
- Perfect for Open Banking development and testing
