# Orbit

Three daily rings — **Body, Mind, Soul** — that close as you check in.

- **Body:** low sodium, no sugar, push-ups + plank, vitamins / medication, skincare, water
- **Mind:** your passion (Music by default) and the habit you're beating
- **Soul:** the five daily prayers, with reminders at local prayer times

Everything is stored on the phone. Prayer times are calculated on the device from your location.

## Built with

Expo SDK 58 (React Native), Expo Router, `adhan` for prayer times, `expo-notifications` for reminders.

```
src/app/            screens (file-based routes)
  onboarding.tsx    first-run questions
  (tabs)/index.tsx  Check-in
  (tabs)/rings.tsx  Today's rings
  (tabs)/progress.tsx
  (tabs)/customize.tsx
  day/[date].tsx    edit a past day
src/lib/            habits, ring math, storage, prayer times, reminders
src/components/     rings, tab bar, shared UI
```

## First iPhone build (one time, from a computer)

You need Node.js 20+ installed. Then:

```bash
git clone https://github.com/efeoroh/orbit.git
cd orbit
npm install
npx eas-cli@latest login            # your Expo account
npx eas-cli@latest init             # links this folder to an Expo project
npx eas-cli@latest build -p ios --profile production --auto-submit
```

`eas init` adds your Expo project ID to `app.json` — commit and push that change
(`git commit -am "Link Expo project" && git push`) so later builds from GitHub work.

The build command asks you to sign in to your Apple developer account, creates the
signing certificate for you, and creates the app in App Store Connect if it isn't there yet. When the build finishes (it runs in Expo's cloud), it's
uploaded to App Store Connect and appears in **TestFlight** on your phone after Apple
processes it.

## Later builds (no computer needed)

1. On expo.dev → Account settings → Access tokens, create a token.
2. In this repo on GitHub → Settings → Secrets and variables → Actions, add it as `EXPO_TOKEN`.
3. GitHub → Actions → **iOS build → TestFlight** → Run workflow.

## Develop

```bash
npm run typecheck
npx expo start
```
