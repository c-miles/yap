import express from "express";
import { fetchIceServers } from "../services/turnCredentials.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const iceServers = await fetchIceServers({
    keyId: process.env.CLOUDFLARE_TURN_KEY_ID,
    apiToken: process.env.CLOUDFLARE_TURN_API_TOKEN,
  });
  res.json({ iceServers });
});

export default router;
