# Firebase Setup Guide

You **must** configure Firebase in the Google Cloud Console for the app to work. I cannot do this for you as it requires access to your personal Google account.

Follow these exact steps:

## 1. Create Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com/).
2. Click **"Add project"**.
3. Name it **"Sales Ambassador Portal"**.
4. Disable Google Analytics (for simplicity) and click **"Create project"**.

## 2. Enable Authentication
1. Click **"Build"** > **"Authentication"** in the left sidebar.
2. Click **"Get started"**.
3. Select **"Email/Password"**. Enable the switch and click **Save**.
4. Click **"Add new provider"**, select **"Google"**.
5. Enable the switch.
6. Set the "Project support email" to your email.
7. Click **Save**.

## 3. Create Database (Firestore)
1. Click **"Build"** > **"Firestore Database"**.
2. Click **"Create database"**.
3. Location: Select a region close to you (e.g., `nam5 (us-central)`).
4. Rules: Select **"Start in test mode"** (easier for development).
5. Click **"Create"**.

## 4. Enable Storage
1. Click **"Build"** > **"Storage"**.
2. Click **"Get started"**.
3. Choose **"Start in test mode"**.
4. Click **"Done"**.

## 5. Get API Keys
1. Click the **Gear Icon (Settings)** next to "Project Overview" in the top left.
2. Select **"Project settings"**.
3. Scroll down to "Your apps".
4. Click the **Web icon** (`</>`).
5. Nickname: "Portal App". Click **"Register app"**.
6. **COPY** the `firebaseConfig` object values.

## 6. Update Local Config
1. Open the `.env` file in your project folder.
2. Replace the values with the ones you copied:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=sales-ambassador...
VITE_FIREBASE_PROJECT_ID=sales-ambassador...
VITE_FIREBASE_STORAGE_BUCKET=sales-ambassador...
VITE_FIREBASE_MESSAGING_SENDER_ID=1234...
VITE_FIREBASE_APP_ID=1:1234...
```

3. **Restart the app**: Run `npm run dev` again (or I will likely do it for you eventually).
