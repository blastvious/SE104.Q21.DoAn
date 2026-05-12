import express from 'express'
import * as reportSubjectsController from '../src/controllers/reportSubjects.controller.js'

const router = express.Router();

router.post("/report-subjects", reportSubjectsController.createReport);
router.get("/report-subjects", reportSubjectsController.getAllReports);
router.get("/report-subjects/:id", reportSubjectsController.getReportById);

export default router;
