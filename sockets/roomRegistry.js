// In-memory registry of who is connected where. Socket.IO server state is
// per-process, so this intentionally lives in memory alongside it: if the
// process restarts, sockets drop and clients re-join, repopulating both.
export function createRoomRegistry() {
  const socketToRoom = new Map();
  const socketToUser = new Map();
  const roomUserToSocket = new Map(); // "roomId:userId" -> socketId

  const key = (roomId, userId) => `${roomId}:${userId}`;

  function join(socketId, roomId, userId) {
    const existingSocketId = roomUserToSocket.get(key(roomId, userId));
    const replacedSocketId =
      existingSocketId && existingSocketId !== socketId ? existingSocketId : null;

    if (replacedSocketId) {
      socketToRoom.delete(replacedSocketId);
      socketToUser.delete(replacedSocketId);
    }

    socketToRoom.set(socketId, roomId);
    socketToUser.set(socketId, userId);
    roomUserToSocket.set(key(roomId, userId), socketId);

    return { replacedSocketId };
  }

  function leave(socketId) {
    const roomId = socketToRoom.get(socketId);
    const userId = socketToUser.get(socketId);
    if (roomId === undefined || userId === undefined) {
      return null;
    }

    socketToRoom.delete(socketId);
    socketToUser.delete(socketId);
    // Only clear the room mapping if it still points at this socket —
    // a newer socket for the same user must not lose its entry.
    if (roomUserToSocket.get(key(roomId, userId)) === socketId) {
      roomUserToSocket.delete(key(roomId, userId));
    }

    return { roomId, userId };
  }

  return {
    join,
    leave,
    getRoom: (socketId) => socketToRoom.get(socketId),
    getUser: (socketId) => socketToUser.get(socketId),
    getSocketId: (roomId, userId) => roomUserToSocket.get(key(roomId, userId)),
  };
}
