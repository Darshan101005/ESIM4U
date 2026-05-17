# eSIM4U Mobile App

Simple React Native mobile app using Expo and TypeScript.

## Folder Structure

```
mobile/
├── app/              # Main app files
├── assets/           # Images, icons, fonts
├── components/       # Reusable UI components
├── constants/        # Constants and configuration
├── hooks/            # Custom React hooks
├── screens/          # Screen components
├── services/         # API and external services
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── App.tsx           # Root component
├── index.js          # Entry point
├── app.json          # Expo configuration
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript configuration
└── babel.config.js   # Babel configuration
```

## Scripts

```bash
# Start development server
pnpm dev

# Run on iOS
pnpm ios

# Run on Android
pnpm android

# Run on Web
pnpm web

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## Development

All source files are TypeScript (.tsx, .ts). Changes will hot reload automatically with Expo.

### Key Features

- ✅ Expo for easy development and deployment
- ✅ TypeScript for type safety
- ✅ Modular folder structure
- ✅ Path aliases for clean imports
- ✅ ESLint for code quality
- ✅ Ready for iOS, Android, and Web

## Getting Started

1. Install dependencies: `pnpm install`
2. Start dev server: `pnpm dev`
3. Choose platform (iOS/Android/Web)
4. Build your features!

---

See parent README.md for monorepo setup.
