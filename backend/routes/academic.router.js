import express from 'express'
import * as academicController from '../src/controllers/academic.controller.js'

const router = express.Router();

/* Todo: Các bạn định nghĩa endpoint cho các route
    Lưu ý là endpoint là một danh từ, đây là quy tác chung*/

//Router cho môn học
router.get("/subject", academicController.getAllSubjects);
router.get("/subject/:id", academicController.getSubjectById);
router.post("/subject", academicController.createSubject);
router.put("/subject/:id", academicController.updateSubject);

router.delete("/subject/:id", academicController.deleteSubject);

//Router cho Loại hình kiểm tra
router.get("/examtype", academicController.getAllExamTypes);
router.get("/examtype/:id", academicController.getExamTypeById);
router.post("/examtype", academicController.createExamType);
router.put("/examtype/:id", academicController.updateExamType);
router.delete("/examtype/:id", academicController.deleteExamType);

//Router cho Quản lý quy định

export default router;
