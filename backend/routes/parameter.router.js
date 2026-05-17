import express from 'express'
import * as parameterController from '../src/controllers/parameter.controller.js'

const router = express.Router();

/* Todo: Các bạn định nghĩa endpoint cho các route
    Lưu ý là endpoint là một danh từ, đây là quy tác chung*/

//Router cho tham số
router.get("/parameter", parameterController.getAllParameters);
router.post("/parameter", parameterController.createParameter);

router.get("/parameter/:name", parameterController.getParameterByName);
router.put("/parameter/:name", parameterController.updateParameter);
router.delete("/parameter/:name", parameterController.deleteParameter);

export default router;
