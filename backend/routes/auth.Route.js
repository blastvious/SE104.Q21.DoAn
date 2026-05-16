// routes/auth.route.js
import express from "express";
import { login, createUser, getMe, getUsers } from "../src/controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import checkRole from "../middlewares/role.validation.js";

const router = express.Router();

// đăng ký
router.post("/register", createUser);

// đăng nhập
router.post("/login", login);

router.get("/me", verifyToken, getMe);

// 🔥 chỉ admin
router.get("/users", verifyToken, checkRole("read"), getUsers);
export default router;