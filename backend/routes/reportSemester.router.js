import express from "express";

import { reportSemester }
from "../src/controllers/reportSemester.controller.js";

const router = express.Router();

router.post(
    "/report-semester",
    reportSemester
);

export default router;