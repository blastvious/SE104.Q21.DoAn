import db from "../../libs/db.js"
import { Op, where } from "sequelize"


/* =========================================
   GET STUDENT 
========================================= */
export const getAllStudent = async (req, res) =>{
    try {
        const student = await db.HOCSINH.findAll();
        res.json(student);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
        
    }
}
/* =========================================
   GET STUDENT BY ID
========================================= */
export const getStudentById = async (req, res) => {

    try {

        const { id } = req.params;

        const student = await db.HOCSINH.findByPk(id);

        if (!student) {

            return res.status(404).json({
                message: "Không tìm thấy học sinh"
            });

        }

        res.json(student);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Error from server"
        });

    }

};

/* =========================================
   CREATE STUDENT
========================================= */

export const createStudent = async (req, res) => {
    // Sử dụng transaction để khóa bảng
    const t = await db.sequelize.transaction();
    try {
        const { HoTen, GioiTinh, NgaySinh, DiaChi, Email, SoDienThoai } = req.body;
        const khoa = "2652";

        // Tìm lastStudent bên trong transaction với khóa LOCK.UPDATE
        const lastStudent = await db.HOCSINH.findOne({
            where: { MaHS: { [Op.like]: `${khoa}%` } },
            order: [["MaHS", "DESC"]],
            transaction: t,
            lock: true // QUAN TRỌNG: Khóa dòng này lại để người khác không vào chiếm mã
        });

        let stt = 1;
        if (lastStudent) {
            stt = parseInt(lastStudent.MaHS.slice(4)) + 1;
        }

        const MaHS = `${khoa}${String(stt).padStart(4, '0')}`;

        const newStudent = await db.HOCSINH.create({
            MaHS, HoTen, GioiTinh, NgaySinh, DiaChi, Email, SoDienThoai
        }, { transaction: t });

        // Commit dữ liệu
        await t.commit();
        res.status(201).json(newStudent);

    } catch (error) {
        // Nếu lỗi thì hoàn tác (rollback)
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: "Mã học sinh bị trùng hoặc lỗi server, hãy thử lại" });
    }
};


/* =========================================
   BULK CREATE STUDENTS
========================================= */
export const bulkCreateStudents = async (req, res) => {
    try {
        const studentData = req.body;
        const khoa = "2652";

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


/* =========================================
   UPDATE STUDENT
========================================= */
export const updateStudent = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            HoTen,
            GioiTinh,
            NgaySinh,
            DiaChi,
            Email,
            SoDienThoai
        } = req.body;

        const student =
            await db.HOCSINH.findByPk(id);

        if (!student) {

            return res.status(404).json({
                message: "Không tìm thấy học sinh"
            });

        }

        await student.update({
            HoTen,
            GioiTinh,
            NgaySinh,
            DiaChi,
            Email,
            SoDienThoai
        });

        res.json(student);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Error from server"
        });

    }

};

/* =========================================
   DELETE STUDENT
========================================= */
export const deleteStudent = async (req, res) => {

    try {

        const { id } = req.params;

        const student =
            await db.HOCSINH.findByPk(id);

        if (!student) {

            return res.status(404).json({
                message: "Không tìm thấy học sinh"
            });

        }

        await student.destroy();

        res.json({
            message: "Xóa học sinh thành công"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Error from server"
        });

    }

};