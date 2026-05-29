import db from "../../libs/db.js";
import { Op } from "sequelize";
// Các bảng được dùng: BANGDIEMMON, CT_BANGDIEMMON_HS, CT_BANGDIEMMON_LHKT

const tinhDiemTBMon = (danhSachDiem) => {
  const dsLoc = danhSachDiem.filter((d) => d.Diem != null && !isNaN(d.Diem));
  if (!dsLoc.length) return 0;
  const tongHeSo = dsLoc.reduce((acc, d) => acc + d.HeSo, 0);
  const tongDiem = dsLoc.reduce((acc, d) => acc + d.HeSo * d.Diem, 0);
  if (tongHeSo == 0) return 0;
  return Math.round((tongDiem / tongHeSo) * 10) / 10;
};

// Sinh ma
const CreateMa = async (model, truongMa, prefix) => {
  const last = await model.findOne({ order: [[truongMa, "DESC"]] });
  let stt = 1;
  if (last) {
    const lastNumber = parseInt(last[truongMa].replace(/\D/g, ""));
    stt = lastNumber + 1;
  }
  return `${prefix}${String(stt).padStart(3, "0")}`;
};

// -- SINGLE ENTRY --
export const getScore = async (req, res) => {
  try {
    const { MaLop, MaMonHoc, MaHocKy, MaHS, MaLoaiHinhKT, Lan, Diem } =
      req.body;

    if (
      !MaLop ||
      !MaMonHoc ||
      !MaHocKy ||
      !MaHS ||
      !MaLoaiHinhKT ||
      !Lan ||
      Diem === undefined
    ) {
      return res.status(400).json({ message: "Missing requied fields!" });
    }

    // Kiểm tra năm học đã kết thúc chưa
    const [yearCheck] = await db.sequelize.query(`
      SELECT 1 FROM LOP l
      JOIN NAMHOC nh ON nh.TenNamHoc = l.TenNamHoc
      WHERE l.MaLop = :MaLop AND nh.NgayKetThuc < CAST(GETDATE() AS DATE)
    `, { replacements: { MaLop } });
    if (yearCheck.length > 0) {
      return res.status(403).json({ message: "Không thể nhập điểm cho năm học đã kết thúc" });
    }

    // Kiểm tra điểm trong khoảng cho phép
    const [diemThieuRows] = await db.sequelize.query(
      `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemToiThieu'`
    );
    const [diemDaRows] = await db.sequelize.query(
      `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemToiDa'`
    );
    const diemToiThieu = parseFloat(diemThieuRows[0]?.GiaTri);
    const diemToiDa = parseFloat(diemDaRows[0]?.GiaTri);
    if (!isNaN(diemToiThieu) && Diem < diemToiThieu) {
      return res.status(400).json({ message: `Điểm phải >= ${diemToiThieu}` });
    }
    if (!isNaN(diemToiDa) && Diem > diemToiDa) {
      return res.status(400).json({ message: `Điểm phải <= ${diemToiDa}` });
    }

    // findOrCreate BANGDIEMMON
    const [bangDiemMon] = await db.BANGDIEMMON.findOrCreate({
      where: { MaLop, MaMonHoc, MaHocKy },
      defaults: {
        MaBangDiemMon: await CreateMa(db.BANGDIEMMON, "MaBangDiemMon", "BDM"),
      },
    });

    // findOrCreate CT_BANGDIEMMON_HS
    const [ctBangDiemMonHS] = await db.CT_BANGDIEMMON_HS.findOrCreate({
      where: {
        MaBangDiemMon: bangDiemMon.MaBangDiemMon,
        MaHS,
      },
      defaults: {
        MaCTBDMHS: await CreateMa(db.CT_BANGDIEMMON_HS, "MaCTBDMHS", "CTBDM"),
        DiemTBMon: 0,
      },
    });

    // findOrCreate CT_BANGDIEMMON_LHKT
    const [ctBangDiemMonLHKT, created] =
      await db.CT_BANGDIEMMON_LHKT.findOrCreate({
        where: {
          MaCTBDMHS: ctBangDiemMonHS.MaCTBDMHS,
          MaLoaiHinhKT,
          Lan,
        },
        defaults: { Diem },
      });

    if (!created) {
      await ctBangDiemMonLHKT.update({ Diem });
    }

    // Update DiemTBMon
    await updateDiemTBMon(ctBangDiemMonHS.MaCTBDMHS);

    // Update DiemTBHocKy
    await updateDiemTBHocKy(MaLop, MaHocKy);

    res.status(200).json({
      message: created ? "Score created!" : "Score updated!",
      data: ctBangDiemMonLHKT,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error!" });
  }
};

// -- BULK IMPORT SCORES --
export const bulkImportScores = async (req, res) => {
  console.log(req.body);
  try {
    const {
      MaLop,
      MaMonHoc,
      MaHocKy,
      MaLoaiHinhKT,
      Lan,
      danhSachDiem,
    } = req.body;

    if (
      !MaLop ||
      !MaMonHoc ||
      !MaHocKy ||
      !MaLoaiHinhKT ||
      !Lan ||
      !danhSachDiem?.length
    ) {
      return res.status(400).json({
        message: "Missing required fields!",
      });
    }

    // Kiểm tra tất cả điểm trong khoảng cho phép
    const [diemThieuRows] = await db.sequelize.query(
      `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemToiThieu'`
    );
    const [diemDaRows] = await db.sequelize.query(
      `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemToiDa'`
    );
    const diemToiThieu = parseFloat(diemThieuRows[0]?.GiaTri);
    const diemToiDa = parseFloat(diemDaRows[0]?.GiaTri);
    for (const { MaHS, Diem } of danhSachDiem) {
      if (Diem == null) continue;
      if (!isNaN(diemToiThieu) && Diem < diemToiThieu) {
        return res.status(400).json({ message: `Điểm của HS ${MaHS} phải >= ${diemToiThieu}` });
      }
      if (!isNaN(diemToiDa) && Diem > diemToiDa) {
        return res.status(400).json({ message: `Điểm của HS ${MaHS} phải <= ${diemToiDa}` });
      }
    }

    const [bangDiemMon] = await db.BANGDIEMMON.findOrCreate({
      where: {
        MaLop,
        MaMonHoc,
        MaHocKy,
      },
      defaults: {
        MaBangDiemMon: await CreateMa(
          db.BANGDIEMMON,
          "MaBangDiemMon",
          "BDM"
        ),
      },
    });

    const result = [];

    for (const { MaHS, Diem } of danhSachDiem) {
      const [ctBangDiemHS] =
        await db.CT_BANGDIEMMON_HS.findOrCreate({
          where: {
            MaBangDiemMon: bangDiemMon.MaBangDiemMon,
            MaHS,
          },
          defaults: {
            MaCTBDMHS: await CreateMa(
              db.CT_BANGDIEMMON_HS,
              "MaCTBDMHS",
              "CTBDM"
            ),
            DiemTBMon: 0,
          },
        });

      let status;

      if (Diem == null) {
        await db.CT_BANGDIEMMON_LHKT.destroy({
          where: {
            MaCTBDMHS: ctBangDiemHS.MaCTBDMHS,
            MaLoaiHinhKT,
            Lan,
          },
        });
        status = "deleted";
      } else {
        const [score, created] =
          await db.CT_BANGDIEMMON_LHKT.findOrCreate({
            where: {
              MaCTBDMHS: ctBangDiemHS.MaCTBDMHS,
              MaLoaiHinhKT,
              Lan,
            },
            defaults: {
              Diem: Number(Diem)
            },
          });

        if (!created) {
          await score.update({
            Diem: Number(Diem)
          });
        }
        status = created ? "created" : "updated";
      }

      await updateDiemTBMon(
        ctBangDiemHS.MaCTBDMHS
      );

      result.push({
        MaHS,
        Diem,
        status,
      });
    }

    await updateDiemTBHocKy(MaLop, MaHocKy);

    return res.status(200).json({
      message: "Bulk entry success",
      data: result,
    });

  } catch (error) {

    console.error("BULK SCORE ERROR:", error);

    return res.status(500).json({
      message: error.message || "Internal server error!",
    });
  }
};

// -- GET BANGDIEMMON --
export const getBangDiemMon = async (req, res) => {
  try {
    const { MaLop, MaMonHoc, MaHocKy } = req.query;

    if (!MaLop || !MaMonHoc || !MaHocKy) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    const bangDiemMon = await db.BANGDIEMMON.findOne({
      where: { MaLop, MaMonHoc, MaHocKy },
    });

    if (!bangDiemMon) {
      return res
        .status(404)
        .json({ message: "The grade sheet does not exist." });
    }

    const ctBangDiemHS = await db.CT_BANGDIEMMON_HS.findAll({
      where: {
        MaBangDiemMon: bangDiemMon.MaBangDiemMon,
      },
      include: [
        {
          model: db.HOCSINH,
          attributes: ["MaHS", "HoTen"],
        },
      ],
    });

    //JSON phan cap: HocSinh -> LoaiDiem -> DSDiem
    const result = await Promise.all(
      ctBangDiemHS.map(async (ct) => {
        const danhSachLHKT = await db.CT_BANGDIEMMON_LHKT.findAll({
          where: { MaCTBDMHS: ct.MaCTBDMHS },
          include: [
            {
              model: db.LOAIHINHKT,
              attributes: ["MaLoaiHinhKT", "TenLoaiHinhKT", "HeSo"],
            },
          ],
        });

        const loaiDiemMap = {};
        danhSachLHKT.forEach((lkht) => {
          const tenLoai = lkht.LOAIHINHKT?.TenLoaiHinhKT ?? "Không xác định";
          if (!loaiDiemMap[tenLoai]) {
            loaiDiemMap[tenLoai] = {
              MaLoaiHinhKT: lkht.MaLoaiHinhKT,
              TenLoaiHinhKT: tenLoai,
              HeSo: lkht.LOAIHINHKT?.HeSo ?? 1,
              danhSachDiem: [],
            };
          }

          loaiDiemMap[tenLoai].danhSachDiem.push({
            Lan: lkht.Lan,
            Diem: lkht.Diem,
          });
        });

        return {
          MaHS: ct.MaHS,
          HoTen: ct.HOCSINH?.HoTen,
          DiemTBMon: ct.DiemTBMon,
          loaidiem: Object.values(loaiDiemMap),
        };
      }),
    );

    res.status(200).json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error!" });
  }
};

// -- Logic tinh DiemTBMon
export const updateDiemTBMon = async (MaCTBDMHS) => {
  const danhSachLHKT = await db.CT_BANGDIEMMON_LHKT.findAll({
    where: { MaCTBDMHS },
    include: [
      {
        model: db.LOAIHINHKT,
        attributes: ["HeSo"],
      },
    ],
  });

  const danhSachDiem = danhSachLHKT
    .map((lhkt) => ({
      HeSo: lhkt.LOAIHINHKT?.HeSo ?? 1,
      Diem: parseFloat(lhkt.Diem),
    }))
    .filter((d) => !isNaN(d.Diem));

  if (!danhSachDiem.length) {
    await db.CT_BANGDIEMMON_HS.update(
      { DiemTBMon: 0 },
      { where: { MaCTBDMHS } }
    );
    return;
  }

  const diemTBMon = tinhDiemTBMon(danhSachDiem);

  await db.CT_BANGDIEMMON_HS.update(
    { DiemTBMon: diemTBMon },
    { where: { MaCTBDMHS } }
  );
};

const updateDiemTBHocKy = async (MaLop, MaHocKy) => {
  const records = await db.QUATRINHHOC.findAll({ where: { MaLop, MaHocKy } });
  if (!records.length) return;

  const bangDiemMonList = await db.BANGDIEMMON.findAll({
    where: { MaLop, MaHocKy },
    include: [{ model: db.MONHOC, attributes: ["MaMonHoc", "HeSo"] }],
  });
  if (!bangDiemMonList.length) return;

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
    return { MaHS: record.MaHS, DiemTBHocKy: diemTB };
  });

  await Promise.all(
    results.map((r) =>
      db.QUATRINHHOC.update(
        { DiemTBHocKy: r.DiemTBHocKy },
        { where: { MaHS: r.MaHS, MaLop, MaHocKy } },
      ),
    ),
  );
};

export const recalculateDiemTBMonByExamType = async (maLoaiHinhKT) => {
  const [records] = await db.sequelize.query(`
    SELECT DISTINCT lhkt.MaCTBDMHS
    FROM CT_BANGDIEMMON_LHKT lhkt
    JOIN CT_BANGDIEMMON_HS hs ON hs.MaCTBDMHS = lhkt.MaCTBDMHS
    JOIN BANGDIEMMON bdm ON bdm.MaBangDiemMon = hs.MaBangDiemMon
    JOIN LOP l ON l.MaLop = bdm.MaLop
    JOIN NAMHOC nh ON nh.TenNamHoc = l.TenNamHoc
    WHERE lhkt.MaLoaiHinhKT = :maLoaiHinhKT
      AND nh.NgayKetThuc >= CAST(GETDATE() AS DATE)
  `, { replacements: { maLoaiHinhKT } });

  const uniqueIds = [...new Set(records.map((r) => r.MaCTBDMHS))];
  for (const maCTBDMHS of uniqueIds) {
    await updateDiemTBMon(maCTBDMHS);
  }
};

export const recalculateAllDiemTBMon = async (req, res) => {
  try {
    // Lấy tất cả MaLoaiHinhKT đang có trong hệ thống
    const allLoai = await db.LOAIHINHKT.findAll({
      attributes: ["MaLoaiHinhKT"],
    });

    for (const loai of allLoai) {
      await recalculateDiemTBMonByExamType(loai.MaLoaiHinhKT);
    }

    res.status(200).json({ message: "Recalculate all DiemTBMon success!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error!" });
  }
};