import express from "express";
import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator";

import { Room } from "../models/Room.js";
import { requireAuthApi } from "../middleware/requireAuthApi.js";

const router = express.Router();

router.get("/find-by-name/:friendlyName", requireAuthApi, async (req, res) => {
  try {
    const friendlyName = req.params.friendlyName;
    const room = await Room.findOne({ friendlyName: friendlyName });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json({ 
      roomId: room._id,
      friendlyName: room.friendlyName
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const generateFriendlyName = () => {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: '-',
    length: 3,
    style: 'lowerCase'
  });
};

router.post("/create", requireAuthApi, async (req, res) => {
  try {
    let friendlyName;
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure friendly name is unique
    do {
      friendlyName = generateFriendlyName();
      attempts++;
    } while (await Room.findOne({ friendlyName }) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return res.status(500).json({ message: "Unable to generate unique room name" });
    }

    const newRoom = new Room({ 
      friendlyName: friendlyName
    });
    const savedRoom = await newRoom.save();

    res.status(201).json({ 
      roomId: savedRoom._id, 
      friendlyName: friendlyName
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
