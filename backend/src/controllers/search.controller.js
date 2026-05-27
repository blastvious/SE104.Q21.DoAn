import db from "../../libs/db.js";
 
const handleCatch = (res, error) => {
    if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Error from server" });
};
 
export const suggestStudent = async (req, res) => {
    try {
        const { ten, lop, sdt } = req.query;

        if (!ten && !lop && !sdt) {
            return res.status(400).json({ message: "Thiếu tham số tìm kiếm!" });
        }

        let whereClause = "WHERE 1=1";
        const replacements = {};

        if (ten) { whereClause += " AND hs.HoTen LIKE :ten"; replacements.ten = `%${ten}%`; }
        if (lop) { whereClause += " AND l.TenLop LIKE :lop"; replacements.lop = `%${lop}%`; }
        if (sdt) { whereClause += " AND hs.SoDienThoai LIKE :sdt"; replacements.sdt = `%${sdt}%`; }

        const [results] = await db.sequelize.query(
            `SELECT TOP 6           
                hs.MaHS,
                hs.HoTen,
                hs.SoDienThoai,
                MAX(l.TenLop) AS TenLop
            FROM HOCSINH hs
            JOIN QUATRINHHOC qth ON qth.MaHS = hs.MaHS
            JOIN LOP l ON l.MaLop = qth.MaLop
            ${whereClause}
            GROUP BY hs.MaHS, hs.HoTen, hs.SoDienThoai
            ORDER BY hs.HoTen`,
            { replacements }
        );

        res.json({ success: true, data: results });

    } catch (error) {
        handleCatch(res, error);
    }
};

export const searchStudent = async (req, res) => {
    try {
        const { ten, lop, sdt } = req.query;
 
        if (!ten || !lop || !sdt) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ họ tên, lớp và số điện thoại để tìm kiếm!" });
        }
 
        let whereClause = "WHERE 1=1";
        const replacements = {};
 
        if (ten) {
            whereClause += " AND hs.HoTen LIKE :ten";
            replacements.ten = `%${ten}%`;
        }
 
        if (lop) {
            whereClause += " AND l.TenLop LIKE :lop";
            replacements.lop = `%${lop}%`;
        }
 
        if (sdt) {
            whereClause += " AND hs.SoDienThoai LIKE :sdt";
            replacements.sdt = `%${sdt}%`;
        }

        const [results] = await db.sequelize.query(
            `SELECT
                hs.MaHS,
                hs.HoTen,
                hs.GioiTinh,
                hs.NgaySinh,
                hs.DiaChi,
                hs.Email,
                hs.SoDienThoai,
                MAX(l.TenLop) AS TenLop,
                MAX(l.MaLop)  AS MaLop
            FROM HOCSINH hs
            JOIN QUATRINHHOC qth ON qth.MaHS = hs.MaHS
            JOIN LOP l ON l.MaLop = qth.MaLop
            ${whereClause}
            GROUP BY
                hs.MaHS,
                hs.HoTen,
                hs.GioiTinh,
                hs.NgaySinh,
                hs.DiaChi,
                hs.Email,
                hs.SoDienThoai
            ORDER BY hs.HoTen`,
            { replacements }
        );
 
        res.json({ success: true, data: results });
 
    } catch (error) {
        handleCatch(res, error);
    }
};
 
export const getStudentDetail = async (req, res) => {
    try {
        const { maHS } = req.params;
 
        const [results] = await db.sequelize.query(
            `SELECT
                hs.MaHS,
                hs.HoTen,
                hs.GioiTinh,
                hs.NgaySinh,
                hs.DiaChi,
                hs.Email,
                hs.SoDienThoai,
                l.TenLop,
                l.MaLop
             FROM HOCSINH hs
             JOIN QUATRINHHOC qth ON qth.MaHS = hs.MaHS
             JOIN LOP l ON l.MaLop = qth.MaLop
             WHERE hs.MaHS = :maHS`,
            { replacements: { maHS } }
        );
 
        if (!results.length) {
            return res.status(404).json({ message: "Không tìm thấy học sinh" });
        }
 
        res.json({ success: true, data: results[0] });
 
    } catch (error) {
        handleCatch(res, error);
    }
};




export const getStudentHistory = async (req, res) => {
    try {
        const { maHS } = req.params;

        // Lấy danh sách học kỳ
        const [rows] = await db.sequelize.query(
            `SELECT
                qth.MaLop,
                l.TenLop,
                qth.MaHocKy,
                hk.TenHocKy,
                l.TenNamHoc
             FROM QUATRINHHOC qth
             JOIN LOP l    ON l.MaLop    = qth.MaLop
             JOIN HOCKY hk ON hk.MaHocKy = qth.MaHocKy
             WHERE qth.MaHS = :maHS
             ORDER BY l.TenNamHoc DESC, hk.MaHocKy ASC`,
            { replacements: { maHS } }
        );

        // Tính DiemTBHocKy realtime từ DiemTBMon
        const results = await Promise.all(rows.map(async (row) => {
            const [scoreRows] = await db.sequelize.query(
                `SELECT cs.DiemTBMon
                 FROM BANGDIEMMON bdm
                 JOIN CT_BANGDIEMMON_HS cs ON cs.MaBangDiemMon = bdm.MaBangDiemMon
                 WHERE bdm.MaLop   = :maLop
                   AND bdm.MaHocKy = :maHocKy
                   AND cs.MaHS     = :maHS
                   AND cs.DiemTBMon IS NOT NULL`,
                { replacements: { maLop: row.MaLop, maHocKy: row.MaHocKy, maHS } }
            );

            const monCoDiem = scoreRows.filter(r => r.DiemTBMon != null && parseFloat(r.DiemTBMon) > 0);
            const diemTBHocKy = monCoDiem.length > 0
                ? Math.round(
                    monCoDiem.reduce((acc, r) => acc + parseFloat(r.DiemTBMon), 0)
                    / monCoDiem.length * 10
                  ) / 10
                : 0;

            return { ...row, DiemTBHocKy: diemTBHocKy };
        }));

        res.json({ success: true, data: results });

    } catch (error) {
        handleCatch(res, error);
    }
};
 
// export const getStudentScore = async (req, res) => {
//     try {
//         const { maHS } = req.params;
//         const { maLop, maHocKy } = req.query;
 
//         if (!maLop || !maHocKy) {
//             return res.status(400).json({ message: "Vui lòng cung cấp maLop và maHocKy" });
//         }
 
//         const [qthRows] = await db.sequelize.query(
//             `SELECT qth.DiemTBHocKy, l.TenLop, l.TenNamHoc, hk.TenHocKy
//              FROM QUATRINHHOC qth
//              JOIN LOP l    ON l.MaLop    = qth.MaLop
//              JOIN HOCKY hk ON hk.MaHocKy = qth.MaHocKy
//              WHERE qth.MaHS    = :maHS
//                AND qth.MaLop   = :maLop
//                AND qth.MaHocKy = :maHocKy`,
//             { replacements: { maHS, maLop, maHocKy } }
//         );
 
//         const [scoreRows] = await db.sequelize.query(
//             `SELECT
//                 m.TenMonHoc,
//                 m.HeSo,
//                 lhkt_tx1.Diem  AS TX1,
//                 lhkt_tx2.Diem  AS TX2,
//                 lhkt_gk.Diem   AS GK,
//                 lhkt_ck.Diem   AS CK,
//                 cs.DiemTBMon
//              FROM BANGDIEMMON bdm
//              JOIN CT_BANGDIEMMON_HS cs  ON cs.MaBangDiemMon  = bdm.MaBangDiemMon
//              JOIN MONHOC m              ON m.MaMonHoc         = bdm.MaMonHoc
//              JOIN LOAIHINHKT lhkt_tx1_def ON lhkt_tx1_def.TenLoaiHinhKT = N'Thường xuyên 1'
//              JOIN LOAIHINHKT lhkt_tx2_def ON lhkt_tx2_def.TenLoaiHinhKT = N'Thường xuyên 2'
//              JOIN LOAIHINHKT lhkt_gk_def  ON lhkt_gk_def.TenLoaiHinhKT  = N'Giữa kỳ'
//              JOIN LOAIHINHKT lhkt_ck_def  ON lhkt_ck_def.TenLoaiHinhKT  = N'Cuối kỳ'
//              LEFT JOIN CT_BANGDIEMMON_LHKT lhkt_tx1
//                 ON lhkt_tx1.MaCTBDMHS = cs.MaCTBDMHS
//                AND lhkt_tx1.MaLoaiHinhKT = lhkt_tx1_def.MaLoaiHinhKT
//                AND lhkt_tx1.Lan = 1
//              LEFT JOIN CT_BANGDIEMMON_LHKT lhkt_tx2
//                 ON lhkt_tx2.MaCTBDMHS = cs.MaCTBDMHS
//                AND lhkt_tx2.MaLoaiHinhKT = lhkt_tx2_def.MaLoaiHinhKT
//                AND lhkt_tx2.Lan = 1
//              LEFT JOIN CT_BANGDIEMMON_LHKT lhkt_gk
//                 ON lhkt_gk.MaCTBDMHS = cs.MaCTBDMHS
//                AND lhkt_gk.MaLoaiHinhKT = lhkt_gk_def.MaLoaiHinhKT
//                AND lhkt_gk.Lan = 1
//              LEFT JOIN CT_BANGDIEMMON_LHKT lhkt_ck
//                 ON lhkt_ck.MaCTBDMHS = cs.MaCTBDMHS
//                AND lhkt_ck.MaLoaiHinhKT = lhkt_ck_def.MaLoaiHinhKT
//                AND lhkt_ck.Lan = 1
//              WHERE bdm.MaLop    = :maLop
//                AND bdm.MaHocKy  = :maHocKy
//                AND cs.MaHS      = :maHS
//              ORDER BY m.TenMonHoc`,
//             { replacements: { maHS, maLop, maHocKy } }
//         );
 
//         res.json({
//             success: true,
//             data: {
//                 thongTinHocKy: qthRows[0] || null,
//                 chiTietDiem:   scoreRows
//             }
//         });
 
//     } catch (error) {
//         handleCatch(res, error);
//     }
// };
 

export const getStudentScore = async (req, res) => {
    try {
        const { maHS } = req.params;
        const { maLop, maHocKy } = req.query;
 
        if (!maLop || !maHocKy) {
            return res.status(400).json({ message: "Vui lòng cung cấp maLop và maHocKy" });
        }
 
        // 1. Lấy thông tin chung của học kỳ
        const [qthRows] = await db.sequelize.query(
            `SELECT qth.DiemTBHocKy, l.TenLop, l.TenNamHoc, hk.TenHocKy
             FROM QUATRINHHOC qth
             JOIN LOP l    ON l.MaLop    = qth.MaLop
             JOIN HOCKY hk ON hk.MaHocKy = qth.MaHocKy
             WHERE qth.MaHS    = :maHS
               AND qth.MaLop   = :maLop
               AND qth.MaHocKy = :maHocKy`,
            { replacements: { maHS, maLop, maHocKy } }
        );
 
        // 2. Lấy toàn bộ các đầu điểm hiện có (Dạng dọc - Row-based)
        const [scoreRows] = await db.sequelize.query(
            `SELECT
                m.TenMonHoc,
                m.HeSo,
                lhkt.TenLoaiHinhKT,
                ct_lhkt.Lan,
                ct_lhkt.Diem,
                cs.DiemTBMon
             FROM BANGDIEMMON bdm
             JOIN CT_BANGDIEMMON_HS cs      ON cs.MaBangDiemMon  = bdm.MaBangDiemMon
             JOIN MONHOC m                  ON m.MaMonHoc         = bdm.MaMonHoc
             JOIN CT_BANGDIEMMON_LHKT ct_lhkt ON ct_lhkt.MaCTBDMHS  = cs.MaCTBDMHS
             JOIN LOAIHINHKT lhkt           ON lhkt.MaLoaiHinhKT  = ct_lhkt.MaLoaiHinhKT
             WHERE bdm.MaLop    = :maLop
               AND bdm.MaHocKy  = :maHocKy
               AND cs.MaHS      = :maHS
             ORDER BY m.TenMonHoc`,
            { replacements: { maHS, maLop, maHocKy } }
        );
 
        // 3. Xử lý logic Pivot bằng Javascript để gom các dòng điểm thành cấu trúc môn học
        const monHocMap = {};
        const allColumns = []; // Thu thập tất cả tên cột theo thứ tự xuất hiện

        scoreRows.forEach(row => {
            const { TenMonHoc, HeSo, TenLoaiHinhKT, Lan, Diem, DiemTBMon } = row;

            // Tạo key cột: nếu Lần > 1 thì thêm số (vd: "Miệng 2")
            const colKey = Lan && Lan > 1 ? `${TenLoaiHinhKT} ${Lan}` : TenLoaiHinhKT;

            if (!allColumns.includes(colKey)) {
                allColumns.push(colKey);
            }

            if (!monHocMap[TenMonHoc]) {
                monHocMap[TenMonHoc] = { TenMonHoc, HeSo, DiemTBMon };
            }

            if (monHocMap[TenMonHoc][colKey] === null || monHocMap[TenMonHoc][colKey] === undefined) {
                monHocMap[TenMonHoc][colKey] = Diem;
            }
        });

        // Chuyển Map thành mảng để trả về cho Frontend
        const chiTietDiem = Object.values(monHocMap);

        // 4. Tính ĐTB Học Kỳ trực tiếp từ DiemTBMon các môn
        // Không dùng DiemTBHocKy trong QUATRINHHOC vì chỉ cập nhật khi chạy semesterSummary
        const monCoĐiem = chiTietDiem.filter(m => m.DiemTBMon != null && parseFloat(m.DiemTBMon) > 0);
        const diemTBHocKy = monCoĐiem.length > 0
            ? Math.round(
                monCoĐiem.reduce((acc, m) => acc + parseFloat(m.DiemTBMon), 0)
                / monCoĐiem.length * 10
              ) / 10
            : 0;

        res.json({
            success: true,
            data: {
                thongTinHocKy: {
                    ...(qthRows[0] || {}),
                    DiemTBHocKy: diemTBHocKy   // override giá trị 0 từ DB
                },
                columns: allColumns,   // danh sách cột động để frontend render header
                chiTietDiem
            }
        });
 
    } catch (error) {
        handleCatch(res, error);
    }
};