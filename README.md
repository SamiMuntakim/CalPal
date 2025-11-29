# CalPal

A modern, AI-powered calorie tracking and nutrition management app built with React Native and Expo.

## Overview

CalPal helps you achieve your health and fitness goals through intelligent food tracking, personalized nutrition recommendations, and comprehensive progress monitoring. The app leverages AI to analyze food images and provide detailed nutritional information, making calorie tracking effortless and accurate.

## Features

### 🍎 **AI-Powered Food Analysis**

- Capture photos of your meals and get instant nutritional breakdowns
- Automatic calorie, protein, carb, and fat estimation
- Powered by Google Gemini AI for accurate food recognition

### 📊 **Comprehensive Tracking**

- Daily meal diary with detailed nutrition logging
- Weight tracking with trend analysis
- Exercise logging with calorie burn estimates
- Progress visualization over time

### 🎯 **Personalized Goals**

- Custom nutrition targets based on your profile
- Goal-based recommendations (weight loss, maintenance, or gain)
- Activity level-based calorie calculations
- Personalized meal planning suggestions

### 📱 **User Experience**

- Intuitive onboarding flow
- Clean, modern interface
- Cross-platform support (iOS, Android)
- Offline-capable with cloud sync

### 💎 **Premium Features**

- Advanced analytics and insights
- Extended meal history
- Priority AI processing
- Ad-free experience

## Tech Stack

- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based routing)
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **AI Services**: Google Gemini API
- **Subscriptions**: RevenueCat
- **State Management**: React Context API
- **Language**: TypeScript

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- Firebase project setup
- Google Gemini API key
- RevenueCat account (for subscription features)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/calpal.git
   cd calpal
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory (or use EAS Secrets for production):

   ```env
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   FIREBASE_APP_ID=your_firebase_app_id
   GEMINI_API_KEY=your_gemini_api_key
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   REVENUECAT_API_KEY_IOS=your_revenuecat_ios_key
   REVENUECAT_API_KEY_ANDROID=your_revenuecat_android_key
   ```

   Alternatively, for local development, create `app.config.local.js`:

   ```javascript
   module.exports = {
     firebase: {
       apiKey: "your_firebase_api_key",
       authDomain: "your_firebase_auth_domain",
       // ... other Firebase config
     },
     geminiApiKey: "your_gemini_api_key",
     revenueCat: {
       apiKeyIOS: "your_revenuecat_ios_key",
       apiKeyAndroid: "your_revenuecat_android_key",
     },
   };
   ```

4. **Start the development server**

   ```bash
   npx expo start
   ```

5. **Run on your preferred platform**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your device

## Project Structure

```
calpal/
├── app/                    # Main application code
│   ├── (onboarding)/      # Onboarding flow screens
│   ├── (tabs)/            # Main app tabs
│   ├── components/        # Reusable components
│   └── profile/           # Profile and subscription screens
├── components/            # Shared components
├── contexts/              # React context providers
├── hooks/                 # Custom React hooks
├── services/              # API and service integrations
├── constants/             # App constants
└── assets/                # Images, fonts, and other assets
```

## Development

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Building for Production

The app uses EAS Build for production builds. Configure your build profiles in `eas.json` and use:

```bash
eas build --platform ios
eas build --platform android
```

## Configuration

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Set up Firebase Storage
5. Add your Firebase config to environment variables

### Gemini API Setup

1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add the key to your environment variables

### RevenueCat Setup

1. Create a RevenueCat account
2. Set up your products and entitlements
3. Add your API keys to environment variables

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Built with ❤️ using React Native and Expo
