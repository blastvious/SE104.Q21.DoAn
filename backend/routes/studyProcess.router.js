import express from 'express'
import { enrollStudent, getClassList, transferClass, semesterSummary,getAssignedStudents,getUnassignedStudents, assignStudentsBatch, semesterSummaryAll, promoteStudents} from '../src/controllers/studyProcess.controller.js'
import { validate, enrollSchema, transferSchema, summarySchema, classListQuerySchema } from '../middlewares/studyProcess.validation.js'

const router = express.Router();

router.post("/study-process/enroll", validate(enrollSchema), enrollStudent);
router.get("/study-process/class-list", validate(classListQuerySchema), getClassList);
router.put("/study-process/transfer", validate(transferSchema), transferClass);
router.post("/study-process/summary", validate(summarySchema), semesterSummary);
router.get("/study-process/unassigned", getUnassignedStudents);
router.get("/study-process/assigned", getAssignedStudents);
router.post("/study-process/assign-batch", assignStudentsBatch);
router.post("/study-process/summary-all", semesterSummaryAll);
router.post("/study-process/promote-students", promoteStudents);

export default router;
