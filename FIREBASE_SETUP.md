# Firebase Setup Instructions 🔥

## Essential Data Structures Overview

Your Student Discussion Groups app now stores the following data in Firebase:

### 1. **Users Collection** 👤
- **Purpose**: Store user profiles and authentication data
- **Key Fields**: id, email, username (Reddit-style), display name, profile picture
- **Usage**: User management, authentication, profile display

### 2. **Groups Collection** 👥  
- **Purpose**: Store discussion group information
- **Key Fields**: name, description, type (public/private), invite codes, member lists
- **Usage**: Group creation, discovery, membership management

### 3. **Messages Collection** 💬
- **Purpose**: Store all chat messages with context
- **Key Fields**: text, sender info, timestamps, intention flags (venting/advice/urgent)
- **Usage**: Real-time messaging, message history, conversation threads

### 4. **GroupMemberships Collection** 🔗
- **Purpose**: Track user-group relationships
- **Key Fields**: user ID, group ID, join date, role (member/admin/owner)
- **Usage**: Permission management, membership tracking

### 5. **InviteCodes Collection** 🎫
- **Purpose**: Manage private group invitations  
- **Key Fields**: 6-character codes, group references, usage tracking
- **Usage**: Private group access, invite link sharing

---

## 🚀 Firebase Setup Steps

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or "Create a project"
3. Enter your project name: `student-discussion-groups`
4. Enable/disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select your preferred location
5. Click "Done"

### Step 3: Create Web App
1. In Firebase Console, click the web icon `</>`
2. Enter app nickname: `student-groups-web`
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. **Copy the Firebase configuration object** - you'll need this!

### Step 4: Generate Service Account Key
1. Go to Project Settings → Service accounts
2. Click "Generate new private key"
3. Download the JSON file
4. **Keep this file secure** - contains admin credentials

### Step 5: Update Environment Variables
Replace the placeholder values in `.env.local`:

```bash
# Firebase Client Configuration (from Step 3)
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com  
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin Configuration (from Step 4 JSON file)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[paste-your-private-key-here]\n-----END PRIVATE KEY-----\n"
```

### Step 6: Set Firestore Security Rules (Optional - Development)
In Firestore → Rules, use these temporary rules for development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // ⚠️ Development only!
    }
  }
}
```

---

## 🛠️ Running with Firebase

### Option 1: Use Firebase-Enabled Server
Update your package.json scripts:

```json
{
  "scripts": {
    "server:firebase": "node server/firebase-server.js",
    "dev:firebase": "concurrently \"npm run server:firebase\" \"npm run dev\""
  }
}
```

Then run: `npm run dev:firebase`

### Option 2: Update Existing Server
Replace your current `server/server.js` with the Firebase version, or rename:
- `server/server.js` → `server/server-memory.js` (backup)
- `server/firebase-server.js` → `server/server.js`

---

## 📊 Data Flow

1. **User Authentication**: NextAuth → Google OAuth → Firebase Users
2. **Group Creation**: Frontend → Firebase API → Firestore Groups
3. **Real-time Messages**: Socket.io → Firebase Messages → Live Updates
4. **Group Discovery**: Firestore Query → Public Groups List
5. **Private Groups**: Invite Codes → Firebase Lookup → Group Access

---

## ✅ Testing Checklist

After setup, test these features:
- [ ] User login with Google OAuth
- [ ] Create public group
- [ ] Create private group (gets invite code)
- [ ] Join private group with invite code
- [ ] Send messages with different intentions
- [ ] Real-time message updates
- [ ] Group member count updates

---

## 🔒 Security Notes

- **Development**: Test mode allows all reads/writes
- **Production**: Implement proper Firestore security rules
- **Environment**: Keep `.env.local` secure and never commit to Git
- **Service Account**: Protect the Firebase Admin private key

Your app now has persistent data storage with Firebase! 🎉