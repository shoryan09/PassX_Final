#!/bin/bash

echo "🚀 Setting up PassX..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Build shared package first
echo "🔨 Building shared package..."
cd shared
npm install
npm run build
cd ..

# Install and setup backend
echo "📦 Setting up backend..."
cd backend
npm install
npx prisma generate
cd ..

# Install frontend
echo "📦 Setting up frontend..."
cd frontend
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy env.example to .env and configure your database"
echo "2. Run 'cd backend && npx prisma migrate dev' to set up the database"
echo "3. Run 'npm run dev' from the root to start development servers"

