import express from "express";
import {
    searchStudent,
    getStudentDetail,
    getStudentHistory,
    getStudentScore,
} from "../src/controllers/search.controller.js";
 
const router = express.Router();
 
router.get("/search", searchStudent);
router.get("/search/:maHS", getStudentDetail);
router.get("/search/:maHS/history", getStudentHistory);
router.get("/search/:maHS/score", getStudentScore);
 
export default router;