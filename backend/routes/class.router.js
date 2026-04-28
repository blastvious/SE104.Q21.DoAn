import express from 'express'
import * as classController from '../src/controllers/class.controller.js'

const router = express.Router();

/* Todo: Các bạn định nghĩa endpoint cho các route
    Lưu ý là endpoint là một danh từ, đây là quy tác chung*/

//Router cho năm học

router.get("/year", classController.getAllYear);
router.post("/year", classController.createYear);

// Router cho học kỳ
router.get("/semester", classController.getAllSemester);
router.post("/semester", classController.createSemester);

//Router cho lớp.
router.get("/class", classController.getAllClass);
router.post("/class", classController.createClass);


export default router;
