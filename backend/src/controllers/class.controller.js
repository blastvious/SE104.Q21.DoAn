import db from "../../libs/db.js"
import { Op } from "sequelize"

// Thứ tự nên có là Nam học, học kỳ, khối lớp rồi mới đến lớp nha.

// Năm học
export const createYear = async (req, res) =>{
    try {
        const {
            TenNamHoc,
            NgayBatDau,
            NgayKetThuc
        } = req.body;

        if (!TenNamHoc || !NgayBatDau || !NgayKetThuc) {
            return res.status(400).json({message: "Missing required fields"});
        }

        const existingYear = await db.NAMHOC.findByPk(TenNamHoc);

        if (existingYear) {
            return res.status(409).json({message: "Year already exists"});
        }

        const newYear = await db.NAMHOC.create({
            TenNamHoc,
            NgayBatDau,
            NgayKetThuc
        });

        res.status(201).json(newYear);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}

export const getAllYear = async(req, res) =>{
    try {
        const year = await db.NAMHOC.findAll();
        res.json(year);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}

// Học Kỳ 
export const createSemester = async (req, res) =>{
    try {
        // Todo: từ db gọi đến HOCKY và tạo các học kỳ.
        // Đọc từ req.body
        // Tạo đối tượng 
        // Thêm vào database
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}

export const getAllSemester = async(req, res) =>{
    try {
        // Todo: Tham Khảo student.controller.js
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}

// Khối Lớp
export const createGrade = async (req, res) =>{
    try {
        // Todo: từ db gọi đến KHOILOP và tạo các khối lớp.
        // Đọc từ req.body
        // Kiểm tra xem khối lớp đã tồn tại chưa
        // Tạo đối tượng 
        // Thêm vào database

        const {
            TenKhoiLop,
        } = req.body;

        if (!TenKhoiLop) {
            return res.status(400).json({message: "Missing required fields"});
        }    

        const existingGrade = await db.KHOILOP.findOne({
            where: {
                TenKhoiLop,
            }
        });

        if (existingGrade) {
            return res.status(409).json({message: "Grade already exists"});
        }

        const newGrade = await db.sequelize.transaction(async (t) => {
            const lastGrade = await db.KHOILOP.findOne({
                order: [["MaKhoiLop", "DESC"]],
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            let stt = 1;
            if (lastGrade) {
                const lastNumber = parseInt(lastGrade.MaKhoiLop.replace(/\D/g, ''));
                stt = lastNumber + 1;
            }

            const MaKhoiLop = `KL${String(stt).padStart(2, '0')}`;
            return await db.KHOILOP.create({
                MaKhoiLop,
                TenKhoiLop
            }, { transaction: t });
        });

        res.status(201).json(newGrade);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}

export const getAllGrade = async(req, res) =>{
    try {
        const grade = await db.KHOILOP.findAll();
        res.json(grade);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}


// Lớp
export const createClass = async (req, res) =>{
    try {
        // Todo: từ db gọi đến LOP và tạo các  lớp.
        // Đọc từ req.body
        // Tạo đối tượng 
        // Thêm vào database
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}

export const getAllClass = async(req, res) =>{
    try {
        // Todo: Tham Khảo student.controller.js
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}
