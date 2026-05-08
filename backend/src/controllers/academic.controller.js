import db from "../../libs/db.js";
import { Op } from "sequelize";
//Các bảng liên quan: MONHOC, LOAIHINHKT.

// ==================================== Môn học =======================================
export const createSubject = async (req, res) => {
  try {
    const { TenMonHoc, HeSo } = req.body;
    const trimmedTenMonHoc = TenMonHoc?.trim().replace(/\s+/g, " ");

    // ======== check trùng tên môn học =========
    const existing = await db.MONHOC.findOne({
      where: { TenMonHoc: trimmedTenMonHoc },
    });

    if (existing) {
      return res.status(400).json({
        status: "Error",
        message: "Môn học đã tồn tại",
      });
    }

    // ============= tạo MaMonHoc ===========
    const lastSubject = await db.MONHOC.findOne({
      where: {
        MaMonHoc: { [Op.like]: "MH%" },
      },
      // Sắp xếp giảm dần theo mã, bản ghi mới nhất sẽ ở trên cùng
      order: [["MaMonHoc", "DESC"]],
    });
    let stt = 1;
    if (lastSubject) {
      const lastNumber = parseInt(lastSubject.MaMonHoc.slice(2));
      stt = lastNumber + 1;
    }

    const MaMonHoc = `MH${String(stt).padStart(3, "0")}`;
    const newSubject = await db.MONHOC.create({
      MaMonHoc,
      TenMonHoc: trimmedTenMonHoc,
      HeSo,
    });
    res.status(201).json(newSubject);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error from server" });
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const subject = await db.MONHOC.findAll();
    res.json(subject);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error from server" });
  }
};

// ================================== Loại hình kiểm tra =====================================
export const createExamType = async (req, res) => {
  try {
    const { TenLoaiHinhKT, HeSo } = req.body;
    // chuẩn hóa tên loại hình kiểm tra
    const trimmedTenLoaiHinhKT = TenLoaiHinhKT?.trim().replace(/\s+/g, " ");

    // ======== check trùng tên loại hình kiểm tra =========
    const existing = await db.LOAIHINHKT.findOne({
      where: { TenLoaiHinhKT: trimmedTenLoaiHinhKT },
    });

    if (existing) {
      return res.status(400).json({
        status: "Error",
        message: "Loại hình kiểm tra đã tồn tại",
      });
    }

    // ============= tạo MaLoaiHinhKT ==============
    const lastExamType = await db.LOAIHINHKT.findOne({
      where: {
        MaLoaiHinhKT: { [Op.like]: "LHKT%" },
      },
      order: [["MaLoaiHinhKT", "DESC"]],
    });

    let stt = 1;
    if (lastExamType) {
      const lastNumber = parseInt(lastExamType.MaLoaiHinhKT.slice(4));
      stt = lastNumber + 1;
    }

    const MaLoaiHinhKT = `LHKT${String(stt).padStart(2, "0")}`;
    const newSubject = await db.LOAIHINHKT.create({
      MaLoaiHinhKT,
      TenLoaiHinhKT: trimmedTenLoaiHinhKT,
      HeSo,
    });
    res.status(201).json(newSubject);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error from server" });
  }
};

export const getAllExamTypes = async (req, res) => {
  try {
    const examType = await db.LOAIHINHKT.findAll();
    res.json(examType);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error from server" });
  }
};
