import db from "../../libs/db.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt";

export const getMe = (req, res) => {
    res.json(req.user);
};

export const getUsers = async (req, res) => {
    try {
        const users = await db.PHANQUYEN.findAll({
            attributes: ["Id", "Username", "RoleName"]
        });
        return res.json(users);
    } catch (error) {
        console.error("Lỗi tại getUsers controller:", error);
        return res.status(500).json({ message: "Không thể lấy danh sách tài khoản từ cơ sở dữ liệu." });
    }
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

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { RoleName } = req.body;

        const user = await db.PHANQUYEN.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.RoleName = RoleName;
        await user.save();

        res.json({ message: "Updated successfully", user });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await db.PHANQUYEN.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.destroy();

        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};