# Repository Guidelines

## Project Structure & Modules
- `app/`: Expo Router screens (entry routes like `index.tsx`, nested segments).
- `components/`: Reusable UI (PascalCase files, colocated styles/tests).
- `common/`: Utilities, DB (`common/db`), theme, helpers.
- `models/`: Data access for SQLite entities.
- `hooks/`: Reusable React hooks.
- `assets/`: Static files and `assets/migrations/` (DB migrations).
- `android/`, `ios/`: Native projects created by Expo.
- `tools/`: Dev scripts (migrations, device DB sync).

## Build, Test, and Dev
- Dev server: `yarn start` (Expo, Android/iOS/Web; sets `APP_VARIANT=development`).
- Android: `yarn android` • iOS: `yarn ios` • Web: `yarn web`.
- Prebuild + run Android clean: `yarn prebuild`.
- Local preview APK build + install: `yarn prod` (EAS local, installs newest `build-*.apk`).
- Lint: `yarn lint` (Expo ESLint config).
- Create migration: `yarn make-migration <name>` → `assets/migrations/<ISO>_<name>.js`.
- Sync device DB (Android): `yarn sync-device-db` → writes `device.db`.
- Remove device DB (Android dev appId): `yarn remove-device-db`.
- Tests: run `yarn jest` or `npx jest` (preset: `jest-expo`).

## Coding Style & Naming
- Language: TypeScript (strict). Path alias: `@/*` (see `tsconfig.json`).
- Formatting: Prettier (no semicolons, single quotes, JSX single quotes, ES5 trailing commas).
- Linting: ESLint (expo config; `react/no-unescaped-entities` disabled).
- Indentation: 2 spaces; components in `components/` use PascalCase; route files follow Expo Router naming.
- Migrations: `YYYY-MM-DDTHH:MM_<kebab-name>.js` returning a function `(db) => db.execAsync(...)`.

## Testing Guidelines
- Frameworks: Jest (`jest-expo`) + `@testing-library/react-native`.
- Place tests alongside source: `*.test.ts(x)`.
- Prefer testing behavior via queries; avoid implementation details. Keep DB tests deterministic.

## Commits & Pull Requests
- Commits: concise imperative subject, optional body; group related changes; reference issues (`#123`).
- PRs: clear description, steps to test, Android/iOS impact, screenshots for UI changes, and linked issues.
- Keep PRs focused; run `yarn lint` and (where applicable) tests before submitting.

## Security & Config Tips
- Do not commit secrets or personal data from `device.db`.
- Avoid committing generated APKs/build artifacts.
- Android dev appId used by tools: `com.realmarshal.lumex.dev`.
