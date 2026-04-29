import db from "../../libs/db.js"
import { Op, where } from "sequelize"
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

export const bulkCreateStudents = async (req, res) => {
    try {
        const studentData = req.body;
        const khoa = "2662";

        // Lấy học sinh cuối cùng trong database để làm mốc cho việc thêm học sinh mới.
        const lastStudent = await db.HOCSINH.findOne({
            where: {MaHS: {[Op.like]: `${khoa}%`}},
            order: [["MaHS", "DESC"]]
        });


        let currentStt = 1;
        if (lastStudent) {
            currentStt = parseInt(lastStudent.MaHS.slice(4)) + 1;
        }

        const studentsToInsert = studentData.map((s, index) =>{
            const padded = String(currentStt + index).padStart(4, '0');
            return {
                ...s,
                MaHS: `${khoa}${padded}`
            }
        });

        const result = await db.HOCSINH.bulkCreate(studentsToInsert, {validate: true});

        res.status(201).json({
            message: `Insert succesfully ${result.length} students`,
            data: result
        });
    } catch (error) {
        console.error(error)
        res.status(500).json({
            statusCode: 500,
            message: "Error from server"
        });
    }
}


