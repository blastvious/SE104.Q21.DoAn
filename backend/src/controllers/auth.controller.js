import db from "../../libs/db.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt";

export const getMe = (req, res) => {
    res.json(req.user);
};

export const getUsers = async (req, res) => {
    const users = await db.PHANQUYEN.findAll({
        attributes: ["Id", "Username", "RoleName"]
    });
    res.json(users);
};

export const createUser = async (req, res) => {
    try {
        const { Username, Password, RoleName } = req.body;

        // 🔥 hash password
        const hashedPassword = await bcrypt.hash(Password, 10);

        const newUser = await db.PHANQUYEN.create({
            Username,
            Password: hashedPassword,
            RoleName
        });

        res.status(201).json(newUser);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            message: "Error from server"
        });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await db.PHANQUYEN.findOne({
            where: { Username: username }
        });

        if (!user) {
            return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
        }

        // 🔥 so sánh password
        const isMatch = await bcrypt.compare(password, user.Password);

        if (!isMatch) {
            return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
        }

        // 🔥 tạo token
        const token = jwt.sign(
            {
                id: user.Id,
                role: user.RoleName
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            token,
            user: {
                id: user.Id,
                username: user.Username,
                role: user.RoleName
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};