import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { readFile } from "fs/promises";
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
import { buildAllowedOrigins } from "./services/allowedOrigins.js";
import { withRoomPreview } from "./services/roomPreview.js";

dotenv.config();
connect(process.env.MONGODB_URI);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = buildAllowedOrigins(process.env);

app.use(express.json());
app.use(cors({ origin: allowedOrigins }));
app.use(clerkMiddleware({ authorizedParties: allowedOrigins }));

app.use("/rooms", roomRoutes);
app.use("/user", userRoutes);
app.use("/turn-credentials", turnRoutes);

const indexHtmlPath = path.join(__dirname, "client/build", "index.html");
let indexHtml;

app.use(express.static(path.join(__dirname, "client/build")));

// a missing file is a real 404, not the app's html (link previews choke on that)
app.get(/\.[a-z0-9]+$/i, (req, res) => res.sendStatus(404));

// chat apps don't run JS, so room links get their preview tags from the server
app.get("/room/:room", async (req, res, next) => {
  try {
    indexHtml ??= await readFile(indexHtmlPath, "utf8");
    res.send(withRoomPreview(indexHtml, req.params.room));
  } catch (error) {
    next(error);
  }
});

app.get("*", (req, res) => {
  res.sendFile(indexHtmlPath);
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
