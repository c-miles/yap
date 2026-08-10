import express from "express";
import { fetchIceServers } from "../services/turnCredentials.js";
import { requireAuthApi } from "../middleware/requireAuthApi.js";

const router = express.Router();

router.get("/", requireAuthApi, async (req, res) => {
  const iceServers = await fetchIceServers({
    keyId: process.env.CLOUDFLARE_TURN_KEY_ID,
    apiToken: process.env.CLOUDFLARE_TURN_API_TOKEN,
  });
  res.json({ iceServers });
});

export default router;
