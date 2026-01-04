# Sales Ambassador Portal

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Firebase Configuration**
   - Create a project in the Firebase Console.
   - Enable Authentication (Email/Password, Google).
   - Enable Firestore Database.
   - Enable Storage.
   - Copy your web app configuration keys.
   - Update `src/firebase.js` with your keys OR (better) create a `.env` file in the root:
     ```
     VITE_FIREBASE_API_KEY=your_key
     VITE_FIREBASE_AUTH_DOMAIN=your_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

## Project Structure

- `src/contexts/AuthContext.jsx`: Provides authentication state (`currentUser`, `login`, `signup`, `logout`) via `useAuth()`.
- `src/services/firestoreService.js`: Contains functions to interact with Firestore collections:
  - `users`
  - `shifts`
  - `leads`
  - `sales`
- `src/services/storageService.js`: Contains `uploadTollReceipt` to upload images to Firebase Storage.

## Usage

### Authentication
```javascript
import { useAuth } from './contexts/AuthContext';

const { login, currentUser } = useAuth();
```

### Database
```javascript
import { addShift } from './services/firestoreService';

await addShift({
  userId: currentUser.uid,
  date: new Date(),
  hoursWorked: 8,
  // ...
});
```
# Green-truth-CRM
