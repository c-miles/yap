import mongoose from "mongoose";

const ParticipantSchema = new mongoose.Schema({
  userId: String,
  socketId: String,
  joinedAt: { type: Date, default: Date.now },
  mediaState: {
    video: { type: Boolean, default: true },
    audio: { type: Boolean, default: true }
  },
  profilePicture: String,
  username: String
});

const RoomSchema = new mongoose.Schema({
  roomId: String,
  friendlyName: { type: String, unique: true, required: true },
  participants: [ParticipantSchema],
  maxParticipants: { type: Number, default: 6 },
  createdAt: { type: Date, default: Date.now },
});

export const Room = mongoose.model("Room", RoomSchema);
