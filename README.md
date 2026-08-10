# Yap

Yap is a six-person video chat app. Each participant connects directly to every
other participant over WebRTC, so audio and video flow peer-to-peer rather than
through a central media server, with a lightweight Node server handling only
sign-in, signaling, and chat history. Rooms are created and shared with
human-readable names like `brave-blue-tiger`.

## Features

- Up to six people per room over a WebRTC mesh (direct peer-to-peer connections)
- Real-time text chat alongside the call
- Per-participant camera and microphone toggles with connection-state indicators
- Automatic reconnection and ICE recovery when a network blip drops a peer
- Authentication and user accounts via Clerk
- Human-readable room names, shareable by link

## Tech stack

- Frontend: React 18, TypeScript, Tailwind CSS, Socket.IO client
- Backend: Node.js, Express (ES modules), Socket.IO, Mongoose
- Data: MongoDB
- Auth: Clerk
- Media: WebRTC for audio/video, Cloudflare TURN for NAT traversal

## Prerequisites

- Node.js 20.9 or newer
- A running MongoDB instance (local, or a MongoDB Atlas cluster)
- A Clerk application (the free development instance is enough to run locally)

## Setup

1. Clone and install dependencies for both the server and the client:

   ```bash
   git clone <repository-url>
   cd yap
   npm install
   cd client && npm install && cd ..
   ```

2. Create the two environment files. The server reads the root `.env`; the
   client reads `client/.env`. Templates are provided as `.env.example` in each
   location.

   Root `.env`:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/yap
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Optional. Without these, connections fall back to STUN only and will fail
   # between some networks (mobile, strict NATs).
   CLOUDFLARE_TURN_KEY_ID=...
   CLOUDFLARE_TURN_API_TOKEN=...
   ```

   `client/.env`:

   ```env
   REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_...
   REACT_APP_API_BASE_URL=http://localhost:3001
   ```

   The Clerk keys come from your Clerk application's API keys page. The
   publishable key is public and appears in both files; the secret key stays in
   the root `.env` only. `REACT_APP_API_BASE_URL` points the client at the local
   server in development and should be left unset in production, where the server
   serves the built client from the same origin.

3. Start MongoDB if you are running it locally, then start the server and client
   in separate terminals:

   ```bash
   npm start            # server on http://localhost:3001
   ```

   ```bash
   cd client && npm start   # client on http://localhost:3000
   ```

Open `http://localhost:3000` and sign in to begin.

## Usage

Creating a room: from the dashboard, choose "Start a room." You are taken
straight into the call and given a room name such as `brave-blue-tiger`. Share
that name, or the room's URL, with the people you want to invite.

Joining a room: choose "Join by code" and enter the room name, or open a room
link directly. After signing in, you land in the call. A room holds up to six
people; further joins are turned away.

During a call you can toggle your camera and microphone, open the chat panel to
message everyone in the room, and leave to return to the dashboard. Each remote
tile shows that participant's connection state, and dropped connections attempt
to recover on their own.

## How it works

When you join a room, the server records your presence and tells the existing
participants. Each of them opens a direct WebRTC connection to you, exchanging
offers, answers, and ICE candidates through the Socket.IO signaling server.
Once connected, audio and video travel directly between browsers. Chat messages
and presence still go through the server.

Because every pair of participants maintains its own connection, a six-person
room is a mesh of connections and each browser encodes its video for every peer.
This keeps the infrastructure simple and latency low, at the cost of client
bandwidth and CPU, which is why rooms are capped at six.

## Scripts

Server (root directory):

```bash
npm start     # start the server
npm test      # run server tests
```

Client (`client` directory):

```bash
npm start     # start the development server
npm run build # production build
npm test      # run tests
```

## Deployment

The server serves the built client, so a deployment is a single Node service.
Build the client with `cd client && npm run build`, then run `npm start` from the
root. Set `MONGODB_URI`, the Clerk keys, and the Cloudflare TURN keys in the
host's environment, and leave `REACT_APP_API_BASE_URL` unset so the client uses
the same origin as the server.
