import express from 'express'
import * as classController from '../src/controllers/class.controller.js'

const router = express.Router();

/* Todo: Các bạn định nghĩa endpoint cho các route
    Lưu ý là endpoint là một danh từ, đây là quy tác chung*/

//Router cho năm học

// router.get();
// router.post;

// //Router cho học kỳ.

// router.get();
// router.post;


// //Router cho khối lớp.

router.get('/grades', classController.getAllGrade);
router.post('/grades', classController.createGrade);

// //Router cho lớp.
// router.get();
// router.post;


export default router;
