import db from "../../libs/db.js";
import { Op } from "sequelize";

const throwHttp = (message, status) => {
  const err = new Error(message);
  err.statusCode = status;
  throw err;
};

const handleCatch = (res, error) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: "Error from server" });
};

export const enrollStudent = async (req, res) => {
  try {
    const { MaHS, MaLop, MaHocKy } = req.body;

    // Tối ưu: Lấy cấu hình SiSoToiDa ngay từ đầu bên ngoài transaction
    const [student, semester, [paramRows]] = await Promise.all([
      db.HOCSINH.findByPk(MaHS),
      db.HOCKY.findByPk(MaHocKy),
      db.sequelize.query(
        `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'SiSoToiDa'`,
      ),
    ]);

    if (!student) return res.status(404).json({ message: "Student not found" });
    if (!semester)
      return res.status(404).json({ message: "Semester not found" });

    const [yearCheck] = await db.sequelize.query(`
      SELECT 1 FROM LOP l
      JOIN NAMHOC nh ON nh.TenNamHoc = l.TenNamHoc
      WHERE l.MaLop = :MaLop AND nh.NgayKetThuc < CAST(GETDATE() AS DATE)
    `, { replacements: { MaLop } });
    if (yearCheck.length > 0) {
      return res.status(403).json({ message: "Không thể tiếp nhận học sinh cho năm học đã kết thúc" });
    }

    await db.sequelize.transaction(async (t) => {
      const classRecord = await db.LOP.findByPk(MaLop, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!classRecord) throwHttp("Class not found", 404);

      // Sửa lỗi: Đọc chính xác giá trị từ cấu trúc mảng hàng (paramRows)
      if (paramRows && paramRows.length > 0) {
        const siSoToiDa = parseInt(paramRows[0].GiaTri, 10);
        const count = await db.QUATRINHHOC.count({
          where: { MaLop, MaHocKy },
          transaction: t,
        });

        if (count >= siSoToiDa) {
          throwHttp(`Lớp đã đạt sĩ số tối đa (${siSoToiDa} học sinh)`, 400);
        }
      }

      const enrolled = await db.QUATRINHHOC.findOne({
        where: { MaHS, MaHocKy },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (enrolled) {
        const sameClass = enrolled.MaLop === MaLop;
        throwHttp(
          sameClass
            ? "Student is already enrolled in this class for this semester"
            : "Student is already enrolled in another class this semester",
          sameClass ? 409 : 400,
        );
      }

      await db.QUATRINHHOC.create(
        { MaHS, MaLop, MaHocKy, DiemTBHocKy: 0.0 },
        { transaction: t },
      );

      // ĐỒNG BỘ SĨ SỐ
      const finalCount = await db.QUATRINHHOC.count({
        where: { MaLop, MaHocKy },
        transaction: t,
      });
      await classRecord.update({ SiSo: finalCount }, { transaction: t });
    });

    res.status(201).json({ message: "Enroll success" });
  } catch (error) {
    handleCatch(res, error);
  }
};

export const getClassList = async (req, res) => {
  try {
    const { MaLop, MaHocKy } = req.query;

    const list = await db.QUATRINHHOC.findAll({
      where: { MaLop, MaHocKy },
      include: [
        {
          model: db.HOCSINH,
          attributes: [
            "MaHS",
            "HoTen",
            "GioiTinh",
            "NgaySinh",
            "DiaChi",
            "Email",
            "SoDienThoai",
          ],
        },
      ],
      order: [[db.sequelize.col("HOCSINH.MaHS"), "ASC"]],
    });

    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error from server" });
  }
};

// export const transferClass = async (req, res) => {
//     try {
//         const { MaHS, MaHocKy, MaLopMoi } = req.body;

//         // Tối ưu: Đọc dữ liệu tham số tập trung ở Promise.all ngoài transaction
//         const [semester, [paramRows]] = await Promise.all([
//             db.HOCKY.findByPk(MaHocKy),
//             db.sequelize.query(`SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'SiSoToiDa'`)
//         ]);
//         if (!semester) return res.status(404).json({ message: "Semester not found" });

//         await db.sequelize.transaction(async (t) => {
//             const current = await db.QUATRINHHOC.findOne({
//                 where: { MaHS, MaHocKy }, transaction: t, lock: t.LOCK.UPDATE
//             });
//             if (!current) throwHttp("Enrollment not found for this student and semester", 404);
//             if (current.MaLop === MaLopMoi) throwHttp("Student is already in this class", 400);

//             const newClass = await db.LOP.findByPk(MaLopMoi, { transaction: t, lock: t.LOCK.UPDATE });
//             if (!newClass) throwHttp("New class not found", 404);

//             // Sửa lỗi: Sử dụng biến paramRows gọn gàng và chính xác từ ngoài truyền vào
//             if (paramRows && paramRows.length > 0) {
//                 const siSoToiDa = parseInt(paramRows[0].GiaTri, 10);
//                 const countNewClassBefore = await db.QUATRINHHOC.count({ where: { MaLop: MaLopMoi, MaHocKy }, transaction: t });

//                 if (countNewClassBefore >= siSoToiDa) {
//                     throwHttp(`Lớp mới đã đạt sĩ số tối đa (${siSoToiDa} học sinh)`, 400);
//                 }
//             }

//             const existing = await db.QUATRINHHOC.findOne({
//                 where: { MaHS, MaHocKy, MaLop: MaLopMoi }, transaction: t
//             });
//             if (existing) throwHttp("Student already has an enrollment record in the target class for this semester", 409);

//             const { DiemTBHocKy } = current;
//             const oldClass = await db.LOP.findByPk(current.MaLop, { transaction: t, lock: t.LOCK.UPDATE });

//             // THỰC HIỆN THAO TÁC: Xóa lớp cũ, Thêm lớp mới
//             await db.QUATRINHHOC.destroy({ where: { MaHS, MaHocKy, MaLop: current.MaLop }, transaction: t });
//             await db.QUATRINHHOC.create({ MaHS, MaHocKy, MaLop: MaLopMoi, DiemTBHocKy }, { transaction: t });

//             // ĐỒNG BỘ SĨ SỐ 2 LỚP
//             const finalOldClassCount = await db.QUATRINHHOC.count({ where: { MaLop: current.MaLop, MaHocKy }, transaction: t });
//             await oldClass.update({ SiSo: finalOldClassCount }, { transaction: t });

//             const finalNewClassCount = await db.QUATRINHHOC.count({ where: { MaLop: MaLopMoi, MaHocKy }, transaction: t });
//             await newClass.update({ SiSo: finalNewClassCount }, { transaction: t });
//         });

//         res.json({ message: "Transfer successful" });
//     } catch (error) {
//         handleCatch(res, error);
//     }
// };

// Hàm sinh mã tự động có hỗ trợ Transaction để tránh trùng lặp dữ liệu

const CreateMa = async (model, truongMa, prefix, transaction = null) => {
  const last = await model.findOne({
    order: [[truongMa, "DESC"]],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  let stt = 1;
  if (last) {
    const lastNumber = parseInt(last[truongMa].replace(/\D/g, ""));
    stt = lastNumber + 1;
  }
  return `${prefix}${String(stt).padStart(3, "0")}`;
};

export const transferClass = async (req, res) => {
  try {
    const { MaHS, MaHocKy, MaLopCu, MaLopMoi } = req.body;

    const [semester, [paramRows]] = await Promise.all([
      db.HOCKY.findByPk(MaHocKy),
      db.sequelize.query(
        `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'SiSoToiDa'`,
      ),
    ]);
    if (!semester)
      return res.status(404).json({ message: "Semester not found" });

    const [yearCheck] = await db.sequelize.query(`
      SELECT 1 FROM LOP l
      JOIN NAMHOC nh ON nh.TenNamHoc = l.TenNamHoc
      WHERE l.MaLop = :MaLopMoi AND nh.NgayKetThuc < CAST(GETDATE() AS DATE)
    `, { replacements: { MaLopMoi } });
    if (yearCheck.length > 0) {
      return res.status(403).json({ message: "Không thể chuyển lớp cho năm học đã kết thúc" });
    }

    await db.sequelize.transaction(async (t) => {
      const current = await db.QUATRINHHOC.findOne({
        where: {
          MaHS,
          MaHocKy,
          MaLop: MaLopCu,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!current)
        throwHttp("Enrollment not found for this student and semester", 404);
      if (MaLopCu === MaLopMoi)
        throwHttp("Student is already in this class", 400);

      const newClass = await db.LOP.findByPk(MaLopMoi, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!newClass) throwHttp("New class not found", 404);

      if (paramRows && paramRows.length > 0) {
        const siSoToiDa = parseInt(paramRows[0].GiaTri, 10);
        const countNewClassBefore = await db.QUATRINHHOC.count({
          where: { MaLop: MaLopMoi, MaHocKy },
          transaction: t,
        });

        if (countNewClassBefore >= siSoToiDa) {
          throwHttp(`Lớp mới đã đạt sĩ số tối đa (${siSoToiDa} học sinh)`, 400);
        }
      }
      const existed = await db.QUATRINHHOC.findOne({
        where: {
          MaHS,
          MaHocKy,
          MaLop: MaLopMoi,
        },
        transaction: t,
      });

      if (existed) {
        throwHttp("Student already exists in target class", 409);
      }

      // =========================================================
      // XỬ LÝ DỊCH CHUYỂN ĐẦU ĐIỂM SANG LỚP MỚI
      // =========================================================
      const studentScores = await db.CT_BANGDIEMMON_HS.findAll({
        where: { MaHS },
        include: [
          {
            model: db.BANGDIEMMON,
            where: { MaLop: MaLopCu, MaHocKy },
          },
        ],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      for (const ctHS of studentScores) {
        const oldBDM = ctHS.BANGDIEMMON;
        const MaMonHoc = oldBDM.MaMonHoc;

        const [newBDM] = await db.BANGDIEMMON.findOrCreate({
          where: { MaLop: MaLopMoi, MaMonHoc, MaHocKy },
          defaults: {
            MaBangDiemMon: await CreateMa(
              db.BANGDIEMMON,
              "MaBangDiemMon",
              "BDM",
              t,
            ),
          },
          transaction: t,
        });

        await ctHS.update(
          { MaBangDiemMon: newBDM.MaBangDiemMon },
          { transaction: t },
        );
      }

      const { DiemTBHocKy } = current;
      const oldClass = await db.LOP.findByPk(MaLopCu, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      await db.QUATRINHHOC.destroy({
        where: { MaHS, MaHocKy, MaLop: MaLopCu },
        transaction: t,
      });
      await db.QUATRINHHOC.create(
        { MaHS, MaHocKy, MaLop: MaLopMoi, DiemTBHocKy },
        { transaction: t },
      );

      const finalOldClassCount = await db.QUATRINHHOC.count({
        where: { MaLop: MaLopCu, MaHocKy },
        transaction: t,
      });
      await oldClass.update({ SiSo: finalOldClassCount }, { transaction: t });

      const finalNewClassCount = await db.QUATRINHHOC.count({
        where: { MaLop: MaLopMoi, MaHocKy },
        transaction: t,
      });
      await newClass.update({ SiSo: finalNewClassCount }, { transaction: t });
    });

    res.json({ message: "Transfer class and migrated scores successful" });
  } catch (error) {
    handleCatch(res, error);
  }
};

export const semesterSummary = async (req, res) => {
  try {
    const { MaLop, MaHocKy } = req.body;

    const [yearCheck] = await db.sequelize.query(`
      SELECT 1 FROM LOP l
      JOIN NAMHOC nh ON nh.TenNamHoc = l.TenNamHoc
      WHERE l.MaLop = :MaLop AND nh.NgayKetThuc < CAST(GETDATE() AS DATE)
    `, { replacements: { MaLop } });
    if (yearCheck.length > 0) {
      return res.status(403).json({ message: "Không thể tổng kết cho năm học đã kết thúc" });
    }

    const [records, bangDiemMonList] = await Promise.all([
      db.QUATRINHHOC.findAll({ where: { MaLop, MaHocKy } }),
      db.BANGDIEMMON.findAll({
        where: { MaLop, MaHocKy },
        include: [{ model: db.MONHOC, attributes: ["MaMonHoc", "HeSo"] }],
      }),
    ]);

    if (!records.length)
      throwHttp("No students found for this class and semester", 404);
    if (!bangDiemMonList.length)
      throwHttp("No score sheets found for this class and semester", 404);

    const maHSList = records.map((r) => r.MaHS);
    const maBangDiemMonList = bangDiemMonList.map((b) => b.MaBangDiemMon);

    const allScores = await db.CT_BANGDIEMMON_HS.findAll({
      where: {
        MaBangDiemMon: { [Op.in]: maBangDiemMonList },
        MaHS: { [Op.in]: maHSList },
      },
    });

    const scoreMap = new Map(
      allScores.map((s) => [`${s.MaBangDiemMon}_${s.MaHS}`, s]),
    );
    const heSoMap = new Map(
      bangDiemMonList.map((b) => [b.MaBangDiemMon, b.MONHOC?.HeSo ?? 1]),
    );

    const results = records.map((record) => {
      let totalScore = 0;
      let totalWeight = 0;

      for (const bdm of bangDiemMonList) {
        const score = scoreMap.get(`${bdm.MaBangDiemMon}_${record.MaHS}`);
        if (score?.DiemTBMon != null) {
          const weight = heSoMap.get(bdm.MaBangDiemMon);
          totalScore += parseFloat(score.DiemTBMon) * weight;
          totalWeight += weight;
        }
      }

      const diemTB =
        totalWeight > 0
          ? Math.round((totalScore / totalWeight) * 100) / 100
          : 0.0;
      return { MaHS: record.MaHS, MaLop, MaHocKy, DiemTBHocKy: diemTB };
    });

    await db.sequelize.transaction(async (t) => {
      await Promise.all(
        results.map((r) =>
          db.QUATRINHHOC.update(
            { DiemTBHocKy: r.DiemTBHocKy },
            { where: { MaHS: r.MaHS, MaLop, MaHocKy }, transaction: t },
          ),
        ),
      );
    });

    res.json({ message: "Semester summary completed", data: results });
  } catch (error) {
    handleCatch(res, error);
  }
};

export const assignStudentsBatch = async (req, res) => {
  try {
    const { students, MaLop, MaHocKy } = req.body;

    if (!students || students.length === 0) {
      throwHttp("No students selected", 400);
    }

    const [yearCheck] = await db.sequelize.query(`
      SELECT 1 FROM LOP l
      JOIN NAMHOC nh ON nh.TenNamHoc = l.TenNamHoc
      WHERE l.MaLop = :MaLop AND nh.NgayKetThuc < CAST(GETDATE() AS DATE)
    `, { replacements: { MaLop } });
    if (yearCheck.length > 0) {
      return res.status(403).json({ message: "Không thể xếp lớp cho năm học đã kết thúc" });
    }

    await db.sequelize.transaction(async (t) => {
      // Sửa cấu trúc bóc tách mảng hàng [paramRows] đồng bộ đồng nhất với các hàm trên
      const [paramRows] = await db.sequelize.query(
        `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'SiSoToiDa'`,
        { transaction: t },
      );

      const classRecord = await db.LOP.findByPk(MaLop, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!classRecord) throwHttp("Class not found", 404);

      if (paramRows && paramRows.length > 0) {
        const siSoToiDa = parseInt(paramRows[0].GiaTri, 10);
        const currentCount = await db.QUATRINHHOC.count({
          where: { MaLop, MaHocKy },
          transaction: t,
        });

        if (currentCount + students.length > siSoToiDa) {
          throwHttp(
            `Không thể thêm. Lớp hiện có ${currentCount} học sinh, nếu thêm ${students.length} học sinh sẽ vượt quá sĩ số tối đa (${siSoToiDa})`,
            400,
          );
        }
      }

      const existed = await db.QUATRINHHOC.findAll({
        where: {
          MaHS: { [Op.in]: students },
          MaHocKy,
        },
        transaction: t,
      });

      if (existed.length > 0) {
        throwHttp("Some students already assigned", 409);
      }

      const data = students.map((MaHS) => ({
        MaHS,
        MaLop,
        MaHocKy,
        DiemTBHocKy: 0.0,
      }));

      await db.QUATRINHHOC.bulkCreate(data, { transaction: t });

      // ĐỒNG BỘ SĨ SỐ
      const finalCount = await db.QUATRINHHOC.count({
        where: { MaLop, MaHocKy },
        transaction: t,
      });
      await classRecord.update({ SiSo: finalCount }, { transaction: t });
    });

    res.json({ message: "Assign success" });
  } catch (error) {
    handleCatch(res, error);
  }
};

export const getUnassignedStudents = async (req, res) => {
  try {
    const { MaHocKy } = req.query;

    const list = await db.HOCSINH.findAll({
      where: {
        MaHS: {
          [Op.notIn]: db.sequelize.literal(`(
                        SELECT MaHS FROM QUATRINHHOC WHERE MaHocKy = '${MaHocKy}'
                    )`),
        },
      },
      order: [["MaHS", "ASC"]],
    });

    res.json(list);
  } catch (error) {
    handleCatch(res, error);
  }
};

export const getAssignedStudents = async (req, res) => {
  try {
    const { MaHocKy, MaLop } = req.query;

    if (!MaHocKy) {
      return res.status(400).json({
        message: "MaHocKy is required",
      });
    }

    const list = await db.QUATRINHHOC.findAll({
      where: {
        MaHocKy,
        ...(MaLop ? { MaLop } : {}),
      },
      include: [
        {
          model: db.HOCSINH,
          attributes: ["MaHS", "HoTen", "GioiTinh"],
        },
      ],
    });

    res.json(list);
  } catch (error) {
    handleCatch(res, error);
  }
};

export const semesterSummaryAll = async (req, res) => {
  try {
    const { MaHocKy } = req.body;

    if (!MaHocKy) {
      return res.status(400).json({ message: "Thiếu MaHocKy" });
    }

    // Kiểm tra có lớp nào thuộc năm học đã kết thúc không
    const [closedLop] = await db.sequelize.query(`
      SELECT COUNT(*) AS sl FROM QUATRINHHOC qh
      JOIN LOP l ON l.MaLop = qh.MaLop
      JOIN NAMHOC nh ON nh.TenNamHoc = l.TenNamHoc
      WHERE qh.MaHocKy = :MaHocKy AND nh.NgayKetThuc < CAST(GETDATE() AS DATE)
    `, { replacements: { MaHocKy } });
    if (closedLop.length > 0 && parseInt(closedLop[0].sl) > 0) {
      return res.status(403).json({ message: "Không thể tổng kết vì có lớp thuộc năm học đã kết thúc" });
    }

    // Lấy tất cả lớp có học sinh trong học kỳ này
    const dsLop = await db.QUATRINHHOC.findAll({
      where: { MaHocKy },
      attributes: ["MaLop"],
      group: ["MaLop"],
    });

    if (!dsLop.length) {
      return res
        .status(404)
        .json({ message: "Không có lớp nào trong học kỳ này" });
    }

    const results = [];

    for (const { MaLop } of dsLop) {
      // Tái dùng logic của semesterSummary
      const [records, bangDiemMonList] = await Promise.all([
        db.QUATRINHHOC.findAll({ where: { MaLop, MaHocKy } }),
        db.BANGDIEMMON.findAll({
          where: { MaLop, MaHocKy },
          include: [{ model: db.MONHOC, attributes: ["MaMonHoc", "HeSo"] }],
        }),
      ]);

      if (!records.length || !bangDiemMonList.length) continue;

      const maBangDiemMonList = bangDiemMonList.map((b) => b.MaBangDiemMon);
      const maHSList = records.map((r) => r.MaHS);

      const allScores = await db.CT_BANGDIEMMON_HS.findAll({
        where: {
          MaBangDiemMon: { [Op.in]: maBangDiemMonList },
          MaHS: { [Op.in]: maHSList },
        },
      });

      const scoreMap = new Map(
        allScores.map((s) => [`${s.MaBangDiemMon}_${s.MaHS}`, s]),
      );
      const heSoMap = new Map(
        bangDiemMonList.map((b) => [b.MaBangDiemMon, b.MONHOC?.HeSo ?? 1]),
      );

      for (const record of records) {
        let totalScore = 0;
        let totalWeight = 0;

        for (const bdm of bangDiemMonList) {
          const score = scoreMap.get(`${bdm.MaBangDiemMon}_${record.MaHS}`);
          if (score?.DiemTBMon != null) {
            const weight = heSoMap.get(bdm.MaBangDiemMon);
            totalScore += parseFloat(score.DiemTBMon) * weight;
            totalWeight += weight;
          }
        }

        const diemTB =
          totalWeight > 0
            ? Math.round((totalScore / totalWeight) * 100) / 100
            : 0.0;

        await db.QUATRINHHOC.update(
          { DiemTBHocKy: diemTB },
          { where: { MaHS: record.MaHS, MaLop, MaHocKy } },
        );

        results.push({ MaLop, MaHS: record.MaHS, DiemTBHocKy: diemTB });
      }
    }

    res.json({
      message: "Tính điểm TB học kỳ tất cả lớp thành công",
      total: results.length,
      data: results,
    });
  } catch (error) {
    handleCatch(res, error);
  }
};

export const promoteStudents = async (req, res) => {
  try {
    const { students, MaLopCu, MaHocKyCu, MaLopMoi, MaHocKyMoi } = req.body;

    if (!students || students.length === 0) {
      throwHttp("No students selected", 400);
    }

    if (!MaLopCu || !MaHocKyCu || !MaLopMoi || !MaHocKyMoi) {
      throwHttp("Missing required fields", 400);
    }

    const [yearCheck] = await db.sequelize.query(`
      SELECT 1 FROM LOP l
      JOIN NAMHOC nh ON nh.TenNamHoc = l.TenNamHoc
      WHERE l.MaLop = :MaLopMoi AND nh.NgayKetThuc < CAST(GETDATE() AS DATE)
    `, { replacements: { MaLopMoi } });
    if (yearCheck.length > 0) {
      return res.status(403).json({ message: "Không thể chuyển lớp cho năm học đã kết thúc" });
    }

    await db.sequelize.transaction(async (t) => {
      // =========================
      // CHECK LỚP MỚI
      // =========================
      const newClass = await db.LOP.findByPk(MaLopMoi, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!newClass) {
        throwHttp("New class not found", 404);
      }

      // =========================
      // CHECK SĨ SỐ
      // =========================
      const [paramRows] = await db.sequelize.query(
        `SELECT GiaTri
         FROM THAMSO
         WHERE TenThamSo = 'SiSoToiDa'`,
        { transaction: t },
      );

      if (paramRows && paramRows.length > 0) {
        const siSoToiDa = parseInt(paramRows[0].GiaTri, 10);

        const currentCount = await db.QUATRINHHOC.count({
          where: {
            MaLop: MaLopMoi,
            MaHocKy: MaHocKyMoi,
          },
          transaction: t,
        });

        if (currentCount + students.length > siSoToiDa) {
          throwHttp(`Lớp mới vượt quá sĩ số tối đa (${siSoToiDa})`, 400);
        }
      }

      // =========================
      // LẤY HỌC SINH LỚP CŨ
      // =========================
      const oldStudents = await db.QUATRINHHOC.findAll({
        where: {
          MaLop: MaLopCu,
          MaHocKy: MaHocKyCu,
          MaHS: {
            [Op.in]: students,
          },
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!oldStudents.length) {
        throwHttp("No students found", 404);
      }

      // =========================
      // CHECK ĐÃ LÊN LỚP CHƯA
      // =========================
      const existed = await db.QUATRINHHOC.findAll({
        where: {
          MaHS: {
            [Op.in]: students,
          },
          MaLop: MaLopMoi,
          MaHocKy: MaHocKyMoi,
        },
        transaction: t,
      });

      if (existed.length > 0) {
        throwHttp("Some students already promoted", 409);
      }

      // =========================
      // TẠO DỮ LIỆU MỚI
      // =========================
      const newData = oldStudents.map((s) => ({
        MaHS: s.MaHS,
        MaLop: MaLopMoi,
        MaHocKy: MaHocKyMoi,
        DiemTBHocKy: 0,
      }));

      await db.QUATRINHHOC.bulkCreate(newData, {
        transaction: t,
      });

      // =========================
      // UPDATE SĨ SỐ
      // =========================
      const count = await db.QUATRINHHOC.count({
        where: {
          MaLop: MaLopMoi,
          MaHocKy: MaHocKyMoi,
        },
        transaction: t,
      });

      await newClass.update(
        {
          SiSo: count,
        },
        {
          transaction: t,
        },
      );
    });

    res.json({
      message: "Promote students success",
    });
  } catch (error) {
    handleCatch(res, error);
  }
};
