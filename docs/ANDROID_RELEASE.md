# LifeOS — Android release artifacts

## What CI builds

`.github/workflows/android-ci.yml` validates the Android project on pull requests and on `main` using:

- Node.js 22
- JDK 21
- Android SDK 36 / Build Tools 36.0.0
- Vite production build
- `npx cap sync android`
- `assembleDebug`
- `assembleRelease`
- `bundleRelease`

The workflow validates and uploads these artifacts for 14 days:

- `app-debug.apk`
- `app-release-unsigned.apk`
- `app-release.aab`

## Versioning

`android/app/build.gradle` reads:

- `LIFEOS_VERSION_CODE`
- `LIFEOS_VERSION_NAME`

CI assigns the GitHub Actions run number as `versionCode` and a traceable `0.3.0-ci.<run>` value as `versionName`.

For a local build, for example:

```bash
export LIFEOS_VERSION_CODE=3
export LIFEOS_VERSION_NAME=0.3.0
npm ci
npm run build
npx cap sync android
cd android
./gradlew assembleRelease bundleRelease
```

## Signing status

Phase 3 intentionally does **not** commit a keystore, passwords, private signing keys or Play credentials.

Therefore:

- the release APK produced by CI is unsigned;
- the AAB is a release build artifact but is not configured with a private production signing identity in this repository;
- these artifacts prove that the release variant compiles, but they are not yet the final Play Store distribution package.

## Production signing — future step

A signed distribution pipeline should only be enabled after the real keystore/signing strategy is chosen. Secrets must live in the CI secret store, never in Git history.

A production pipeline should then:

1. restore the keystore from an encrypted CI secret;
2. inject alias and passwords from CI secrets;
3. configure the release signing block at build time;
4. build the signed AAB/APK;
5. verify the certificate/signature;
6. retain the signed artifact or publish it through the chosen release channel.

Do not reuse debug signing for production releases.

## Current Phase 3 acceptance

The Android portion of Phase 3 is accepted when CI successfully creates all three expected artifacts and uploads them without exposing signing material.
