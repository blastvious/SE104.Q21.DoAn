import db from "./libs/db.js";

async function verify() {
  try {
    await db.sequelize.authenticate();
    console.log("DB connected\n");

    // Year
    const [years] = await db.sequelize.query("SELECT * FROM NAMHOC WHERE TenNamHoc = '2024-2025'");
    console.log("=== Year 2024-2025 ===");
    console.log(JSON.stringify(years[0]));

    // Classes
    const [classes] = await db.sequelize.query("SELECT * FROM LOP WHERE TenNamHoc = '2024-2025' ORDER BY MaKhoiLop, TenLop");
    console.log(`\n=== Classes (${classes.length}) ===`);
    classes.forEach(c => console.log(`  ${c.MaLop} | ${c.TenLop} | ${c.MaKhoiLop} | SiSo: ${c.SiSo}`));

    // Students
    const [total] = await db.sequelize.query("SELECT COUNT(*) AS cnt FROM HOCSINH WHERE MaHS LIKE '2425%'");
    console.log(`\n=== New students: ${total[0].cnt}`);

    // Per class
    const [perClass] = await db.sequelize.query(`
      SELECT qth.MaLop, l.TenLop, COUNT(*) AS cnt
      FROM QUATRINHHOC qth
      JOIN LOP l ON l.MaLop = qth.MaLop
      WHERE l.TenNamHoc = '2024-2025'
      GROUP BY qth.MaLop, l.TenLop
      ORDER BY l.TenLop
    `);
    console.log("\n=== Students per class ===");
    perClass.forEach(c => console.log(`  ${c.TenLop}: ${c.cnt}`));

    // Score sheets
    const [sheets] = await db.sequelize.query(`
      SELECT COUNT(*) AS cnt FROM BANGDIEMMON bdm
      JOIN LOP l ON l.MaLop = bdm.MaLop
      WHERE l.TenNamHoc = '2024-2025'
    `);
    console.log(`\n=== Score sheets: ${sheets[0].cnt}`);

    // Sample scores
    const [sampleScores] = await db.sequelize.query(`
      SELECT TOP 5 l.TenLop, mh.TenMonHoc, hk.TenHocKy, hs.MaHS, hs.HoTen, ct.DiemTBMon
      FROM CT_BANGDIEMMON_HS ct
      JOIN BANGDIEMMON bdm ON bdm.MaBangDiemMon = ct.MaBangDiemMon
      JOIN LOP l ON l.MaLop = bdm.MaLop
      JOIN MONHOC mh ON mh.MaMonHoc = bdm.MaMonHoc
      JOIN HOCKY hk ON hk.MaHocKy = bdm.MaHocKy
      JOIN HOCSINH hs ON hs.MaHS = ct.MaHS
      WHERE l.TenNamHoc = '2024-2025'
      ORDER BY NEWID()
    `);
    console.log("\n=== Sample scores ===");
    sampleScores.forEach(s => console.log(`  ${s.TenLop} | ${s.TenMonHoc} | ${s.TenHocKy} | ${s.HoTen}: ${s.DiemTBMon}`));

    // Sample individual scores
    const [indivScores] = await db.sequelize.query(`
      SELECT TOP 8 lhkt.MaCTBDMHS, lhkt.MaLoaiHinhKT, lhkt.Lan, lhkt.Diem, lhkt2.TenLoaiHinhKT
      FROM CT_BANGDIEMMON_LHKT lhkt
      JOIN LOAIHINHKT lhkt2 ON lhkt2.MaLoaiHinhKT = lhkt.MaLoaiHinhKT
      WHERE lhkt.MaCTBDMHS LIKE 'CTBDM%'
      ORDER BY lhkt.MaCTBDMHS, lhkt.MaLoaiHinhKT
    `);
    console.log("\n=== Sample individual scores ===");
    indivScores.forEach(s => console.log(`  ${s.MaCTBDMHS} | ${s.TenLoaiHinhKT} L${s.Lan}: ${s.Diem}`));

    // Study process (QUATRINHHOC)
    const [qth] = await db.sequelize.query(`
      SELECT TOP 5 l.TenLop, hs.HoTen, hk.TenHocKy, qth.DiemTBHocKy
      FROM QUATRINHHOC qth
      JOIN LOP l ON l.MaLop = qth.MaLop
      JOIN HOCSINH hs ON hs.MaHS = qth.MaHS
      JOIN HOCKY hk ON hk.MaHocKy = qth.MaHocKy
      WHERE l.TenNamHoc = '2024-2025'
      ORDER BY NEWID()
    `);
    console.log("\n=== Sample DiemTBHocKy ===");
    qth.forEach(s => console.log(`  ${s.TenLop} | ${s.HoTen} | ${s.TenHocKy}: ${s.DiemTBHocKy}`));

    await db.sequelize.close();
  } catch (err) {
    console.error("ERROR:", err);
    await db.sequelize.close();
  }
}

verify();
