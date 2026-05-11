import express from "express"
import {createStudent, getAllStudent,getStudentById,updateStudent,deleteStudent, bulkCreateStudents} from '../src/controllers/student.controller.js'
import { validateStudent, validateBulkStudents } from "../middlewares/student.validation.js";

const router = express.Router();

router.get("/student", getAllStudent);
router.get("/student/:id", getStudentById);

//To do: Thêm route cho thêm học sinh vào cơ sở dữ liệu.
// routes/student.Route.js

router.post("/student", validateStudent, createStudent);
router.post("/student/bulk", validateBulkStudents, bulkCreateStudents);

router.put("/student/:id", updateStudent);
router.delete("/student/:id", deleteStudent);
export default router;