import express from 'express'
import * as academicController from '../src/controllers/academic.controller.js'

const router = express.Router();

/* Todo: Các bạn định nghĩa endpoint cho các route
    Lưu ý là endpoint là một danh từ, đây là quy tác chung*/

//Router cho môn học
router.get("/subject", academicController.getAllSubjects);
router.post("/subject", academicController.createSubject);

//Router cho Loại hình kiểm tra
router.get("/examtype", academicController.getAllExamTypes);
router.post("/examtype", academicController.createExamType);

//Router cho Quản lý quy định

export default router;
