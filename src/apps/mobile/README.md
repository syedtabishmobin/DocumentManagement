# Doculyra mobile

The dedicated Doculyra Home iOS and Android client is built from this Flutter/Dart codebase. It shares API, authorization, lifecycle, and language-neutral cryptographic envelope contracts with the React web client; it does not share UI source code.

## Local development

Use Flutter `3.47.2` and Dart `3.13.2` or a compatible version accepted by `pubspec.lock`.

```sh
flutter pub get
flutter analyze
flutter test
flutter run --dart-define=DOCULYRA_API_URL=http://127.0.0.1:3000
```

Android packaging additionally requires a JDK and Android SDK. iOS packaging requires a full Xcode installation, CocoaPods, an Apple developer team, and signing configuration. GitHub Actions builds an unsigned iOS Simulator candidate and a debug Android APK on every pull request/push so source verification does not depend on a contributor's local mobile toolchain.

## Security boundary

The platform secure store holds the device wrapping key. Original bytes are encrypted before upload with an independent document key and authenticated context. Never add real personal documents, production credentials, exported keys, or screenshots containing document content to this repository or its test fixtures.
