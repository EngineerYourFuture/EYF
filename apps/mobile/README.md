# @eyf/mobile

EYF companion mobile app — daily challenge, flashcards (SRS), streak. Built with Expo + React Native + expo-router.

## Run

```bash
pnpm --filter @eyf/mobile install
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... pnpm --filter @eyf/mobile start
```

Press `i` for iOS sim, `a` for Android emulator, or scan the QR with Expo Go.

## Configure API base

By default the app talks to `https://api.eyf.in/v1`. Override locally via `app.json` `extra.apiUrl` or env:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.x:4000/v1 pnpm --filter @eyf/mobile start
```

## Out of scope (intentional)

The mobile app is a **focused companion**, not the whole web app. Things you do on the phone: keep the streak alive, drill flashcards, glance at the daily. Things you do on web: solve problems (Monaco), mock interviews, resume builder, projects, billing.
