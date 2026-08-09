# Yap 🎥

A modern 6-person video chat application built with WebRTC mesh networking. Connect face-to-face with up to 5 other people in high-quality peer-to-peer video calls with real-time messaging.

![Video Chat Demo](https://img.shields.io/badge/WebRTC-Powered-blue)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-ES6_Modules-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)

## ✨ Features

- **6-Person Video Chat**: WebRTC mesh networking for direct peer-to-peer connections
- **Real-time Messaging**: Integrated chat alongside video calls
- **Modern Dark UI**: "Slate Studio" design system with Tailwind CSS
- **Responsive Layout**: Dynamic video grid that adapts from 1-6 participants  
- **Audio/Video Controls**: Toggle camera and microphone with visual feedback
- **User Authentication**: Secure Clerk integration
- **Human-Readable Room Names**: Auto-generated room names (e.g., "brave-blue-tiger")
- **Mobile Responsive**: Works across desktop, tablet, and mobile devices

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript, Tailwind CSS, Clerk, Socket.IO Client
- **Backend**: Node.js + Express (ES6 modules), MongoDB + Mongoose, Socket.IO
- **Real-time**: WebRTC for video/audio, Socket.IO for signaling
- **Database**: MongoDB with Mongoose ODM
- **Deployment**: Render.com ready

### WebRTC Implementation
- **Mesh Topology**: Each user connects directly to every other user (P2P)
- **Signaling Server**: Socket.IO handles offer/answer/ICE candidate exchange
- **Media Management**: Custom hooks for stream handling and peer connections
- **Graceful Degradation**: Fallback UI when video is disabled

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud instance)
- **npm** or **yarn**

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd yap
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

3. **Environment Variables**
   
   Create a `.env` file in the root directory (see `.env.example`):
   ```env
   # MongoDB Connection
   MONGODB_URI=mongodb://127.0.0.1:27017/yap

   # Cloudflare TURN credentials (optional; STUN-only without them)
   CLOUDFLARE_TURN_KEY_ID=your-turn-key-id
   CLOUDFLARE_TURN_API_TOKEN=your-turn-api-token
   ```

   And a `client/.env` (see `client/.env.example`):
   ```env
   # Clerk publishable key (required for authentication)
   REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your-key
   ```

4. **Database Setup**
   
   **Local MongoDB:**
   ```bash
   # Install MongoDB Community Edition
   # macOS (with Homebrew)
   brew install mongodb-community
   brew services start mongodb-community
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install -y mongodb
   sudo systemctl start mongod
   
   # Windows
   # Download and install from: https://www.mongodb.com/try/download/community
   ```
   
   **Or use MongoDB Atlas (Cloud):**
   - Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a cluster and get connection string
   - Update `MONGODB_URI` in `.env` with your Atlas connection string

### Running the Application

1. **Start MongoDB** (if using local installation)
   ```bash
   # macOS/Linux
   mongod
   
   # Or if installed via Homebrew
   brew services start mongodb-community
   ```

2. **Start the backend server**
   ```bash
   npm start
   ```
   Server will run on `http://localhost:3001`

3. **Start the frontend** (in a new terminal)
   ```bash
   cd client
   npm start
   ```
   Client will run on `http://localhost:3000`

4. **Access the application**
   - Open `http://localhost:3000` in your browser
   - Create or join a room to start video chatting!

## 🛠️ Development

### Available Scripts

**Backend (root directory):**
```bash
npm start          # Start the Node.js server
```

**Frontend (client directory):**
```bash
npm start          # Start development server
npm run build      # Production build
npm test           # Run tests in watch mode
```

### Project Structure

```
yap/
├── server.js              # Main server entry point
├── models/                # MongoDB schemas
│   ├── User.js
│   ├── Room.js
│   └── Message.js
├── routes/                # Express API routes
│   ├── roomRoutes.js
│   └── userRoutes.js
├── sockets/               # Socket.IO event handlers
│   └── socketEvents.js
└── client/                # React frontend
    ├── src/
    │   ├── components/    # React components
    │   │   ├── atoms/     # Base components
    │   │   ├── molecules/ # Composite components
    │   │   └── Room/      # Video chat components
    │   ├── services/      # Socket.IO client
    │   ├── types/         # TypeScript definitions
    │   └── hooks/         # Custom React hooks
    └── public/
```

### Key Components

- **Room.tsx**: Main video chat interface with WebRTC implementation
- **VideoGrid.tsx**: Dynamic layout system for 1-6 participants
- **PeerConnectionManager.ts**: Manages multiple RTCPeerConnection instances
- **socketEvents.js**: WebRTC signaling server and room management
- **useMediaStream.ts**: Custom hook for camera/microphone control

## 🔧 Configuration

### Clerk Setup (Required for Authentication)

Authentication is handled through [Clerk](https://clerk.com):

1. Create a Clerk account and application (social sign-in works out of the box in development)
2. Copy the application's **Publishable Key** into `client/.env` as `REACT_APP_CLERK_PUBLISHABLE_KEY`
3. Keep the **Secret Key** in the root `.env` as `CLERK_SECRET_KEY` (used for server-side verification)

### MongoDB Configuration

The application expects MongoDB to be running on the default port (27017). You can customize this by updating the `MONGODB_URI` environment variable.

## 🚢 Deployment

This application can be deployed to any hosting platform that supports Node.js applications (Heroku, Railway, DigitalOcean, AWS, Render, etc.).

**General deployment requirements:**
- Node.js runtime environment
- MongoDB database (local or cloud)
- Environment variables configured
- Static file serving for the React frontend

**Build commands:**
- Backend: `npm install` → `npm start`
- Frontend: `cd client && npm install && npm run build`
- Frontend build output: `client/build/`

The frontend build uses `CI=false` flag to treat warnings as warnings rather than errors.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related Documentation

- [WebRTC Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Documentation](https://react.dev/)

---

**Built with ❤️ using WebRTC, React, and Node.js**