import db from "../../libs/db.js"
import { Op } from "sequelize"

// Thứ tự nên có là Nam học, học kỳ, khối lớp rồi mới đến lớp nha.

const parseDateOnly = (dateValue) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return null;
    }

    const [year, month, day] = dateValue.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return date;
}

// Năm học
export const createYear = async (req, res) => {
    try {
        const {
            TenNamHoc,
            NgayBatDau,
            NgayKetThuc
        } = req.body;

        if (!TenNamHoc || !NgayBatDau || !NgayKetThuc) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const yearMatch = TenNamHoc.match(/^(\d{4})-(\d{4})$/);

        if (!yearMatch) {
            return res.status(400).json({ message: "School year must use format YYYY-YYYY" });
        }

        const schoolStartYear = Number(yearMatch[1]);
        const schoolEndYear = Number(yearMatch[2]);

        if (schoolEndYear !== schoolStartYear + 1) {
            return res.status(400).json({ message: "School year must be consecutive years" });
        }

        const startDate = parseDateOnly(NgayBatDau);
        const endDate = parseDateOnly(NgayKetThuc);

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        if (startDate >= endDate) {
            return res.status(400).json({ message: "Start date must be before end date" });
        }

        if (
            startDate.getUTCFullYear() !== schoolStartYear ||
            endDate.getUTCFullYear() !== schoolEndYear
        ) {
            return res.status(400).json({ message: "Date range must match school year" });
        }

        const existingYear = await db.NAMHOC.findByPk(TenNamHoc);

        if (existingYear) {
            return res.status(409).json({ message: "Year already exists" });
        }

        const newYear = await db.NAMHOC.create({
            TenNamHoc,
            NgayBatDau,
            NgayKetThuc
        });

        res.status(201).json(newYear);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}

export const getAllYear = async (req, res) => {
    try {
        const year = await db.NAMHOC.findAll();
        res.json(year);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}

// Học Kỳ 
export const createSemester = async (req, res) => {
    try {
        // Todo: từ db gọi đến HOCKY và tạo các học kỳ.
        // Đọc từ req.body
        // Tạo đối tượng 
        // Thêm vào database
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}

export const getAllSemester = async (req, res) => {
    try {
        // Todo: Tham Khảo student.controller.js
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}

// Khối Lớp
export const createGrade = async (req, res) => {
    try {
        // Todo: từ db gọi đến KHOILOP và tạo các khối lớp.
        // Đọc từ req.body
        // Kiểm tra xem năm học đã tồn tại chưa
        // Tạo đối tượng 
        // Thêm vào database
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}

export const getAllGrade = async (req, res) => {
    try {
        // Todo: Tham Khảo student.controller.js
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}


// Lớp
export const createClass = async (req, res) => {
    try {
        // Todo: từ db gọi đến LOP và tạo các  lớp.

        // Đọc từ req.body
        const {
            MaLop,
            TenLop,
            MaKhoiLop,
            TenNamHoc,
            SiSo
        } = req.body;

        if (!MaLop || !TenLop || !MaKhoiLop || !TenNamHoc) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const existingClass = await db.LOP.findByPk(MaLop);

        if (existingClass) {
            return res.status(409).json({ message: "Class already exists" });
        }

        // Tạo đối tượng 
        // Thêm vào database
        const newClass = await db.LOP.create({
            MaLop,
            TenLop,
            MaKhoiLop,
            TenNamHoc,
            SiSo
        });
        res.status(201).json(newClass);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}

export const getAllClass = async (req, res) => {
    try {
        const classes = await db.LOP.findAll();
        res.json(classes);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}
