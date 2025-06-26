import { Router } from "express";
import { identifyController } from "../controllers/identify.controller.js";
const router = Router();
router.post("/identify", (req, res) => {
    identifyController(req, res).catch((err) => {
        console.error("Identify controller failed:", err);
        res.status(500).json({ error: "Internal Server Error" });
    });
});
export default router;
