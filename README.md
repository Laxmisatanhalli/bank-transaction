# Bank Transaction System

A backend banking system built with Node.js, Express, and MySQL (Sequelize ORM), implementing double-entry ledger accounting, atomic transactions, and role-based access control.

## Features

- **Authentication** — Register, login, logout with JWT tokens and bcrypt password hashing
- **Token blacklisting** — Logged-out tokens are invalidated and rejected on reuse
- **Role-gated system access** — Special "system user" role (secret-key protected) can seed initial account funds
- **Double-entry ledger** — Every transaction creates a matching debit and credit entry; account balances are derived from the ledger, never stored directly
- **Atomic transactions** — Transfers use database transactions with rollback on failure, ensuring no partial/inconsistent state
- **Idempotency keys** — Duplicate transaction requests are detected and safely handled
- **Email notifications** — Registration and transaction emails sent via Mailtrap

## Tech Stack

- **Runtime:** Node.js, Express
- **Database:** MySQL
- **ORM:** Sequelize
- **Auth:** JSON Web Tokens (JWT), bcrypt
- **Email:** Mailtrap

## Project Structure

```
src/
├── config/
│   └── db.js                 # Sequelize/MySQL connection
├── controllers/
│   ├── auth.controller.js
│   ├── account.controller.js
│   └── transaction.controller.js
├── middleware/
│   └── auth.middleware.js    # JWT verification + blacklist check
├── models/
│   ├── index.js              # Model associations
│   ├── user.model.js
│   ├── account.model.js
│   ├── transaction.model.js
│   ├── ledger.model.js
│   └── blacklist.model.js
├── routes/
│   ├── auth.routes.js
│   ├── accounts.routes.js
│   └── transaction.routes.js
├── services/
│   └── email.service.js
└── app.js
server.js
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the root directory:
```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bank_transaction_system
DB_USER=root
DB_PASSWORD=your_mysql_password

JWT_SECRET=your_jwt_secret
SYSTEM_USER_SECRET=your_system_user_secret

MAILTRAP_TOKEN=your_mailtrap_token
MAILTRAP_SENDER_EMAIL=hello@demomailtrap.co
```

### 3. Create the MySQL database
```sql
CREATE DATABASE bank_transaction_system;
```
Tables are auto-created on server start via `sequelize.sync()`.

### 4. Run the server
```bash
npm run dev
```
Server starts on `http://localhost:3000`.

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|--------------|
| POST | `/api/auth/register` | Register a new user. Include `systemSecret` to create a system user. |
| POST | `/api/auth/login` | Login and receive a JWT token |
| POST | `/api/auth/logout` | Logout and blacklist the current token |

**Register example:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "password123"
}
```

### Accounts
| Method | Endpoint | Auth Required | Description |
|--------|----------|----------------|--------------|
| POST | `/api/accounts` | Yes | Create an account for the logged-in user |

### Transactions
| Method | Endpoint | Auth Required | Description |
|--------|----------|----------------|--------------|
| POST | `/api/transactions` | Yes | Transfer funds between two accounts |
| POST | `/api/transactions/system/initial-funds` | Yes (system user only) | Seed initial funds into an account |

**Transfer example:**
```json
{
  "fromAccount": 4,
  "toAccount": 2,
  "amount": 500,
  "idempotencyKey": "unique-key-here"
}
```

## How Balances Work

Accounts do **not** store a balance column directly. Instead, balance is derived by summing ledger entries:

```
balance = SUM(credit entries) - SUM(debit entries)
```

Every transaction creates exactly one debit (money leaving the source account) and one credit (money entering the destination account), keeping the ledger self-consistent and auditable — the same principle real accounting systems use.

## Notes

- New accounts start with a balance of 0. Use the `system/initial-funds` endpoint (as a system user) to seed starting balances for testing.
- Mailtrap's free/demo domain only sends emails to the account owner's registered email address.
- This project was built as a learning exercise, originally in MongoDB/Mongoose and migrated to MySQL/Sequelize.

## Future Improvements

- Remove hardcoded test delays used during development
- Add automated tests for transaction edge cases (insufficient balance, frozen accounts, duplicate idempotency keys)
- Scheduled cleanup job for expired blacklisted tokens
- Transaction reversal endpoint