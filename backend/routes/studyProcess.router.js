import express from 'express'
import { enrollStudent, getClassList, transferClass, semesterSummary } from '../src/controllers/studyProcess.controller.js'
import { validate, enrollSchema, transferSchema, summarySchema, classListQuerySchema } from '../middlewares/studyProcess.validation.js'

const router = express.Router();

router.post("/study-process/enroll", validate(enrollSchema), enrollStudent);
router.get("/study-process/class-list", validate(classListQuerySchema), getClassList);
router.put("/study-process/transfer", validate(transferSchema), transferClass);
router.post("/study-process/summary", validate(summarySchema), semesterSummary);

export default router;
