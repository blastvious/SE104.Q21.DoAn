import db from "../../libs/db.js";
// Các bảng được dùng: BANGDIEMMON, CT_BANGDIEMMON_HS, CT_BANGDIEMMON_LHKT

const tinhDiemTBMon = (danhSachDiem) => {
  const tongHeSo = danhSachDiem.reduce((acc, d) => acc + d.HeSo, 0);
  const tongDiem = danhSachDiem.reduce((acc, d) => acc + d.HeSo * d.Diem, 0);
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

      await updateDiemTBMon(
        ctBangDiemHS.MaCTBDMHS
      );

      result.push({
        MaHS,
        Diem,
        status: created
          ? "created"
          : "updated",
      });
    }

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
          const tenLoai = lkht.LOAIHINHKT.TenLoaiHinhKT;
          if (!loaiDiemMap[tenLoai]) {
            loaiDiemMap[tenLoai] = {
              MaLoaiHinhKT: lkht.MaLoaiHinhKT,
              TenLoaiHinhKT: tenLoai,
              HeSo: lkht.LOAIHINHKT.HeSo,
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

  if (!danhSachLHKT.length) return;

  const danhSachDiem = danhSachLHKT.map((lhkt) => ({
    HeSo: lhkt.LOAIHINHKT.HeSo,
    Diem: parseFloat(lhkt.Diem),
  }));

  const diemTBMon = tinhDiemTBMon(danhSachDiem);

  await db.CT_BANGDIEMMON_HS.update(
    { DiemTBMon: diemTBMon },
    { where: { MaCTBDMHS } }
  );
};

export const recalculateDiemTBMonByExamType = async (maLoaiHinhKT) => {
  const records = await db.CT_BANGDIEMMON_LHKT.findAll({
    where: { MaLoaiHinhKT: maLoaiHinhKT },
    attributes: ["MaCTBDMHS"],
  });
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