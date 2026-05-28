import db from "../libs/db.js";

export const autoFinalizeYears = async () => {
    try {
        // Thêm cột DaKetThuc nếu chưa có
        try {
            await db.sequelize.query(`
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'NAMHOC' AND COLUMN_NAME = 'DaKetThuc')
                ALTER TABLE NAMHOC ADD DaKetThuc BIT DEFAULT 0 NOT NULL
            `);
        } catch (_) { }

        // Khôi phục DaKetThuc = 0 nếu ngày kết thúc đã được gia hạn
        await db.sequelize.query(`
            UPDATE NAMHOC SET DaKetThuc = 0
            WHERE NgayKetThuc >= CAST(GETDATE() AS DATE) AND DaKetThuc = 1
        `);

        const [years] = await db.sequelize.query(`
            SELECT TenNamHoc FROM NAMHOC
            WHERE NgayKetThuc < CAST(GETDATE() AS DATE) AND (DaKetThuc IS NULL OR DaKetThuc = 0)
        `);

        for (const year of years) {
            const tenNam = year.TenNamHoc;

            // Lấy tất cả học kỳ có dữ liệu trong năm này
            const [semesters] = await db.sequelize.query(`
                SELECT DISTINCT qh.MaHocKy
                FROM QUATRINHHOC qh
                JOIN LOP l ON l.MaLop = qh.MaLop
                WHERE l.TenNamHoc = :tenNam
            `, { replacements: { tenNam } });

            for (const s of semesters) {
                const maHK = s.MaHocKy;
                // Tính DiemTBHocKy cho tất cả lớp trong học kỳ này
                const [dsLop] = await db.sequelize.query(`
                    SELECT DISTINCT qh.MaLop
                    FROM QUATRINHHOC qh
                    JOIN LOP l ON l.MaLop = qh.MaLop
                    WHERE qh.MaHocKy = :maHK AND l.TenNamHoc = :tenNam
                `, { replacements: { maHK, tenNam } });

                for (const lop of dsLop) {
                    const maLop = lop.MaLop;
                    const [records, bangDiemMonList] = await Promise.all([
                        db.QUATRINHHOC.findAll({ where: { MaLop: maLop, MaHocKy: maHK } }),
                        db.BANGDIEMMON.findAll({
                            where: { MaLop: maLop, MaHocKy: maHK },
                            include: [{ model: db.MONHOC, attributes: ["MaMonHoc", "HeSo"] }],
                        }),
                    ]);

                    if (!records.length || !bangDiemMonList.length) continue;

                    const maBangDiemMonList = bangDiemMonList.map(b => b.MaBangDiemMon);
                    const maHSList = records.map(r => r.MaHS);

                    const allScores = await db.CT_BANGDIEMMON_HS.findAll({
                        where: {
                            MaBangDiemMon: maBangDiemMonList,
                            MaHS: maHSList,
                        },
                    });

                    const scoreMap = new Map(allScores.map(s => [`${s.MaBangDiemMon}_${s.MaHS}`, s]));
                    const heSoMap = new Map(bangDiemMonList.map(b => [b.MaBangDiemMon, b.MONHOC?.HeSo ?? 1]));

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

                        const diemTB = totalWeight > 0
                            ? Math.round((totalScore / totalWeight) * 100) / 100
                            : 0.0;

                        await db.QUATRINHHOC.update(
                            { DiemTBHocKy: diemTB },
                            { where: { MaHS: record.MaHS, MaLop: maLop, MaHocKy: maHK } },
                        );
                    }
                }
            }

            // Đánh dấu năm học đã kết thúc
            await db.sequelize.query(`
                UPDATE NAMHOC SET DaKetThuc = 1 WHERE TenNamHoc = :tenNam
            `, { replacements: { tenNam } });

            console.log(`[AutoFinalize] Đã kết thúc năm học ${tenNam}, điểm TB đã được lưu.`);
        }

        if (years.length > 0) {
            console.log(`[AutoFinalize] Hoàn tất kết thúc ${years.length} năm học.`);
        }
    } catch (error) {
        console.error("[AutoFinalize] Lỗi:", error.message);
    }
};
