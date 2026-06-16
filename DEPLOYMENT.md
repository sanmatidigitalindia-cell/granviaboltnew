# Granvia Deployment

## Local URLs

Run the Vite app:

```powershell
npm install
npm run dev
```

Open these direct portal URLs:

```text
Landing page: http://localhost:5173/
Admin panel: http://localhost:5173/admin
Guard app:   http://localhost:5173/guard
```

If Vite uses another port, keep the same paths. Example:

```text
Landing page: http://127.0.0.1:5174/
Admin panel: http://127.0.0.1:5174/admin
Guard app:   http://127.0.0.1:5174/guard
```

## Netlify

Use these settings:

```text
Build command: npm run build
Publish directory: dist
```

After deployment, use:

```text
Landing page: https://your-site.netlify.app/
Admin panel: https://your-site.netlify.app/admin
Guard app:   https://your-site.netlify.app/guard
```

The `public/_redirects` file is included so direct page refreshes work on Netlify.

## Expo APK For Guard App

This project is a Vite React web app. Expo builds Android apps from React Native code, so the fastest APK path is an Expo WebView wrapper that loads the Netlify guard URL.

Create the Expo wrapper:

```powershell
npx create-expo-app granvia-guard-apk --template blank-typescript
cd granvia-guard-apk
npx expo install react-native-webview
```

Replace `App.tsx` in the Expo project:

```tsx
import { SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const GUARD_URL = 'https://your-site.netlify.app/guard';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: GUARD_URL }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
});
```

Create or update `eas.json` in the Expo project:

```json
{
  "cli": {
    "version": ">= 13.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

Build the APK:

```powershell
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```
