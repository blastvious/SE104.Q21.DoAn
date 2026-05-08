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
  try {
    const { MaLop, MaMonHoc, MaHocKy, MaLoaiHinhKT, Lan, danhSachDiem } =
      req.body;

    if (
      !MaLop ||
      !MaMonHoc ||
      !MaHocKy ||
      !MaLoaiHinhKT ||
      !Lan ||
      !danhSachDiem?.length
    ) {
      res.status(400).json({ message: "Missing required fields!" });
    }

    const [bangDiemMon] = await db.BANGDIEMMON.findOrCreate({
      where: {
        MaLop,
        MaMonHoc,
        MaHocKy,
      },
      defaults: {
        MaBangDiemMon: await CreateMa(db.BANGDIEMMON, "MaBangDiemMon", "BDM"),
      },
    });

    const result = await Promise.all(
      danhSachDiem.map(async ({ MaHS, Diem }) => {
        const [ctBangDiemHS] = await db.CT_BANGDIEMMON_HS.findOrCreate({
          where: {
            MaBangDiemMon: bangDiemMon.MaBangDiemMon,
            MaHS,
          },
          defaults: {
            MaCTBDMHS: await CreateMa(
              db.CT_BANGDIEMMON_HS,
              "MaCTBDMHS",
              "CTBDM",
            ),
            DiemTBMon: 0,
          },
        });

        const [score, created] = await db.CT_BANGDIEMMON_LHKT.findOrCreate({
          where: {
            MaCTBDMHS: ctBangDiemHS.MaCTBDMHS,
            MaLoaiHinhKT,
            Lan,
          },
          defaults: { Diem },
        });

        if (!created) {
          await score.update({ Diem });
        }

        await updateDiemTBMon(ctBangDiemHS.MaCTBDMHS);

        return { MaHS, Diem, status: created ? "created" : "updated" };
      }),
    );

    res.status(200).json({ message: "Bulk entry success", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error!" });
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
const updateDiemTBMon = async (MaCTBDMHS) => {
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

  const loaiMap = {};
  danhSachLHKT.forEach((lhkt) => {
    const key = lhkt.MaLoaiHinhKT;
    if (!loaiMap[key]) {
      loaiMap[key] = { HeSo: lhkt.LOAIHINHKT.HeSo, diems: [] };
    }
    loaiMap[key].diems.push(lhkt.Diem);
  });

  const danhSachTBLoai = Object.values(loaiMap).map(({ HeSo, diems }) => ({
    HeSo,
    Diem: diems.reduce((a, b) => a + b, 0) / diems.length,
  }));

  const diemTBMon = tinhDiemTBMon(danhSachTBLoai);

  await db.CT_BANGDIEMMON_HS.update(
    { DiemTBMon: diemTBMon },
    { where: { MaCTBDMHS } },
  );
};
