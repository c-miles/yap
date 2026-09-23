const ROOM_ID = /^[0-9a-f]{24}$/i;

export function findRoom(RoomModel, nameOrId) {
  return RoomModel.findOne(ROOM_ID.test(nameOrId) ? { _id: nameOrId } : { friendlyName: nameOrId });
}
