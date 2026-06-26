import express from "express";
import * as referralController from "../controllers/referralController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/me", referralController.getReferralInfo);
router.get("/stats", referralController.getReferralStats);
router.post("/apply", referralController.applyReferralCode);

export default router;
