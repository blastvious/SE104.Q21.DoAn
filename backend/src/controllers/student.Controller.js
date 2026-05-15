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
    const t = await db.sequelize.transaction();
    try {
        const { HoTen, GioiTinh, NgaySinh, DiaChi, Email, SoDienThoai } = req.body;

        // 1. Kiểm tra trùng lặp tổng hợp
        const duplicate = await db.HOCSINH.findOne({
            where: {
                [Op.or]: [
                    { [Op.and]: [{ HoTen }, { NgaySinh }, { DiaChi }] }, 
                    { Email: Email || null }, 
                    { SoDienThoai: SoDienThoai || null } 
                ]
            },
            transaction: t
        });

        if (duplicate) {
            await t.rollback();
            let reason = "Học sinh đã tồn tại ";
            return res.status(400).json({ message: reason });
        }

        const khoa = "2652";
        const lastStudent = await db.HOCSINH.findOne({
            where: { MaHS: { [Op.like]: `${khoa}%` } },
            order: [["MaHS", "DESC"]],
            transaction: t,
            lock: true 
        });

        let stt = 1;
        if (lastStudent) {
            stt = parseInt(lastStudent.MaHS.slice(4)) + 1;
        }
        const MaHS = `${khoa}${String(stt).padStart(4, '0')}`;

        const newStudent = await db.HOCSINH.create({
            MaHS, HoTen, GioiTinh, NgaySinh, DiaChi, Email, SoDienThoai
        }, { transaction: t });

        await t.commit();
        res.status(201).json(newStudent);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: "Lỗi hệ thống khi tạo học sinh" });
    }
};
/* =========================================
   BULK CREATE STUDENTS
========================================= */
export const bulkCreateStudents = async (req, res) => {
    try {
        const studentData = req.body;
        const khoa = "2652";

        // 1. Lấy tất cả HS hiện có để đối chiếu (Chỉ lấy các cột cần thiết để tối ưu bộ nhớ)
        const existingStudents = await db.HOCSINH.findAll({
            attributes: ['HoTen', 'NgaySinh', 'DiaChi', 'Email', 'SoDienThoai']
        });

        // 2. Hàm kiểm tra trùng nội bộ
        const isDuplicate = (s) => existingStudents.some(existing => 
            (existing.HoTen === s.HoTen && existing.NgaySinh === s.NgaySinh && existing.DiaChi === s.DiaChi) ||
            (s.Email && existing.Email === s.Email) ||
            (s.SoDienThoai && existing.SoDienThoai === s.SoDienThoai)
        );

        // 3. Lọc ra những học sinh chưa có trong DB
        const uniqueStudentsToInsert = studentData.filter(s => !isDuplicate(s));

        if (uniqueStudentsToInsert.length === 0) {
            return res.status(400).json({ message: "Tất cả học sinh trong danh sách đều đã tồn tại" });
        }

        // 4. Cấp mã MaHS cho danh sách đã lọc (Logic cũ của bạn)
        const lastStudent = await db.HOCSINH.findOne({
            where: { MaHS: { [Op.like]: `${khoa}%` } },
            order: [["MaHS", "DESC"]]
        });

        let currentStt = lastStudent ? parseInt(lastStudent.MaHS.slice(4)) + 1 : 1;

        const studentsWithIds = uniqueStudentsToInsert.map((s, index) => {
            const padded = String(currentStt + index).padStart(4, '0');
            return { ...s, MaHS: `${khoa}${padded}` };
        });

        const result = await db.HOCSINH.bulkCreate(studentsWithIds, { validate: true });

        res.status(201).json({
            message: `Thành công: Đã thêm ${result.length} học sinh. Bỏ qua ${studentData.length - result.length} bản ghi trùng lặp.`,
            data: result
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống khi thêm hàng loạt" });
    }
};


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