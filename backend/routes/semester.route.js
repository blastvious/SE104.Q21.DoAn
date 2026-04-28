import express from "express"
import {createSemester, getAllSemester} from '../src/controllers/semester.controller.js'
import { validateSemester } from "../middlewares/semester.validation.js";

const router = express.Router();

router.get("/semester", getAllSemester);
router.post("/semester", validateSemester, createSemester);

export default router;