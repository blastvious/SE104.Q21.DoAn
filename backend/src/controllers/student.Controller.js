import db from "../../libs/db.js"
import { Op } from "sequelize"
export const getAllStudent = async (req, res) =>{
    try {
        const student = await db.HOCSINH.findAll();
        res.json(student);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
        
    }
}

//To do: Thêm method thêm học sinh

export const createStudent = async (req, res) => {
    try {
// ======= PhanThietke MaSo ===========
        const {
            HoTen,
            GioiTinh,
            NgaySinh,
            DiaChi,
            Email,
            SoDienThoai
        } = req.body;

        const khoa = "2652";

        
        const lastStudent = await db.HOCSINH.findOne({
            where: {
                MaHS: {
                    [Op.like]: `${khoa}%`
                }
            },
            order: [["MaHS","DESC"]]
        });

        let stt = 1;

        if(lastStudent){
            const lastNumber = parseInt(lastStudent.MaHS.slice(4))
            stt = lastNumber + 1
        };

        const padded = String(stt).padStart(4,'0');
        const MaHS = `${khoa}${padded}`;
// ==============================================================
        const newStudent = await db.HOCSINH.create({
            MaHS,
            HoTen,
            GioiTinh,
            NgaySinh,
            DiaChi,
            Email,
            SoDienThoai
        });

        res.status(201).json(newStudent)

    } catch (error) {
        console.error(error)
        res.status(500).json({
            statusCode: 500,
            message: "Error from server"
        });
    }
};


