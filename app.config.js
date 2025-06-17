// app.config.js
import 'dotenv/config'; 
export default ({ config }) => ({
  ...config,
  expo: {
    ...config.expo,
    name: "MEdico",
    slug: "medico",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/1efd5469-5ab8-4eba-aa46-646fb1cad2d9"
    },
    assetBundlePatterns: ["**/*"],
    platforms: ["ios", "android", "web"],
    plugins: [
      "expo-web-browser",
      "expo-notifications",
      "expo-audio",
      "expo-video"
    ],
    ios: {
      bundleIdentifier: "com.eatad.medico",
      buildNumber: "1.0.0",
      supportsTablet: false
    },
    android: {
      package: "com.eatad.medico",
      versionCode: 2,
      permissions: [
        "VIBRATE",
        "NOTIFICATIONS",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/images/logo.png"
    },
    description: "Daily SCI recovery support & tracking",
    githubUrl: "https://github.com/dancan1995/MEdico",
    runtimeVersion: {
      policy: "appVersion"
    },
    extra: {
      // your EAS projectId (unchanged)
      eas: {
        projectId: "1efd5469-5ab8-4eba-aa46-646fb1cad2d9"
      },
      // this pulls in the secret you set in eas.json
      openAIKey: process.env.OPENAI_API_KEY
    }
  }
});
