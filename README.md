# 🎮 Avalanche - Your Ultimate Gaming Platform

Avalanche is a modern gaming discovery and collection management platform built with Next.js 13+, featuring personalized recommendations, game tracking, and social features.

## ✨ Features

- **🔍 Game Discovery**: Search and discover games from the IGDB database
- **📚 Collection Management**: Track your playing, completed, and wishlist games
- **📋 Custom Lists**: Create themed lists to organize your games
- **⭐ Reviews & Ratings**: Rate and review games you've played
- **📊 Statistics Dashboard**: Visualize your gaming habits and preferences
- **🎯 Personalized Recommendations**: Get game suggestions based on your preferences
- **📅 Release Calendar**: Stay updated with upcoming game releases
- **🔐 User Authentication**: Secure user accounts with Firebase Auth
- **📱 Responsive Design**: Optimized for desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- **Next.js 13+** with App Router
- **TypeScript** for type safety
- **React** with Hooks and Context API
- **CSS Modules** for styling
- **Chart.js** for data visualization

### Backend & Database
- **Next.js API Routes** for backend functionality
- **Firebase Firestore** for user data storage
- **Firebase Authentication** for user management
- **Firebase Storage** for profile images
- **IGDB API** for game metadata

### Development Tools
- **Zod** for data validation
- **Jest** for unit testing
- **ESLint** for code quality

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase account
- IGDB API credentials (via Twitch Developer Console)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AxelDejesus/project-avalanche.git
   cd project-avalanche
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```bash
   # ⚠️ IMPORTANT: Ne JAMAIS commiter ce fichier!
   # Ajouter .env.local dans .gitignore
   
   # Firebase Configuration (Frontend)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

   # Firebase Admin SDK (Backend - KEEP SECRET!)
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Content_Here\n-----END PRIVATE KEY-----\n"

   # IGDB API (Game Database)
   IGDB_CLIENT_ID=your_twitch_client_id
   IGDB_SECRET_KEY=your_twitch_client_secret

   # Optional: API URL for production
   NEXT_PUBLIC_API_URL=https://your-domain.com
   ```

   **🔒 Security Notes:**
   - Never commit `.env.local` to version control
   - Use different credentials for development and production
   - Rotate API keys regularly
   - Use environment variables in deployment platforms (Vercel, etc.)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🔧 How to Get API Keys

### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication, Firestore Database, and Storage
4. Get your config from Project Settings > General
5. **For Admin SDK**: Go to Project Settings > Service Accounts > Generate New Private Key
   - ⚠️ Keep this file secure and never commit it to Git!

### IGDB API Setup
1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Create a new application
3. Get Client ID and Client Secret
4. ⚠️ Keep these credentials secure!

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test            # Run Jest tests
```

## 🔒 Security Best Practices

- ✅ All user inputs are validated with Zod schemas
- ✅ Firebase Admin SDK is used only on server-side
- ✅ API routes verify authentication before processing
- ✅ Sensitive data is never cached in localStorage/sessionStorage
- ✅ XSS protection through input sanitization
- ✅ Environment variables for all secrets
- ✅ HTTPS enforced in production

## 🎯 Key Features Overview

### Game Discovery
- Advanced search and filtering
- Browse by platform, genre, release date
- Personalized recommendations

### Collection Management
- Track games across different statuses (Playing, Completed, Wishlist, etc.)
- Add personal ratings and notes
- View detailed statistics and analytics

### Social Features
- Write and read game reviews
- Create and share custom game lists
- User profiles with gaming statistics

### Data Visualization
- Interactive charts showing gaming habits
- Platform and genre distribution
- Timeline of games added to collection

## 🙏 Acknowledgments

- [IGDB](https://www.igdb.com/) for providing the game database API
- [Firebase](https://firebase.google.com/) for backend services
- [Next.js](https://nextjs.org/) for the React framework

---

**⚠️ Important**: This is a portfolio project. Do not use real sensitive data in development.
