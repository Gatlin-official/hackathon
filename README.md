# Student Discussion Groups 💬

A modern real-time web application for students to create discussion groups, engage in meaningful conversations, and connect with peers through secure Google OAuth authentication.

![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7.5-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## ✨ Features

### 🔐 **Authentication & Users**
- **Google Sign-In**: Secure OAuth authentication
- **Random Usernames**: Reddit-style unique usernames (e.g., "SwiftTiger342")
- **Anonymous Identity**: No email addresses visible to other users

### 💬 **Smart Messaging**
- **Message Intentions**: Flag messages with context
  - 🚨 **Help Needed Fast** (Red flag for urgent help)
  - 💡 **Need Advice** (Yellow flag for seeking guidance) 
  - 💭 **Just Venting** (Purple flag for emotional support)
- **Real-time Chat**: Instant message delivery with Socket.io
- **Visual Indicators**: Color-coded intention badges on messages

### 👥 **Group Management**
- **Public Groups**: 🌍 Open for anyone to join
- **Private Groups**: 🔒 Invite-only with secure codes
- **Invite System**: 6-character codes and shareable links
- **Member Count**: Live participant tracking

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works on desktop and mobile
- **Tailwind CSS**: Clean, modern interface
- **Real-time Updates**: Live group creation and messaging
- **Copy-to-Clipboard**: Easy invite sharing

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Express.js with Socket.io
- **Authentication**: NextAuth.js with Google OAuth
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io for live messaging
- **Development**: ESLint, PostCSS, Autoprefixer

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **Google OAuth Credentials** - From [Google Cloud Console](https://console.cloud.google.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd roshan
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create `.env.local` in the root directory:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Generate NextAuth secret**:
   ```bash
   openssl rand -base64 32
   # Or use: wW7BIGqFfMFYbYd8p0UiMRLRwR5APdCIw243y8andoc=
   ```

5. **Set up Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create/select project → APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Add redirect URI: `http://localhost:3000/api/auth/callback/google`

### Running the Application

**Option 1: Full Stack (Recommended)**
```bash
npm run dev:full
```

**Option 2: Manual (Two terminals)**
```bash
# Terminal 1 - Socket.io Server
npm run server

# Terminal 2 - Next.js Client  
npm run dev
```

**Access the app**: `http://localhost:3000`

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/    # NextAuth routes
│   │   ├── globals.css                # Global styles
│   │   ├── layout.tsx                 # App layout
│   │   └── page.tsx                   # Home page
│   ├── components/
│   │   ├── AuthProvider.tsx           # Auth context
│   │   ├── CreateGroup.tsx            # Group creation
│   │   ├── GroupChat.tsx              # Chat interface
│   │   ├── GroupList.tsx              # Groups sidebar
│   │   ├── InviteDetails.tsx          # Invite sharing
│   │   └── JoinGroup.tsx              # Join private groups
│   └── utils/
│       └── username.ts                # Random username generator
├── server/
│   └── server.js                      # Socket.io server
├── .vscode/
│   └── tasks.json                     # VS Code tasks
└── package.json                       # Dependencies & scripts
```

## 🎯 How to Use

1. **Sign In**: Click "Sign in with Google"
2. **Create Groups**: 
   - Click "+ New Group"
   - Choose Public (anyone can join) or Private (invite-only)
   - For private groups, copy the invite code/link
3. **Join Groups**: 
   - Public: Click any group in the list
   - Private: Click "Join Private" and enter invite code
4. **Send Messages**:
   - Select message intention (optional)
   - Type message and press Send
   - Messages appear with intention flags

## 🧪 Testing Real-time Features

1. Open multiple browser tabs/windows
2. Sign in with Google in each
3. Create groups and observe live updates
4. Send messages and watch real-time delivery
5. Test private group invites across tabs

## 🐛 Troubleshooting

### PowerShell Execution Policy (Windows)
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use
```bash
npx kill-port 3000
npx kill-port 3001
```

### Missing Dependencies
```bash
npm install autoprefixer postcss tailwindcss
```

## 🚧 Development Notes

- **In-memory storage**: Groups/messages stored in server memory (restart clears data)
- **Single server**: All users connect to same Socket.io server
- **No database**: Ready for MongoDB/PostgreSQL integration
- **Production ready**: Needs environment-specific configurations

## 🔮 Future Enhancements

- [ ] **Database Integration**: Persistent data storage
- [ ] **File Sharing**: Upload images and documents
- [ ] **Push Notifications**: Browser/mobile notifications
- [ ] **User Profiles**: Customizable avatars and bios
- [ ] **Group Moderation**: Admin controls and content filtering
- [ ] **Message History**: Searchable chat history
- [ ] **Voice/Video**: WebRTC integration for calls
- [ ] **Mobile App**: React Native companion app

## 📄 License

MIT License - Feel free to use this project for learning and development.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Made with ❤️ for students, by students**