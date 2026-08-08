// scripts/clean-rooms.js
// One-time cleanup for rooms poisoned by the old isActive lifecycle:
// every participant entry is stale by definition when no server is running,
// so this empties all participant arrays (keeping the rooms and their
// friendly names). Run while the yap server is STOPPED:
//   node scripts/clean-rooms.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Room } from "../models/Room.js";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set");
  process.exit(1);
}

await mongoose.connect(uri);

const before = await Room.countDocuments({ "participants.0": { $exists: true } });
const result = await Room.updateMany({}, { $set: { participants: [] } });

console.log(`Cleared participants from ${result.modifiedCount} room(s) (${before} had stale entries).`);

await mongoose.disconnect();
