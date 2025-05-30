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
   Create a `.env.local` file in the root directory with the following variables:

   ```bash
   # Firebase Configuration (Frontend)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Firebase Admin SDK (Backend)
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"

   # IGDB API (Game Database)
   IGDB_CLIENT_ID=your_twitch_client_id
   IGDB_SECRET_KEY=your_twitch_client_secret

   # Optional: Custom API URL for production
   NEXT_PUBLIC_API_URL=https://your-production-domain.com
   ```

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
5. Generate Admin SDK key from Project Settings > Service Accounts

### IGDB API Setup
1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Create a new application
3. Get Client ID and Client Secret

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test            # Run Jest tests
```

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
