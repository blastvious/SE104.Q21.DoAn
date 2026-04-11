import express from "express"
import {validateUser} from "../middlewares/user.validation.js"
import {createUser} from "../src/controllers/auth.controller.js"
const router = express.Router();


router.post("/auth", validateUser, createUser);
export default router;