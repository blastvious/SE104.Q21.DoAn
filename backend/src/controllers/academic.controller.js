import db from "../../libs/db.js";
import { Op } from "sequelize";
import { recalculateDiemTBMonByExamType } from "./score.controller.js";
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

//Xem 
export const getAllSubjects = async (req, res) => {

  try {

    const { keyword } = req.query;

    const whereClause = {};

    if (keyword) {

      whereClause.TenMonHoc = {
        [Op.like]: `%${keyword}%`,
      };

    }

    const subjects = await db.MONHOC.findAll({
      where: whereClause,
      order: [["MaMonHoc", "ASC"]],
    });

    res.json(subjects);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error from server",
    });

  }

};

export const getSubjectById = async (req, res) => {

  try {

    const { id } = req.params;

    const subject = await db.MONHOC.findByPk(id);

    if (!subject) {
      return res.status(404).json({
        message: "Không tìm thấy môn học",
      });
    }

    res.json(subject);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error from server",
    });

  }

};


//===========Sua
export const updateSubject = async (req, res) => {

  try {

    const { id } = req.params;

    const { TenMonHoc, HeSo } = req.body;

    const subject = await db.MONHOC.findByPk(id);

    if (!subject) {
      return res.status(404).json({
        message: "Không tìm thấy môn học",
      });
    }

    const trimmedTenMonHoc =
      TenMonHoc?.trim().replace(/\s+/g, " ");

    // check trùng tên
    const existing = await db.MONHOC.findOne({
      where: {
        TenMonHoc: trimmedTenMonHoc,
        MaMonHoc: {
          [Op.ne]: id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "Tên môn học đã tồn tại",
      });
    }

    await subject.update({
      TenMonHoc: trimmedTenMonHoc,
      HeSo,
    });

    res.json(subject);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error from server",
    });

  }

};

//========= Xoa
export const deleteSubject = async (req, res) => {

  try {

    const { id } = req.params;

    const subject = await db.MONHOC.findByPk(id);

    if (!subject) {
      return res.status(404).json({
        message: "Không tìm thấy môn học",
      });
    }

    const scoreCount = await db.BANGDIEMMON.count({
      where: { MaMonHoc: id }
    });

    if (scoreCount > 0) {
      return res.status(409).json({
        message: `Không thể xóa môn học "${subject.TenMonHoc}" vì đã có ${scoreCount} bảng điểm liên quan`
      });
    }

    await subject.destroy();

    res.json({
      message: "Xóa môn học thành công",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Lỗi máy chủ, không thể xóa môn học",
    });

  }

};
// ================================== Loại hình kiểm tra =====================================
//========== Thêm
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
//============= Đọc
export const getAllExamTypes = async (req, res) => {

  try {

    const { keyword } = req.query;

    const whereClause = {};

    if (keyword) {

      whereClause.TenLoaiHinhKT = {
        [Op.like]: `%${keyword}%`,
      };

    }

    const examTypes =
      await db.LOAIHINHKT.findAll({
        where: whereClause,
        order: [["MaLoaiHinhKT", "ASC"]],
      });

    res.json(examTypes);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error from server",
    });

  }

};
export const getExamTypeById = async (req, res) => {

  try {

    const { id } = req.params;

    const examType =
      await db.LOAIHINHKT.findByPk(id);

    if (!examType) {
      return res.status(404).json({
        message: "Không tìm thấy loại hình kiểm tra",
      });
    }

    res.json(examType);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error from server",
    });

  }

};
//=============== Xóa
export const deleteExamType = async (req, res) => {

  try {

    const { id } = req.params;

    const examType =
      await db.LOAIHINHKT.findByPk(id);

    if (!examType) {
      return res.status(404).json({
        message: "Không tìm thấy loại hình kiểm tra",
      });
    }

    const scoreCount = await db.CT_BANGDIEMMON_LHKT.count({
      where: { MaLoaiHinhKT: id }
    });

    if (scoreCount > 0) {
      return res.status(409).json({
        message: `Không thể xóa loại hình kiểm tra vì đã có ${scoreCount} điểm thuộc loại hình này`
      });
    }

    await examType.destroy();

    res.json({
      message: "Xóa loại hình kiểm tra thành công",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error from server",
    });

  }

};

//============== Sửa

export const updateExamType = async (req, res) => {

  try {

    const { id } = req.params;

    const { TenLoaiHinhKT, HeSo } = req.body;

    const examType =
      await db.LOAIHINHKT.findByPk(id);

    if (!examType) {
      return res.status(404).json({
        message: "Không tìm thấy loại hình kiểm tra",
      });
    }

    const trimmedName =
      TenLoaiHinhKT?.trim().replace(/\s+/g, " ");

    const existing =
      await db.LOAIHINHKT.findOne({
        where: {
          TenLoaiHinhKT: trimmedName,
          MaLoaiHinhKT: {
            [Op.ne]: id,
          },
        },
      });

    if (existing) {
      return res.status(400).json({
        message: "Tên loại hình kiểm tra đã tồn tại",
      });
    }

    const heSoChanged = HeSo !== undefined && HeSo !== examType.HeSo;

    await examType.update({
      TenLoaiHinhKT: trimmedName,
      HeSo,
    });

    if (heSoChanged) {
      await recalculateDiemTBMonByExamType(id);
    }

    res.json(examType);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error from server",
    });

  }

};