const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('QLHS', 'THAIAN', 'Thaian09122006@u', {
  host: 'localhost',
  dialect: 'mssql',
  logging: false,
  dialectOptions: {
    options: { encrypt: false, trustServerCertificate: true }
  }
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const [years] = await sequelize.query('SELECT * FROM NAMHOC');
    console.log('\n=== NAMHOC ===');
    years.forEach(y => console.log(JSON.stringify(y)));

    const [grades] = await sequelize.query('SELECT * FROM KHOILOP');
    console.log('\n=== KHOILOP ===');
    grades.forEach(g => console.log(JSON.stringify(g)));

    const [classes] = await sequelize.query("SELECT * FROM LOP WHERE TenNamHoc = '2025-2026' ORDER BY MaKhoiLop, TenLop");
    console.log('\n=== LOP (2025-2026) ===');
    classes.forEach(c => console.log(JSON.stringify(c)));

    const [subjects] = await sequelize.query('SELECT * FROM MONHOC');
    console.log('\n=== MONHOC ===');
    subjects.forEach(s => console.log(JSON.stringify(s)));

    const [examTypes] = await sequelize.query('SELECT * FROM LOAIHINHKT');
    console.log('\n=== LOAIHINHKT ===');
    examTypes.forEach(e => console.log(JSON.stringify(e)));

    const [semesters] = await sequelize.query('SELECT * FROM HOCKY');
    console.log('\n=== HOCKY ===');
    semesters.forEach(s => console.log(JSON.stringify(s)));

    const [counts] = await sequelize.query(`
      SELECT qth.MaLop, l.TenLop, l.MaKhoiLop, COUNT(*) AS SoLuong
      FROM QUATRINHHOC qth
      JOIN LOP l ON l.MaLop = qth.MaLop
      WHERE l.TenNamHoc = '2025-2026'
      GROUP BY qth.MaLop, l.TenLop, l.MaKhoiLop
      ORDER BY l.MaKhoiLop, l.TenLop
    `);
    console.log('\n=== STUDENT COUNT PER CLASS (2025-2026) ===');
    counts.forEach(c => console.log(JSON.stringify(c)));

    const [students] = await sequelize.query('SELECT TOP 10 * FROM HOCSINH ORDER BY MaHS');
    console.log('\n=== HOCSINH sample ===');
    students.forEach(s => console.log(JSON.stringify(s)));

    const [maxClass] = await sequelize.query("SELECT MAX(MaLop) AS maxId FROM LOP WHERE TenNamHoc = '2025-2026'");
    console.log('\n=== Max MaLop ===', JSON.stringify(maxClass));

    const [maxStudentId] = await sequelize.query('SELECT MAX(MaHS) AS maxId FROM HOCSINH');
    console.log('\n=== Max MaHS ===', JSON.stringify(maxStudentId));

    const [maxBDM] = await sequelize.query('SELECT MAX(MaBangDiemMon) AS maxId FROM BANGDIEMMON');
    console.log('\n=== Max MaBangDiemMon ===', JSON.stringify(maxBDM));

    const [maxCTBDM] = await sequelize.query('SELECT MAX(MaCTBDMHS) AS maxId FROM CT_BANGDIEMMON_HS');
    console.log('\n=== Max MaCTBDMHS ===', JSON.stringify(maxCTBDM));

    await sequelize.close();
  } catch (err) {
    console.error('ERROR:', err);
  }
})();
