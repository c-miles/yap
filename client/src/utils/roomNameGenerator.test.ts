import { normalizeRoomName } from "./roomNameGenerator";

describe("normalizeRoomName", () => {
  test.each([
    ["jolly-red-fox", "jolly-red-fox"],
    ["  Jolly-Red-Fox  ", "jolly-red-fox"],
    ["jolly red fox", "jolly-red-fox"],
    ["jolly  red   fox", "jolly-red-fox"],
    ["https://yap.example.com/room/jolly-red-fox", "jolly-red-fox"],
    ["http://localhost:3000/room/Jolly-Red-Fox/", "jolly-red-fox"],
    ["https://yap.example.com/room/jolly-red-fox?ref=share#top", "jolly-red-fox"],
    ["yap.example.com/room/jolly-red-fox", "jolly-red-fox"],
    ["https://yap.example.com/room/507f1f77bcf86cd799439011", "507f1f77bcf86cd799439011"],
    ["   ", ""],
  ])("%j becomes %j", (input, expected) => {
    expect(normalizeRoomName(input)).toBe(expected);
  });
});
