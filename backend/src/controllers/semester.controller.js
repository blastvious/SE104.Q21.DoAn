import db from "../../libs/db.js"
import { Op } from "sequelize"

export const getAllSemester = async (req, res) =>{
    try {
        const semester = await db.HOCKY.findAll();
        res.json(semester);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}

export const createSemester = async (req, res) =>{
    try {
        
        const {
            TenHocKy
        } = req.body;

        // ============== check trùng tên học kỳ ===============
        const existing = await db.HOCKY.findOne({
            where: { TenHocKy }
        });

        if (existing) {
            return res.status(400).json({
                status: "Error",
                message: "Học kỳ đã tồn tại"
            });
        }

        // ============= tạo MaHocKy ==========================
        const lastSemester = await db.HOCKY.findOne({
            where: {
                MaHocKy: {[Op.like]: 'HK%'}
            },
            order: [["MaHocKy", "DESC"]]
        });

        let stt = 1;
        if(lastSemester){
            const lastNumber = parseInt(lastSemester.MaHocKy.slice(2))
            stt = lastNumber + 1
        }

        const MaHocKy = `HK${String(stt).padStart(3, '0')}`;
        const newSemester = await db.HOCKY.create({
            MaHocKy,
            TenHocKy
        });
        res.status(201).json(newSemester);
    } catch (error){
        console.error(error);
        res.status(500).json({ message: "Error from server" });
    }
}