# LifeOS — Android build and signing

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
- `android-ci-signing.txt`

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

## Stable CI debug signing

Google Sign-In on Android authorizes the pair `applicationId + certificate SHA-1`. GitHub-hosted runners normally create an ephemeral Android debug keystore, so a freshly generated `app-debug.apk` can receive a different certificate and lose Google Sign-In access.

LifeOS now supports a dedicated **CI/debug keystore** restored only during GitHub Actions. The private keystore is never committed to Git.

Expected CI/debug certificate SHA-1:

```text
DC:84:DA:19:59:01:17:8B:0C:9E:80:2F:0F:F5:02:6F:34:D7:43:4B
```

This SHA-1 must be registered in Firebase for Android app `com.aselec.lifeos` before installing CI APKs signed with this key.

### Required GitHub Actions secrets

Configure all four repository secrets:

- `LIFEOS_CI_KEYSTORE_B64` — complete JKS file encoded as one-line Base64
- `LIFEOS_CI_KEYSTORE_PASSWORD` — keystore password
- `LIFEOS_CI_KEY_ALIAS` — alias of the CI key
- `LIFEOS_CI_KEY_PASSWORD` — private-key password

The workflow has three deliberate behaviors:

1. **All four secrets present:** restores the keystore, verifies its SHA-1 against the expected fingerprint and signs `app-debug.apk` with it.
2. **No CI signing secrets present:** build remains compatible and uses the runner debug key, but `android-ci-signing.txt` reports that stable signing is disabled.
3. **Only some secrets present or wrong SHA-1:** the workflow fails instead of silently emitting an APK with an unexpected signing identity.

After compilation, CI verifies the actual certificate embedded in `app-debug.apk` and stores the result in `android-ci-signing.txt` alongside the artifacts.

### Base64 encoding

Linux/macOS:

```bash
base64 -w 0 lifeos-ci-debug.jks
```

On macOS, where `-w` is unavailable:

```bash
base64 < lifeos-ci-debug.jks | tr -d '\n'
```

PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("lifeos-ci-debug.jks"))
```

Paste the resulting single-line value into `LIFEOS_CI_KEYSTORE_B64`.

## Firebase migration

During the migration there may temporarily be two authorized debug SHA-1 fingerprints:

- the certificate of an already installed historical CI APK;
- the stable CI/debug certificate above.

Keep both registered until the stable-signed APK has been installed and Google Sign-In has been verified. The historical CI SHA-1 can then be removed if no installed build still depends on it.

## Production signing status

The stable CI/debug keystore is **not a production release key** and must never be reused as one.

Phase 3 intentionally does **not** commit a production keystore, passwords, private signing keys or Play credentials.

Therefore:

- `app-debug.apk` can use the dedicated stable CI/debug key when the four secrets exist;
- `app-release-unsigned.apk` remains unsigned;
- `app-release.aab` is a release build artifact but is not configured with a private production signing identity in this repository;
- these release artifacts prove that the release variant compiles, but they are not yet the final Play Store distribution package.

## Production signing — future step

A signed distribution pipeline should only be enabled after the real keystore/signing strategy is chosen. Secrets must live in the CI secret store, never in Git history.

A production pipeline should then:

1. restore the production keystore from an encrypted CI secret;
2. inject alias and passwords from CI secrets;
3. configure the release signing block at build time;
4. build the signed AAB/APK;
5. verify the certificate/signature;
6. retain the signed artifact or publish it through the chosen release channel.

Do not reuse debug/CI signing for production releases.
