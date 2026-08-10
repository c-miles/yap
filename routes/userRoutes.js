import express from "express";
import { getAuth } from "@clerk/express";
import { User } from "../models/User.js";
import { requireAuthApi } from "../middleware/requireAuthApi.js";

const router = express.Router();

router.get("/:id", requireAuthApi, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).send("User not found");
    }

    if (getAuth(req).userId === req.params.id) {
      return res.json(user);
    }

    res.json({ id: user.id, username: user.username, picture: user.picture });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", requireAuthApi, async (req, res) => {
  try {
    const { email, picture, username } = req.body;
    const { userId } = getAuth(req);
    const newUser = new User({
      id: userId,
      email,
      picture,
      username,
      usernameLower: username ? username.toLowerCase() : undefined,
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", requireAuthApi, async (req, res) => {
  try {
    const { id } = req.params;
    if (getAuth(req).userId !== id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { username } = req.body;

    if (username === undefined) {
      const user = await User.findOne({ id: id });
      if (user) {
        return res.json(user);
      }
      return res.status(404).send("User not found");
    }

    const updates = {
      username,
      usernameLower: username.toLowerCase(),
    };

    const user = await User.findOneAndUpdate(
      { id: id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (user) {
      res.json(user);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/check-username/:username", requireAuthApi, async (req, res) => {
  try {
    const usernameLower = req.params.username.toLowerCase();
    const user = await User.findOne({ usernameLower: usernameLower });

    if (user) {
      res.json({ available: false });
    } else {
      res.json({ available: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
