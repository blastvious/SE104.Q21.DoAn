import db from "./libs/db.js";

async function main() {
  try {
    await db.sequelize.authenticate();
    console.log("DB connected\n");

    // Find all classes in 2025-2026 with students in HK1 but missing HK2
    const [classes] = await db.sequelize.query(`
      SELECT DISTINCT l.MaLop, l.TenLop
      FROM LOP l
      JOIN QUATRINHHOC qth ON qth.MaLop = l.MaLop AND qth.MaHocKy = 'HK001'
      WHERE l.TenNamHoc = '2025-2026'
      AND NOT EXISTS (
        SELECT 1 FROM QUATRINHHOC qth2
        WHERE qth2.MaLop = qth.MaLop AND qth2.MaHS = qth.MaHS AND qth2.MaHocKy = 'HK002'
      )
      ORDER BY l.MaLop
    `);
    console.log(`Found ${classes.length} classes missing HK2 records\n`);

    let totalInserted = 0;

    for (const cls of classes) {
      const maLop = cls.MaLop;

      // Get students enrolled in HK1
      const [students] = await db.sequelize.query(`
        SELECT MaHS FROM QUATRINHHOC
        WHERE MaLop = '${maLop}' AND MaHocKy = 'HK001'
      `);

      // Get all BANGDIEMMON for this class in HK2 (subjects with scores)
      const [bdmList] = await db.sequelize.query(`
        SELECT bdm.MaBangDiemMon, mh.HeSo AS MonHeSo
        FROM BANGDIEMMON bdm
        JOIN MONHOC mh ON mh.MaMonHoc = bdm.MaMonHoc
        WHERE bdm.MaLop = '${maLop}' AND bdm.MaHocKy = 'HK002'
      `);

      if (bdmList.length === 0) {
        console.log(`  ${cls.TenLop}: no HK2 score sheets yet, skip`);
        continue;
      }

      // Insert QUATRINHHOC records and calculate DiemTBHocKy
      for (const { MaHS } of students) {
        let totalScore = 0, totalWeight = 0;

        for (const bdm of bdmList) {
          const [sc] = await db.sequelize.query(`
            SELECT DiemTBMon FROM CT_BANGDIEMMON_HS
            WHERE MaBangDiemMon = '${bdm.MaBangDiemMon}' AND MaHS = '${MaHS}'
          `);
          if (sc.length > 0 && sc[0].DiemTBMon != null) {
            totalScore += parseFloat(sc[0].DiemTBMon) * parseFloat(bdm.MonHeSo);
            totalWeight += parseFloat(bdm.MonHeSo);
          }
        }

        const diemTB = totalWeight > 0
          ? Math.round((totalScore / totalWeight) * 100) / 100
          : 0;

        await db.sequelize.query(`
          INSERT INTO QUATRINHHOC (MaLop, MaHS, MaHocKy, DiemTBHocKy)
          VALUES ('${maLop}', '${MaHS}', 'HK002', ${diemTB})
        `);
        totalInserted++;
      }
      console.log(`  ${cls.TenLop}: ${students.length} students`);
    }

    console.log(`\n✅ Done! Inserted ${totalInserted} HK2 records.`);
    await db.sequelize.close();
  } catch (err) {
    console.error("ERROR:", err);
    await db.sequelize.close();
  }
}

main();
