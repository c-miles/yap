// All Room mutations are single atomic operations: the capacity check lives
// in the update's filter, so two concurrent joins can never both slip past
// a stale read (the old find -> mutate -> save() pattern raced and could
// also throw VersionError under concurrency).

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

  // New participant: push only if there is room, atomically. The same-user
  // exclusion guards against a concurrent duplicate: if another request just
  // inserted this user's entry between our rejoin probe and here, this push
  // must not also match and duplicate it.
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

  // Double miss: either a concurrent join by this same user just inserted
  // their entry (in which case retrying the rejoin update will find and
  // update it in place), or the room is genuinely full/missing.
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

// Normalize client-supplied pre-join mic/cam state into { video, audio }. Guards absent/malformed/non-boolean input so a hostile client can't write arbitrary mediaState.
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
