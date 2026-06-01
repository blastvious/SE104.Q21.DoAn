const db = require('./backend/libs/db.js');
(async () => {
  try {
    await new Promise(r => setTimeout(r, 3000));
    const seq = db.sequelize || (db.default && db.default.sequelize);
    if (!seq) { console.log('No sequelize found'); return; }
    
    let r;
    r = await seq.query("SELECT COUNT(*) AS cnt FROM BAOCAOTONGKETMON");
    console.log('BAOCAOTONGKETMON count:', JSON.stringify(r[0]));
    
    r = await seq.query("SELECT TOP 10 * FROM BAOCAOTONGKETMON ORDER BY MaBCTKMon DESC");
    console.log('Top reports:', JSON.stringify(r[0], null, 2));
    
    r = await seq.query("SELECT MaHocKy, COUNT(*) AS cnt FROM BANGDIEMMON GROUP BY MaHocKy");
    console.log('BANGDIEMMON by semester:', JSON.stringify(r[0], null, 2));
    
    r = await seq.query("SELECT COUNT(*) AS cnt FROM BANGDIEMMON b JOIN LOP l ON l.MaLop = b.MaLop WHERE l.TenNamHoc = ''2025-2026''");
    console.log('BANGDIEMMON for 2025-2026:', JSON.stringify(r[0]));
    
    r = await seq.query("SELECT * FROM THAMSO WHERE TenThamSo = ''DiemDatMon''");
    console.log('THAMSO DiemDatMon:', JSON.stringify(r[0], null, 2));
    
    r = await seq.query("SELECT l.TenNamHoc, b.MaLop, b.MaMonHoc, b.MaHocKy FROM BANGDIEMMON b JOIN LOP l ON l.MaLop = b.MaLop WHERE l.TenNamHoc = ''2025-2026''");
    console.log('Sample BANGDIEMMON 2025-2026:', JSON.stringify(r[0], null, 2));
    
  } catch(e) { console.error(e.message); console.error(e.stack); }
  process.exit(0);
})();
