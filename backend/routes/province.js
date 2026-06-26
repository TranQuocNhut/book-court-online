import express from "express";
import { getProvinces } from "../controllers/provinceController.js";

const router = express.Router();

/**
 * Get provinces with districts (depth=2)
 * GET /api/provinces
 * Public endpoint - no authentication required
 */
router.get("/", getProvinces);

export default router;

