// sockets/socketEvents.js
import { Message } from "../models/Message.js";
import { Room } from "../models/Room.js";
import { createRoomRegistry } from "./roomRegistry.js";
import {
  upsertParticipant,
  removeParticipant,
  setMediaState,
  listOtherParticipants,
  resolveJoinMediaState,
} from "../services/roomParticipants.js";

export const socketEvents = (io) => {
  const registry = createRoomRegistry();

  // The single leave path: used by leaveRoom, disconnect, and stale-socket
  // replacement. Removes the participant from the DB, tells the room, and
  // clears the registry. Participants are always physically removed — the
  // old isActive half-state left dead entries that eventually made rooms
  // reject every join.
  async function handleLeave(socket, { leaveChannel = false } = {}) {
    const left = registry.leave(socket.id);
    if (!left) {
      return;
    }
    const { roomId, userId } = left;

    try {
      await removeParticipant(Room, roomId, userId, socket.id);
    } catch (error) {
      console.error("Error removing participant:", error);
    }

    socket.to(roomId).emit("userLeft", { userId });
    if (leaveChannel) {
      socket.leave(roomId);
    }
  }

  // Relays an offer/answer/candidate to one user in the sender's room.
  // fromUserId is stamped from the registry — the client-supplied value is
  // ignored, so a client cannot impersonate another user in signaling.
  function relayToUser(socket, targetUserId, event, payload) {
    const roomId = registry.getRoom(socket.id);
    const fromUserId = registry.getUser(socket.id);
    if (!roomId || !fromUserId) {
      return;
    }
    const targetSocketId = registry.getSocketId(roomId, targetUserId);
    if (!targetSocketId) {
      return;
    }
    io.to(targetSocketId).emit(event, { ...payload, fromUserId });
  }

  io.on("connection", (socket) => {
    socket.on("disconnect", () => handleLeave(socket));
    socket.on("leaveRoom", () => handleLeave(socket, { leaveChannel: true }));

    socket.on("joinRoom", async ({ roomId, username, profilePicture, mediaState }) => {
      const userId = socket.data.userId;
      // pre-join mic/cam state from the green room; resolveJoinMediaState normalizes/guards absent or malformed input.
      const joinedMediaState = resolveJoinMediaState(mediaState);
      try {
        const participant = {
          userId,
          socketId: socket.id,
          joinedAt: new Date(),
          username,
          profilePicture,
          mediaState: joinedMediaState,
        };

        const result = await upsertParticipant(Room, roomId, participant);
        if (result === "not-found") {
          socket.emit("error", { message: "Room not found" });
          return;
        }
        if (result === "full") {
          socket.emit("error", { message: "Room is full" });
          return;
        }

        const { replacedSocketId } = registry.join(socket.id, roomId, userId);
        if (replacedSocketId) {
          // Same user from a new socket (refresh/second tab): drop the old one.
          const staleSocket = io.sockets.sockets.get(replacedSocketId);
          staleSocket?.disconnect(true);
        }

        socket.join(roomId);

        const others = await listOtherParticipants(Room, roomId, userId);
        socket.emit("currentParticipants", others);

        socket.to(roomId).emit("userJoined", {
          userId,
          username,
          profilePicture,
          mediaState: joinedMediaState,
        });

        const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
        socket.emit("roomMessages", messages);
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("getRoomMessages", async () => {
      const roomId = registry.getRoom(socket.id);
      if (!roomId) {
        return;
      }
      try {
        const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
        socket.emit("roomMessages", messages);
      } catch (error) {
        console.error("Error fetching room messages:", error);
      }
    });

    socket.on("sendMessage", async ({ message, username }) => {
      const roomId = registry.getRoom(socket.id);
      if (!roomId) {
        return;
      }
      try {
        const newMessage = new Message({ message, roomId, username });
        await newMessage.save();
        io.to(roomId).emit("receiveMessage", newMessage);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    socket.on("toggleVideo", async ({ videoEnabled }) => {
      const roomId = registry.getRoom(socket.id);
      const userId = registry.getUser(socket.id);
      if (!roomId || !userId) {
        return;
      }
      try {
        await setMediaState(Room, roomId, userId, "video", videoEnabled);
        socket.to(roomId).emit("participantVideoToggled", { userId, videoEnabled });
      } catch (error) {
        console.error("Error toggling video:", error);
      }
    });

    socket.on("toggleAudio", async ({ audioEnabled }) => {
      const roomId = registry.getRoom(socket.id);
      const userId = registry.getUser(socket.id);
      if (!roomId || !userId) {
        return;
      }
      try {
        await setMediaState(Room, roomId, userId, "audio", audioEnabled);
        socket.to(roomId).emit("participantAudioToggled", { userId, audioEnabled });
      } catch (error) {
        console.error("Error toggling audio:", error);
      }
    });

    socket.on("sendOffer", ({ targetUserId, offer }) => {
      relayToUser(socket, targetUserId, "receiveOffer", { offer });
    });

    socket.on("sendAnswer", ({ targetUserId, answer }) => {
      relayToUser(socket, targetUserId, "receiveAnswer", { answer });
    });

    socket.on("sendIceCandidate", ({ targetUserId, candidate }) => {
      relayToUser(socket, targetUserId, "receiveIceCandidate", { candidate });
    });
  });
};
