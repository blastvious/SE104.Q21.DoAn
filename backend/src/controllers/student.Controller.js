import db from "../../libs/db.js"
import { Op, where } from "sequelize"

const tinhTuoi = (ngaySinh) => {
  const sinh = new Date(ngaySinh);
  const homNay = new Date();
  let tuoi = homNay.getFullYear() - sinh.getFullYear();
  const thang = homNay.getMonth() - sinh.getMonth();
  if (thang < 0 || (thang === 0 && homNay.getDate() < sinh.getDate())) {
    tuoi--;
  }
  return tuoi;
};


/* =========================================
   GET STUDENT 
========================================= */
export const getAllStudent = async (req, res) => {
    try {
        const { keyword } = req.query;
        const whereClause = keyword
            ? {
                [Op.or]: [
                    { HoTen: { [Op.like]: `%${keyword}%` } },
                    { SoDienThoai: { [Op.like]: `%${keyword}%` } },
                ]
            }
            : {};

        const student = await db.HOCSINH.findAll({
            where: whereClause,
            order: [
               
                [
                    db.sequelize.literal(`
                        CASE 
                            WHEN CHARINDEX(' ', REVERSE(RTRIM([HoTen]))) > 0 
                            THEN RIGHT(RTRIM([HoTen]), CHARINDEX(' ', REVERSE(RTRIM([HoTen]))) - 1)
                            ELSE [HoTen]
                        END COLLATE Vietnamese_CI_AS
                    `), 
                    'ASC'
                ],
             
                [db.sequelize.literal('[HoTen] COLLATE Vietnamese_CI_AS'), 'ASC']
            ]
        });
        
        res.json(student);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
};
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

        // 2. Kiểm tra tuổi
        const [tuoiThieuRows] = await db.sequelize.query(
          `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'TuoiToiThieu'`
        );
        const [tuoiDaRows] = await db.sequelize.query(
          `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'TuoiToiDa'`
        );
        const tuoiToiThieu = parseInt(tuoiThieuRows[0]?.GiaTri);
        const tuoiToiDa = parseInt(tuoiDaRows[0]?.GiaTri);

        if (!isNaN(tuoiToiThieu) || !isNaN(tuoiToiDa)) {
          const tuoi = tinhTuoi(NgaySinh);
          if (!isNaN(tuoiToiThieu) && tuoi < tuoiToiThieu) {
            await t.rollback();
            return res.status(400).json({ message: `Tuổi học sinh phải >= ${tuoiToiThieu}` });
          }
          if (!isNaN(tuoiToiDa) && tuoi > tuoiToiDa) {
            await t.rollback();
            return res.status(400).json({ message: `Tuổi học sinh phải <= ${tuoiToiDa}` });
          }
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

        const existingStudents = await db.HOCSINH.findAll({
            attributes: ['HoTen', 'NgaySinh', 'DiaChi', 'Email', 'SoDienThoai']
        });

        const existingEmails = new Set(existingStudents.map(s => s.Email).filter(Boolean));
        const existingPhones = new Set(existingStudents.map(s => s.SoDienThoai).filter(Boolean));
        const existingNameDobAddr = new Set(
            existingStudents.map(s => {
                const dob = s.NgaySinh instanceof Date
                    ? s.NgaySinh.toISOString().slice(0, 10)
                    : String(s.NgaySinh);
                return `${s.HoTen}|${dob}|${s.DiaChi}`;
            })
        );

        // Đọc tham số tuổi
        const [tuoiThieuRows] = await db.sequelize.query(
          `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'TuoiToiThieu'`
        );
        const [tuoiDaRows] = await db.sequelize.query(
          `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'TuoiToiDa'`
        );
        const tuoiToiThieu = parseInt(tuoiThieuRows[0]?.GiaTri);
        const tuoiToiDa = parseInt(tuoiDaRows[0]?.GiaTri);
        const kiemTraTuoi = !isNaN(tuoiToiThieu) || !isNaN(tuoiToiDa);

        const uniqueStudentsToInsert = [];
        const seen = new Set();
        let biLoaiTuoi = 0;

        for (const s of studentData) {
            const dob = s.NgaySinh instanceof Date
                ? s.NgaySinh.toISOString().slice(0, 10)
                : String(s.NgaySinh);
            const key = `${s.HoTen}|${dob}|${s.DiaChi}`;

            const isDuplicate =
                (s.Email && existingEmails.has(s.Email)) ||
                (s.SoDienThoai && existingPhones.has(s.SoDienThoai)) ||
                existingNameDobAddr.has(key) ||
                seen.has(key);

            if (isDuplicate) continue;

            // Kiểm tra tuổi
            if (kiemTraTuoi && s.NgaySinh) {
              const tuoi = tinhTuoi(s.NgaySinh);
              if ((!isNaN(tuoiToiThieu) && tuoi < tuoiToiThieu) ||
                  (!isNaN(tuoiToiDa) && tuoi > tuoiToiDa)) {
                biLoaiTuoi++;
                continue;
              }
            }

            seen.add(key);
            uniqueStudentsToInsert.push(s);
        }

        let msg = "";
        if (biLoaiTuoi > 0) msg = ` (bỏ qua ${biLoaiTuoi} học sinh không đúng độ tuổi)`;

        if (uniqueStudentsToInsert.length === 0) {
            return res.status(400).json({ message: "Tất cả học sinh đều đã tồn tại hoặc không đúng độ tuổi" + msg });
        }

        const lastStudent = await db.HOCSINH.findOne({
            where: { MaHS: { [Op.like]: `${khoa}%` } },
            order: [["MaHS", "DESC"]]
        });

        let currentStt = lastStudent ? parseInt(lastStudent.MaHS.slice(4)) + 1 : 1;

        const studentsWithIds = uniqueStudentsToInsert.map((s, index) => {
            const padded = String(currentStt + index).padStart(4, '0');
            return { ...s, MaHS: `${khoa}${padded}` };
        });

        const t = await db.sequelize.transaction();
        try {
            const result = await db.HOCSINH.bulkCreate(studentsWithIds, { transaction: t });
            await t.commit();
            const daBoQua = studentData.length - result.length;
            let successMsg = `Thành công: Đã thêm ${result.length} học sinh.`;
            if (daBoQua > 0) successMsg += ` Bỏ qua ${daBoQua} bản ghi (trùng lặp/không đúng độ tuổi).`;
            res.status(201).json({
                message: successMsg,
                data: result
            });
        } catch (err) {
            await t.rollback();
            throw err;
        }
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

        if (NgaySinh) {
          const [tuoiThieuRows] = await db.sequelize.query(
            `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'TuoiToiThieu'`
          );
          const [tuoiDaRows] = await db.sequelize.query(
            `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'TuoiToiDa'`
          );
          const tuoiToiThieu = parseInt(tuoiThieuRows[0]?.GiaTri);
          const tuoiToiDa = parseInt(tuoiDaRows[0]?.GiaTri);

          if (!isNaN(tuoiToiThieu) || !isNaN(tuoiToiDa)) {
            const tuoi = tinhTuoi(NgaySinh);
            if (!isNaN(tuoiToiThieu) && tuoi < tuoiToiThieu) {
              return res.status(400).json({ message: `Tuổi học sinh phải >= ${tuoiToiThieu}` });
            }
            if (!isNaN(tuoiToiDa) && tuoi > tuoiToiDa) {
              return res.status(400).json({ message: `Tuổi học sinh phải <= ${tuoiToiDa}` });
            }
          }
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