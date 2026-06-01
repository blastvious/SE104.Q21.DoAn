import db from "./libs/db.js";

async function explore() {
  const [classes] = await db.sequelize.query(
    "SELECT * FROM LOP WHERE TenNamHoc = '2025-2026' ORDER BY MaLop"
  );
  console.log("=== LOP 2025-2026 ===");
  for (const c of classes) {
    const [cnt] = await db.sequelize.query(
      `SELECT COUNT(*) AS n FROM QUATRINHHOC WHERE MaLop = '${c.MaLop}' AND MaHocKy = 'HK001'`
    );
    const [bdm] = await db.sequelize.query(
      `SELECT COUNT(*) AS n FROM BANGDIEMMON WHERE MaLop = '${c.MaLop}'`
    );
    console.log(`${c.MaLop} | ${c.TenLop} | ${c.MaKhoiLop} | SiSo:${c.SiSo} | Students:${cnt[0].n} | Sheets:${bdm[0].n}`);
  }

  // Check for classes with students but no scores
  console.log("\n=== Classes with students but possibly missing subjects ===");
  for (const c of classes) {
    const [cnt] = await db.sequelize.query(
      `SELECT COUNT(*) AS n FROM QUATRINHHOC WHERE MaLop = '${c.MaLop}' AND MaHocKy = 'HK001'`
    );
    if (cnt[0].n === 0) {
      console.log(`${c.TenLop} (${c.MaLop}): no students, skip`);
      continue;
    }

    const [subjects] = await db.sequelize.query("SELECT * FROM MONHOC");
    const [semesters] = await db.sequelize.query("SELECT * FROM HOCKY");

    const [existing] = await db.sequelize.query(
      `SELECT MaMonHoc, MaHocKy FROM BANGDIEMMON WHERE MaLop = '${c.MaLop}'`
    );
    const existingSet = new Set(existing.map(e => `${e.MaMonHoc}_${e.MaHocKy}`));

    let missing = 0;
    for (const sj of subjects) {
      for (const sm of semesters) {
        if (!existingSet.has(`${sj.MaMonHoc}_${sm.MaHocKy}`)) {
          missing++;
        }
      }
    }
    console.log(`${c.TenLop}: ${existing.length} existing, ${missing} missing`);
  }

  await db.sequelize.close();
}

explore().catch(console.error);
