import express from "express"
import {getStudent} from '../src/controllers/student.Controller.js'

const router = express.Router();

router.get("/student", getStudent);

//To do: Thêm route cho thêm học sinh vào cơ sở dữ liệu.

export default router;