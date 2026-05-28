import express from "express";
import { getPassRate } from "../src/controllers/dashboard.controller.js";

const router = express.Router();

router.get("/dashboard/pass-rate", getPassRate);

export default router;
