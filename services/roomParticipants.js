export async function upsertParticipant(RoomModel, roomId, participant) {
  // Same user already in the room (refresh/second tab): replace their entry.
  const rejoined = await RoomModel.findOneAndUpdate(
    { _id: roomId, "participants.userId": participant.userId },
    { $set: { "participants.$": participant } },
    { new: true }
  );
  if (rejoined) {
    return "rejoined";
  }

  // push only if there's a seat. excluding this user stops a concurrent join
  // that just added them from being duplicated
  const joined = await RoomModel.findOneAndUpdate(
    {
      _id: roomId,
      "participants.userId": { $ne: participant.userId },
      $expr: { $lt: [{ $size: "$participants" }, "$maxParticipants"] },
    },
    { $push: { participants: participant } },
    { new: true }
  );
  if (joined) {
    return "joined";
  }

  // double miss: this user's other join just landed (the rejoin retry finds it),
  // or the room is full or gone
  const retried = await RoomModel.findOneAndUpdate(
    { _id: roomId, "participants.userId": participant.userId },
    { $set: { "participants.$": participant } },
    { new: true }
  );
  if (retried) {
    return "rejoined";
  }

  const room = await RoomModel.findById(roomId);
  return room ? "full" : "not-found";
}

export async function removeParticipant(RoomModel, roomId, userId, socketId) {
  await RoomModel.updateOne(
    { _id: roomId },
    { $pull: { participants: { userId, socketId } } }
  );
}

export async function setMediaState(RoomModel, roomId, userId, kind, enabled) {
  if (kind !== "video" && kind !== "audio") {
    throw new Error(`Unknown media kind: ${kind}`);
  }
  await RoomModel.updateOne(
    { _id: roomId, "participants.userId": userId },
    { $set: { [`participants.$.mediaState.${kind}`]: enabled } }
  );
}

// always two booleans; missing input means camera off, mic on
export function resolveJoinMediaState(mediaState) {
  if (!mediaState || typeof mediaState !== "object") {
    return { video: false, audio: true };
  }
  return { video: !!mediaState.video, audio: mediaState.audio !== false };
}

export async function listOtherParticipants(RoomModel, roomId, userId) {
  const room = await RoomModel.findById(roomId);
  if (!room) {
    return [];
  }
  return room.participants
    .filter((p) => p.userId !== userId)
    .map((p) => ({
      userId: p.userId,
      username: p.username,
      profilePicture: p.profilePicture,
      mediaState: p.mediaState,
    }));
}
