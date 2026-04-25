import express from "express"
import {createStudent, getAllStudent} from '../src/controllers/student.controller.js'
import { validateStudent } from "../middlewares/student.validation.js";

const router = express.Router();

router.get("/student", getAllStudent);

//To do: Thêm route cho thêm học sinh vào cơ sở dữ liệu.
// routes/student.Route.js

router.post("/student", validateStudent, createStudent);

export default router;