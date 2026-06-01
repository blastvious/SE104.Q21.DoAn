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

    // Check some score sheets
    const [bdm] = await sequelize.query('SELECT TOP 5 * FROM BANGDIEMMON ORDER BY MaBangDiemMon');
    console.log('\n=== BANGDIEMMON sample ===');
    bdm.forEach(r => console.log(JSON.stringify(r)));

    // Check some score details
    const [ct] = await sequelize.query('SELECT TOP 10 * FROM CT_BANGDIEMMON_HS ORDER BY MaCTBDMHS');
    console.log('\n=== CT_BANGDIEMMON_HS sample ===');
    ct.forEach(r => console.log(JSON.stringify(r)));

    // Check score entries
    const [lhkt] = await sequelize.query('SELECT TOP 20 * FROM CT_BANGDIEMMON_LHKT ORDER BY MaCTBDMHS, MaLoaiHinhKT, Lan');
    console.log('\n=== CT_BANGDIEMMON_LHKT sample ===');
    lhkt.forEach(r => console.log(JSON.stringify(r)));

    // Check study process for one class
    const [qth] = await sequelize.query("SELECT TOP 5 * FROM QUATRINHHOC WHERE MaLop = '2526K01001'");
    console.log('\n=== QUATRINHHOC (2526K01001) sample ===');
    qth.forEach(r => console.log(JSON.stringify(r)));

    await sequelize.close();
  } catch (err) {
    console.error('ERROR:', err);
  }
})();
