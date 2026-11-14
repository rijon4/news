# Newsletter Platform

A full-featured newsletter platform for creating, publishing, and emailing newsletters with subscriber management.

## Features

- **Auth**: Register/login with JWT, role-based access (admin/editor/subscriber)
- **Newsletters**: Create drafts, publish, view archive, rich content
- **Subscribers**: Add/manage subscribers, active/unsubscribed status
- **Campaigns**: Send a published newsletter to all active subscribers (or a test email)
- **Email**: Nodemailer backend — console/Ethereal transport in dev, easily swapped for SMTP/SendGrid/Mailgun
- **Dashboard**: Stats and quick actions for editors/admins

## Tech Stack

- **Server**: Node.js, Express, SQLite (`better-sqlite3`), JWT
- **Client**: React, Vite, Tailwind CSS, React Router
- **Email**: Nodemailer

## Quick Start

```bash
# 1. Install all dependencies (root + client + server)
npm run setup

# 2. Seed the database (creates an admin user + sample data)
npm run seed

# 3. Start the server (port 5000)
npm run dev:server

# 4. Start the client (port 5173)
npm run dev:client
```

Then open `http://localhost:5173`.

### Default seed credentials

| Role   | Email               | Password |
|--------|---------------------|----------|
| Admin  | admin@example.com   | admin123 |
| Editor | editor@example.com  | editor123|

## Project Layout

```
newsletter-platform/
├── client/            # React + Vite frontend
│   ├── src/
│   │   ├── api.js          # Axios API client
│   │   ├── App.jsx
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   └── context/        # Auth context
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── server/            # Node.js + Express backend
│   ├── src/
│   │   ├── db.js             # SQLite connection + schema
│   │   ├── mail.js           # Nodemailer transport
│   │   ├── authMiddleware.js # JWT verification
│   │   └── routes/           # Express route modules
│   ├── seed.js               # Seed script
│   ├── index.js              # Entry point
│   └── package.json
└── README.md
```

## Email Configuration

Edit `server/src/mail.js`. By default it uses Ethereal (test) transport and logs sent emails to the console. To use real SMTP:

```js
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: { user: 'YOUR_USER', pass: 'YOUR_PASS' },
});
```

Or swap in SendGrid/Mailgun via their Node SDKs.

## License

MIT