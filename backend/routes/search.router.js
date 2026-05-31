import express from "express";
import {
    searchStudent,
    suggestStudent,
    getStudentDetail,
    getStudentHistory,
    getStudentScore,
} from "../src/controllers/search.controller.js";
 
const router = express.Router();

router.get("/search/suggest", suggestStudent);
router.get("/search", searchStudent);
router.get("/search/:maHS/history", getStudentHistory);
router.get("/search/:maHS/score", getStudentScore);
router.get("/search/:maHS", getStudentDetail);
 
export default router;