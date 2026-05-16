import express from 'express'
import * as parameterController from '../src/controllers/parameter.controller.js'

const router = express.Router();

/* Todo: Các bạn định nghĩa endpoint cho các route
    Lưu ý là endpoint là một danh từ, đây là quy tác chung*/

//Router cho tham số
router.get("/parameter", parameterController.getAllParameters);
router.get("/parameter/:id", parameterController.getParameterByName);
router.post("/parameter", parameterController.createParameter);
router.put("/parameter/:id", parameterController.updateParameter);
router.delete("/parameter/:id", parameterController.deleteParameter);

export default router;
