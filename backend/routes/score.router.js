import express from 'express'
import * as scoreController from '../src/controllers/score.controller.js'

const router = express.Router();

router.post('/scores', scoreController.getScore);
router.post('/scores/bulk', scoreController.bulkImportScores);
router.get('/scores', scoreController.getBangDiemMon);

export default router;