# 📇 Identify Service (Bitespeed Challenge)

This is a Node.js + TypeScript API that identifies and consolidates customer contact information (email and phone number) across multiple entries, similar to Bitespeed's `/identify` service.

## 🚀 Features

- Identifies contacts using `email` and/or `phoneNumber`
- Links duplicate or related contacts via `linkedId`
- Handles merging of multiple primary contacts
- Returns consolidated data including all emails, phone numbers, and secondary contact IDs
- Built with **Express**, **TypeScript**, and **NeonDB (PostgreSQL)**

---

## 🧾 API Specification

### POST `/api/identify`

#### Request Body

```json
{
  "email": "foo@example.com",
  "phoneNumber": "1234567890"
}
```

#### Response

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["foo@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

## 🏗️ Project Structure

```
identify-service/
├── src/
│   ├── controllers/       # Route controllers
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic and DB operations
│   ├── database/          # DB connection config
│   ├── models/            # TypeScript interfaces for Contact
│   ├── app.ts             # Express app setup
│   └── server.ts          # Server entry point
├── .env                   # Environment variables
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🛠️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/identify-service.git
cd identify-service
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup `.env`

Create a `.env` file in the root:

```
DATABASE_URL=your_neon_postgres_url
PORT=3000
```

### 4. Run the server

```bash
npm run dev
```

Server runs at: `http://localhost:3000/api/identify`

---

## 🗄️ Database Schema (PostgreSQL)

```sql
CREATE TABLE "Contact" (
  "id" SERIAL PRIMARY KEY,
  "phoneNumber" VARCHAR,
  "email" VARCHAR,
  "linkedId" INTEGER REFERENCES "Contact"("id"),
  "linkPrecedence" VARCHAR CHECK ("linkPrecedence" IN ('primary', 'secondary')),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMP
);
```

---

## 🧪 Testing

You can use Postman or curl:

```bash
curl -X POST http://localhost:3000/api/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"foo@example.com", "phoneNumber":"1234567890"}'
```

---

## 👨‍💻 Tech Stack

- Node.js
- TypeScript
- Express
- NeonDB (PostgreSQL)
- dotenv

---
