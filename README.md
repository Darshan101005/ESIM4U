# ESIM4U

A cross-platform eSIM application built with **Turborepo**, **pnpm**, **Next.js**, and **React Native + Expo**.

## 📁 Project Structure

```
esim4u/
├── packages/
│   ├── web/              # Next.js web application
│   │   ├── app/          # App Router (Next.js 14)
│   │   ├── components/   # React components
│   │   ├── styles/       # Global styles & Tailwind
│   │   └── ...
│   ├── mobile/           # React Native + Expo mobile app
│   │   ├── App.tsx       # Main app component
│   │   ├── screens/      # Screen components
│   │   ├── components/   # Reusable components
│   │   └── ...
│   └── shared/           # Shared utilities & types
├── turbo.json            # Turborepo configuration
├── package.json          # Root package with workspaces
└── .npmrc                # pnpm configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 9.0.0+

### Installation

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm

# Install dependencies for all packages
pnpm install
```

### Development

Run development servers for all packages:

```bash
# Start all dev servers in parallel
pnpm dev

# Or run specific package
pnpm --filter @esim4u/web dev
pnpm --filter @esim4u/mobile dev
```

### Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @esim4u/web build
```

### Linting

```bash
# Lint all packages
pnpm lint

# Type check all packages
pnpm type-check
```

## 📦 Packages

### `@esim4u/web`
Next.js 14 web application with:
- TypeScript
- Tailwind CSS
- shadcn/ui components
- App Router

**Commands:**
```bash
pnpm --filter @esim4u/web dev      # Start development server
pnpm --filter @esim4u/web build    # Build for production
```

### `@esim4u/mobile`
React Native + Expo mobile application with:
- TypeScript
- Expo for iOS/Android/Web
- React Native components

**Commands:**
```bash
pnpm --filter @esim4u/mobile dev        # Start Expo
pnpm --filter @esim4u/mobile ios        # Run on iOS
pnpm --filter @esim4u/mobile android    # Run on Android
```

### `@esim4u/shared`
Shared types and utilities:
- TypeScript types
- Constants
- Utility functions

## 🔧 Turborepo

This monorepo uses **Turborepo** for:
- Parallel task execution
- Caching for faster builds
- Dependency management across packages

Key commands:
```bash
pnpm turbo run dev       # Run dev in all packages
pnpm turbo run build     # Build all packages
pnpm turbo clean         # Clean cache
```