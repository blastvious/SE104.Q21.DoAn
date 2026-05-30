import db from "../../libs/db.js";

const handleCatch = (res, error) => {
    if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Error from server" });
};

export const reportSemester = async (req, res) => {
    try {
        const { TenNamHoc, MaHocKy } = req.body;

        if (!TenNamHoc || !MaHocKy) {
            return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ TenNamHoc, MaHocKy" });
        }

        const [params] = await db.sequelize.query(
            `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemDat'`
        );
        const DiemDat = params.length > 0 ? parseFloat(params[0].GiaTri) : 5.0;

        const [hkRows] = await db.sequelize.query(
            `SELECT TenHocKy FROM HOCKY WHERE MaHocKy = :MaHocKy`,
            { replacements: { MaHocKy } }
        );
        const TenHocKy = hkRows[0]?.TenHocKy || "";

        const [dsLop] = await db.sequelize.query(
            `SELECT MaLop, TenLop, SiSo
             FROM LOP
             WHERE TenNamHoc = :TenNamHoc
             ORDER BY TenLop`,
            { replacements: { TenNamHoc } }
        );

        if (dsLop.length === 0) {
            return res.json({
                success: true,
                data: {
                    TenHocKy,
                    TongSiSo: 0,
                    TongSoLuongDat: 0,
                    TongTiLeDat: "0.00",
                    details: []
                }
            });
        }

        const details = [];

        for (const lop of dsLop) {
            const [datRows] = await db.sequelize.query(
                `SELECT COUNT(*) AS SoLuongDat
                 FROM (
                     SELECT ct.MaHS,
                            SUM(ct.DiemTBMon * mh.HeSo) / SUM(mh.HeSo) AS DiemTBHocKy
                     FROM CT_BANGDIEMMON_HS ct
                     JOIN BANGDIEMMON bdm ON ct.MaBangDiemMon = bdm.MaBangDiemMon
                     JOIN MONHOC mh       ON bdm.MaMonHoc     = mh.MaMonHoc
                     JOIN QUATRINHHOC q   ON q.MaHS = ct.MaHS AND q.MaLop = bdm.MaLop AND q.MaHocKy = bdm.MaHocKy
                     WHERE bdm.MaLop   = :MaLop
                       AND bdm.MaHocKy = :MaHocKy
                     GROUP BY ct.MaHS
                     HAVING SUM(ct.DiemTBMon * mh.HeSo) / SUM(mh.HeSo) >= :DiemDat
                 ) AS sub`,
                { replacements: { MaLop: lop.MaLop, MaHocKy, DiemDat } }
            );
            
            const SoLuongDat = parseInt(datRows[0]?.SoLuongDat ?? 0);
            const SiSo       = lop.SiSo ?? 0;
            const TiLeDat    = SiSo > 0
                ? parseFloat(((SoLuongDat / SiSo) * 100).toFixed(2))
                : 0;

            details.push({
                TenLop: lop.TenLop,
                SiSo,
                SoLuongDat,
                TiLeDat
            });
        }

        const TongSiSo       = details.reduce((s, x) => s + x.SiSo, 0);
        const TongSoLuongDat = details.reduce((s, x) => s + x.SoLuongDat, 0);
        const TongTiLeDat    = TongSiSo > 0
            ? ((TongSoLuongDat / TongSiSo) * 100).toFixed(2)
            : "0.00";

        res.json({
            success: true,
            data: {
                TenHocKy,
                TongSiSo,
                TongSoLuongDat,
                TongTiLeDat,
                details
            }
        });

    } catch (error) {
        handleCatch(res, error);
    }
};