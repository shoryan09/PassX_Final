# PassX - Secure Password Manager

A production-quality password manager built with zero-knowledge architecture. All encryption and decryption happens client-side, ensuring your master password never leaves your device.

**Deployed Project**: https://pass-x-final-xi.vercel.app/dashboard

## Features

### 🔐 Security
- **Zero-Knowledge Architecture**: Master password never stored on server
- **AES-256-GCM Encryption**: Industry-standard encryption for vault data
- **PBKDF2 Key Derivation**: Strong key derivation with 100,000 iterations
- **Client-Side Encryption**: All encryption/decryption happens in the browser

### 🎯 Core Features
- **Multiple Item Types**: Website logins, credit cards, secure notes
- **Password Generator**: Configurable length, character sets, and options
- **Password Health Dashboard**: Detect weak, reused, and old passwords
- **Security Scoring**: Overall vault security score with recommendations
- **Categories & Tags**: Organize entries with custom categories and tags
- **Search**: Search by name, URL, category, or tag

### 🎨 User Experience
- **Modern UI**: Built with React and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile
- **Real-time Sync**: Automatic vault synchronization
- **Copy to Clipboard**: Quick copy buttons for credentials

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Prisma ORM
- JWT for authentication
- bcryptjs for password hashing

### Shared
- TypeScript shared types and utilities
- Encryption utilities using Web Crypto API
- Password generation and health analysis

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6+ (local installation or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   cd "Password Manager"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your database URL and JWT secret.

4. **Set up the database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Start the development servers**
   ```bash
   # From root directory
   npm run dev
   ```
   This starts both frontend (port 3000) and backend (port 3001).

### Development

- **Frontend only**: `npm run dev:frontend`
- **Backend only**: `npm run dev:backend`
- **Both**: `npm run dev`

### Building for Production

```bash
npm run build
```

## Project Structure

```
.
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts (Auth)
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   └── ...
│   └── ...
├── backend/           # Express backend API
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   └── ...
│   ├── prisma/            # Prisma schema and migrations
│   └── ...
├── shared/            # Shared TypeScript code
│   ├── src/
│   │   ├── crypto.ts          # Encryption utilities
│   │   ├── password-generator.ts
│   │   ├── password-health.ts
│   │   └── types.ts
│   └── ...
└── ...
```

## Security Considerations

### Zero-Knowledge Architecture
- Master password is never sent to the server
- All vault data is encrypted client-side before storage
- Server only stores encrypted blobs and metadata
- Decryption happens entirely in the browser

### Encryption Details
- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with SHA-256
- **Iterations**: 100,000 (configurable)
- **IV**: 96-bit random IV per encryption
- **Salt**: Unique salt per user/item

### Best Practices
- Use a strong, unique master password
- Never share your master password
- Regularly review your security dashboard
- Update weak or reused passwords
- Rotate passwords older than 1 year

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Vault
- `GET /api/vault/items` - Get all vault items
- `GET /api/vault/items/:id` - Get single item
- `POST /api/vault/items` - Create new item
- `PUT /api/vault/items/:id` - Update item
- `DELETE /api/vault/items/:id` - Delete item
- `GET /api/vault/metadata` - Get vault metadata

All vault endpoints require authentication (JWT token).

## Contributing

This is a production-quality password manager. When contributing:

1. Follow TypeScript best practices
2. Maintain zero-knowledge architecture
3. Write tests for critical security functions
4. Document security-related changes
5. Follow the existing code style

## License

This project is for educational and portfolio purposes. Use at your own risk.

## Disclaimer

While this password manager implements strong security practices, it is provided as-is for educational purposes. For production use, consider additional security audits, penetration testing, and compliance with security standards.

