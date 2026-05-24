import express from 'express'
import * as classController from '../src/controllers/class.controller.js'

const router = express.Router();

//Router cho năm học
router.get("/year", classController.getAllYear);
router.post("/year", classController.createYear);
router.put("/year/:TenNamHoc", classController.updateYear);
router.delete("/year/:TenNamHoc", classController.deleteYear);

//Router cho học kỳ.
router.get("/semester", classController.getAllSemester);
router.post("/semester", classController.createSemester);
router.put("/semester/:MaHocKy", classController.updateSemester);
router.delete("/semester/:MaHocKy", classController.deleteSemester);

//Router cho khối lớp.
router.get('/grades', classController.getAllGrade);
router.post('/grades', classController.createGrade);
router.put('/grades/:MaKhoiLop', classController.updateGrade);
router.delete('/grades/:MaKhoiLop', classController.deleteGrade);

//Router cho lớp.
router.get("/class", classController.getAllClass);
router.post("/class", classController.createClass);
router.put("/class/:MaLop", classController.updateClass);
router.delete("/class/:MaLop", classController.deleteClass);

export default router;
