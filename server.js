import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { clerkMiddleware } from "@clerk/express";
import { connect } from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";

import { socketEvents } from "./sockets/socketEvents.js";
import { createSocketAuth } from "./sockets/socketAuth.js";
import roomRoutes from "./routes/roomRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import turnRoutes from "./routes/turnRoutes.js";

dotenv.config();
connect(process.env.MONGODB_URI);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

export const allowedOrigins = ["http://localhost:3000"];
if (process.env.RENDER_EXTERNAL_URL) {
  allowedOrigins.push(process.env.RENDER_EXTERNAL_URL);
}

app.use(express.json());
app.use(cors({ origin: allowedOrigins }));
app.use(clerkMiddleware({ authorizedParties: allowedOrigins }));

app.use("/rooms", roomRoutes);
app.use("/user", userRoutes);
app.use("/turn-credentials", turnRoutes);

app.use(express.static(path.join(__dirname, "client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

io.use(
  createSocketAuth({
    secretKey: process.env.CLERK_SECRET_KEY,
    authorizedParties: allowedOrigins,
  })
);

socketEvents(io);

const port = process.env.PORT || 3001;
httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
