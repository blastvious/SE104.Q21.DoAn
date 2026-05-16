import db from "../../libs/db.js";

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

const generateMaBCTKMon = (tenNamHoc, maHocKy, maMonHoc) => {
    const parts = tenNamHoc.split("-");
    const yearCode = parts.map(y => y.slice(-2)).join("");
    const hkNum = maHocKy.replace(/\D/g, "").padStart(3, "0");
    const mhNum = maMonHoc.replace(/\D/g, "").padStart(3, "0");
    return `${yearCode}${hkNum}${mhNum}`;
};

export const createReport = async (req, res) => {
    try {
        const { TenNamHoc, MaHocKy, MaMonHoc } = req.body;

        if (!TenNamHoc || !MaHocKy || !MaMonHoc) {
            throwHttp("Vui lòng cung cấp đầy đủ TenNamHoc, MaHocKy, MaMonHoc", 400);
        }

        const MaBCTKMon = generateMaBCTKMon(TenNamHoc, MaHocKy, MaMonHoc);

        const [params] = await db.sequelize.query(
            `SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemDatMon'`
        );

        const DiemDatMon = params.length > 0 ? parseFloat(params[0].GiaTri) : 5.0;

        const [classes] = await db.sequelize.query(
            `SELECT l.MaLop, l.SiSo
             FROM LOP l
             JOIN BANGDIEMMON b ON b.MaLop = l.MaLop
             WHERE l.TenNamHoc = :TenNamHoc
               AND b.MaMonHoc = :MaMonHoc
               AND b.MaHocKy = :MaHocKy`,
            { replacements: { TenNamHoc, MaMonHoc, MaHocKy } }
        );

        if (classes.length === 0) {
            throwHttp("Không tìm thấy dữ liệu lớp học cho môn này trong học kỳ và năm học đã chọn", 404);
        }

        let TongSiSo = 0;
        let TongSoLuongDat = 0;
        const details = [];

        for (const cls of classes) {
            const [scoreData] = await db.sequelize.query(
                `SELECT COUNT(cs.MaHS) AS SoLuongDat
                 FROM BANGDIEMMON b
                 JOIN CT_BANGDIEMMON_HS cs ON cs.MaBangDiemMon = b.MaBangDiemMon
                 WHERE b.MaLop = :MaLop
                   AND b.MaMonHoc = :MaMonHoc
                   AND b.MaHocKy = :MaHocKy
                   AND cs.DiemTBMon >= :DiemDatMon`,
                { replacements: { MaLop: cls.MaLop, MaMonHoc, MaHocKy, DiemDatMon } }
            );

            const SoLuongDat = scoreData.length > 0 ? parseInt(scoreData[0].SoLuongDat) : 0;
            const SiSo = cls.SiSo;
            const TiLeDat = SiSo > 0 ? parseFloat(((SoLuongDat * 100.0) / SiSo).toFixed(2)) : 0;

            TongSiSo += SiSo;
            TongSoLuongDat += SoLuongDat;

            details.push({ MaLop: cls.MaLop, SiSo, SoLuongDat, TiLeDat });
        }

        await db.sequelize.transaction(async (t) => {
            await db.sequelize.query(
                `DELETE FROM CT_BAOCAOTONGKETMON WHERE MaBCTKMon = :MaBCTKMon`,
                { replacements: { MaBCTKMon }, transaction: t }
            );
            await db.sequelize.query(
                `DELETE FROM BAOCAOTONGKETMON WHERE MaBCTKMon = :MaBCTKMon`,
                { replacements: { MaBCTKMon }, transaction: t }
            );

            await db.sequelize.query(
                `INSERT INTO BAOCAOTONGKETMON (MaBCTKMon, TenNamHoc, MaMonHoc, MaHocKy, TongSiSo, TongSoLuongDat)
                 VALUES (:MaBCTKMon, :TenNamHoc, :MaMonHoc, :MaHocKy, :TongSiSo, :TongSoLuongDat)`,
                {
                    replacements: { MaBCTKMon, TenNamHoc, MaMonHoc, MaHocKy, TongSiSo, TongSoLuongDat },
                    transaction: t
                }
            );

            for (const d of details) {
                await db.sequelize.query(
                    `INSERT INTO CT_BAOCAOTONGKETMON (MaBCTKMon, MaLop, SiSo, SoLuongDat, TiLeDat)
                     VALUES (:MaBCTKMon, :MaLop, :SiSo, :SoLuongDat, :TiLeDat)`,
                    {
                        replacements: { MaBCTKMon, MaLop: d.MaLop, SiSo: d.SiSo, SoLuongDat: d.SoLuongDat, TiLeDat: d.TiLeDat },
                        transaction: t
                    }
                );
            }
        });

        const [savedDetails] = await db.sequelize.query(
            `SELECT c.*, l.TenLop
             FROM CT_BAOCAOTONGKETMON c
             LEFT JOIN LOP l ON l.MaLop = c.MaLop
             WHERE c.MaBCTKMon = :MaBCTKMon
             ORDER BY l.TenLop`,
            { replacements: { MaBCTKMon } }
        );

        const TongTiLeDat = TongSiSo > 0
            ? parseFloat(((TongSoLuongDat * 100.0) / TongSiSo).toFixed(2))
            : 0;

        res.status(201).json({
            message: "Tạo báo cáo tổng kết môn thành công",
            data: {
                MaBCTKMon,
                TenNamHoc,
                MaMonHoc,
                MaHocKy,
                TongSiSo,
                TongSoLuongDat,
                TongTiLeDat,
                details: savedDetails
            }
        });

    } catch (error) {
        handleCatch(res, error);
    }
};

export const getAllReports = async (req, res) => {
    try {
        const [reports] = await db.sequelize.query(
            `SELECT b.*, m.TenMonHoc, hk.TenHocKy
             FROM BAOCAOTONGKETMON b
             LEFT JOIN MONHOC m ON m.MaMonHoc = b.MaMonHoc
             LEFT JOIN HOCKY hk ON hk.MaHocKy = b.MaHocKy
             ORDER BY b.MaBCTKMon DESC`
        );

        res.json(reports);
    } catch (error) {
        handleCatch(res, error);
    }
};

export const getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        const [header] = await db.sequelize.query(
            `SELECT b.*, m.TenMonHoc, hk.TenHocKy, nh.NgayBatDau, nh.NgayKetThuc
             FROM BAOCAOTONGKETMON b
             LEFT JOIN MONHOC m ON m.MaMonHoc = b.MaMonHoc
             LEFT JOIN HOCKY hk ON hk.MaHocKy = b.MaHocKy
             LEFT JOIN NAMHOC nh ON nh.TenNamHoc = b.TenNamHoc
             WHERE b.MaBCTKMon = :id`,
            { replacements: { id } }
        );

        if (header.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy báo cáo" });
        }

        const [details] = await db.sequelize.query(
            `SELECT c.*, l.TenLop
             FROM CT_BAOCAOTONGKETMON c
             LEFT JOIN LOP l ON l.MaLop = c.MaLop
             WHERE c.MaBCTKMon = :id
             ORDER BY l.TenLop`,
            { replacements: { id } }
        );

        res.json({
            ...header[0],
            details
        });
    } catch (error) {
        handleCatch(res, error);
    }
};
