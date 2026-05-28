import db from "../../libs/db.js";

export const getPassRate = async (req, res) => {
  try {
    const [params] = await db.sequelize.query(
      `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemDat'`
    );
    const DiemDat = params.length > 0 ? parseFloat(params[0].GiaTri) : 5.0;

    const [rows1] = await db.sequelize.query(`SELECT COUNT(DISTINCT MaHS) AS TongHS FROM HOCSINH`);
    const [rows2] = await db.sequelize.query(
        `SELECT COUNT(DISTINCT MaHS) AS SoDat FROM QUATRINHHOC WHERE DiemTBHocKy >= :DiemDat`,
        { replacements: { DiemDat } }
    );
    const TongHS = rows1[0]?.TongHS ?? 0;
    const SoDat = rows2[0]?.SoDat ?? 0;

    res.json({ TongHS, SoDat, DiemDat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error from server" });
  }
};
