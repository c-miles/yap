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
import { normalizeRequestedHeight } from "../services/videoRequests.js";

export const socketEvents = (io) => {
  const registry = createRoomRegistry();

  // the one leave path, for leaveRoom and disconnect. a socket replaced by a rejoin is
  // already out of the registry, so its disconnect no-ops here
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

  // fromUserId comes from the registry, never the client, so nobody can spoof a sender
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
    // destructuring a missing payload throws inside socket.io's nextTick, which kills the process
    const on = (event, handler) => socket.on(event, (payload) => handler(payload ?? {}));

    socket.on("disconnect", () => handleLeave(socket));
    socket.on("leaveRoom", () => handleLeave(socket, { leaveChannel: true }));

    on("joinRoom", async ({ roomId, username, profilePicture, mediaState }) => {
      const userId = socket.data.userId;
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

    on("sendMessage", async ({ message, username }) => {
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

    on("toggleVideo", async ({ videoEnabled }) => {
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

    on("toggleAudio", async ({ audioEnabled }) => {
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

    on("sendOffer", ({ targetUserId, offer }) => {
      relayToUser(socket, targetUserId, "receiveOffer", { offer });
    });

    on("sendAnswer", ({ targetUserId, answer }) => {
      relayToUser(socket, targetUserId, "receiveAnswer", { answer });
    });

    on("sendIceCandidate", ({ targetUserId, candidate }) => {
      relayToUser(socket, targetUserId, "receiveIceCandidate", { candidate });
    });

    on("sendVideoRequest", ({ targetUserId, maxHeight }) => {
      const height = normalizeRequestedHeight(maxHeight);
      if (height !== null) {
        relayToUser(socket, targetUserId, "receiveVideoRequest", { maxHeight: height });
      }
    });
  });
};
