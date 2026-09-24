# yap

yap is a six-person video chat app. Each participant connects directly to every
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
   ```

   The Clerk keys come from your Clerk application's API keys page. The
   publishable key is public and appears in both files; the secret key stays in
   the root `.env` only. In development the client talks to the server on port
   3001; in production it uses its own origin, since the server serves the built
   client. `REACT_APP_API_BASE_URL` overrides that and should stay unset in
   production.

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

Creating a room: from the lounge, choose "Start a room." You get a room name
such as `brave-blue-tiger` and a green room to check your camera and mic before
joining. Share that name, or the room's URL, with the people you want to invite.
Shared room links preview as "Join brave-blue-tiger" in chat apps.

Joining a room: choose "Join by name" and enter the room name, or open a room
link directly. If you're signed out, the link opens sign-in and then brings you
to that room's green room. A room holds up to six people; further joins are
turned away.

During a call you can toggle your camera and microphone, open the chat panel to
message everyone in the room, and leave to return to the lounge. Each remote
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

To keep that manageable, each browser sizes its video per viewer: quality steps
down as the room grows, never exceeds the viewer's tile, pauses while the
viewer's tab is hidden, and backs off when the CPU can't keep up. Add `?stats`
to a room URL to see what's being sent.

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
the same origin as the server. When serving from a custom domain, set `APP_URL`
to it (e.g. `https://yap.anomaly-labs.com`) so the server accepts requests from
that origin.
