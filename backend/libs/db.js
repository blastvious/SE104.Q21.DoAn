import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import Usertmodel from '../models/User.models.js';
import Studentmodel from '../models/Student.models.js';
import Classmodel from '../models/Class.models.js';
import Grademodel from '../models/Grade.models.js';
import Semestermodel from '../models/Semester.models.js';
import Yearmodel from '../models/Year.models.js';
import TypeofTestmodel from '../models/TypeTest.models.js';
import StudyProcessModel from '../models/professional_requirements/StudyProcess.models.js';
import Subjectmodel from '../models/Subject.models.js';
import Scoremodel from '../models/professional_requirements/Score.models.js';
import ScoreDetailmodel from '../models/professional_requirements/ScoreDetail.models.js';
import TypeTestDetailmodels from '../models/professional_requirements/TypeTestDetail.models.js';



dotenv.config();

// Khởi tạo instance Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PWD,
    {
        host: process.env.DB_HOST || 'localhost', 
        dialect: 'mssql',
        logging: false, 
        dialectOptions: {
            options: {
                encrypt: true,
                trustServerCertificate: true,
            }
        }
    }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Khởi tạo Model (Lưu ý: Truyền cả sequelize và Sequelize)
db.PHANQUYEN = Usertmodel(sequelize);

//========== Model - Core  =============
db.HOCSINH = Studentmodel(sequelize);
db.LOP = Classmodel(sequelize);
db.KHOILOP = Grademodel(sequelize);
db.HOCKY = Semestermodel(sequelize);
db.NAMHOC = Yearmodel(sequelize);
db.LOAIHINHKT = TypeofTestmodel(sequelize);
db.MONHOC = Subjectmodel(sequelize);

//==============professional_requirements =============
db.QUATRINHHOC = StudyProcessModel(sequelize);
db.BANGDIEMMON = Scoremodel(sequelize);
db.CT_BANGDIEMMON_HS = ScoreDetailmodel(sequelize);
db.CT_BANGDIEMMON_LHKT = TypeTestDetailmodels(sequelize);
//Khởi tạo các mối quan hệ

db.NAMHOC.hasMany(db.LOP, { foreignKey: 'TenNamHoc' });
db.LOP.belongsTo(db.NAMHOC, { foreignKey: 'TenNamHoc' });

db.KHOILOP.hasMany(db.LOP, { foreignKey: 'MaKhoiLop' });
db.LOP.belongsTo(db.KHOILOP, { foreignKey: 'MaKhoiLop' });




db.HOCSINH.hasMany(db.QUATRINHHOC, { foreignKey: 'MaHS' });
db.QUATRINHHOC.belongsTo(db.HOCSINH, { foreignKey: 'MaHS' });

db.LOP.hasMany(db.QUATRINHHOC, { foreignKey: 'MaLop' });
db.QUATRINHHOC.belongsTo(db.LOP, { foreignKey: 'MaLop' });

db.HOCKY.hasMany(db.QUATRINHHOC, { foreignKey: 'MaHocKy' });
db.QUATRINHHOC.belongsTo(db.HOCKY, { foreignKey: 'MaHocKy' });

db.BANGDIEMMON.hasMany(db.CT_BANGDIEMMON_HS, { foreignKey: 'MaBangDiemMon' });
db.CT_BANGDIEMMON_HS.belongsTo(db.BANGDIEMMON, { foreignKey: 'MaBangDiemMon' });

db.HOCSINH.hasMany(db.CT_BANGDIEMMON_HS, { foreignKey: 'MaHS' });
db.CT_BANGDIEMMON_HS.belongsTo(db.HOCSINH, { foreignKey: 'MaHS' });
//==========Update=====================
// Bảng điểm môn phải thuộc về một Lớp
db.LOP.hasMany(db.BANGDIEMMON, { foreignKey: 'MaLop' });
db.BANGDIEMMON.belongsTo(db.LOP, { foreignKey: 'MaLop' });

// Bảng điểm môn phải thuộc về một Môn học
db.MONHOC.hasMany(db.BANGDIEMMON, { foreignKey: 'MaMonHoc' });
db.BANGDIEMMON.belongsTo(db.MONHOC, { foreignKey: 'MaMonHoc' });

// Bảng điểm môn phải thuộc về một Học kỳ
db.HOCKY.hasMany(db.BANGDIEMMON, { foreignKey: 'MaHocKy' });
db.BANGDIEMMON.belongsTo(db.HOCKY, { foreignKey: 'MaHocKy' });
// Giúp từ QUATRINHHOC có thể truy vấn nhanh ra tất cả các môn học của học sinh đó
db.QUATRINHHOC.hasMany(db.CT_BANGDIEMMON_HS, { 
    foreignKey: 'MaHS', 
    sourceKey: 'MaHS' 
});
//================================================================

db.CT_BANGDIEMMON_HS.hasMany(db.CT_BANGDIEMMON_LHKT, { foreignKey: 'MaCTBDMHS' });
db.CT_BANGDIEMMON_LHKT.belongsTo(db.CT_BANGDIEMMON_HS, { foreignKey: 'MaCTBDMHS' });

db.LOAIHINHKT.hasMany(db.CT_BANGDIEMMON_LHKT, { foreignKey: 'MaLoaiHinhKT' });
db.CT_BANGDIEMMON_LHKT.belongsTo(db.LOAIHINHKT, { foreignKey: 'MaLoaiHinhKT' });



//=============== Kết nối database sql server================
export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connect Database QLHS successfully (MSSQL).');
        
        
        await sequelize.sync();

        // Tạo unique constraint cho MONHOC.TenMonHoc nếu chưa có
        try {
            await sequelize.query(`
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_MONHOC_TenMonHoc')
                BEGIN
                    CREATE UNIQUE INDEX UQ_MONHOC_TenMonHoc ON MONHOC (TenMonHoc);
                END
            `);
        } catch (err) {
            console.warn('Could not create unique index on MONHOC:', err.message);
        }

        // Tạo unique constraint cho LOAIHINHKT.TenLoaiHinhKT nếu chưa có
        try {
            await sequelize.query(`
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_LOAIHINHKT_TenLoaiHinhKT')
                BEGIN
                    CREATE UNIQUE INDEX UQ_LOAIHINHKT_TenLoaiHinhKT ON LOAIHINHKT (TenLoaiHinhKT);
                END
            `);
        } catch (err) {
            console.warn('Could not create unique index on LOAIHINHKT:', err.message);
        }

        // Tạo unique index cho BANGDIEMMON nếu chưa có
        try {
            await sequelize.query(`
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_BANGDIEMMON_Lop_Mon_Ky')
                BEGIN
                    CREATE UNIQUE INDEX UQ_BANGDIEMMON_Lop_Mon_Ky ON BANGDIEMMON (MaLop, MaMonHoc, MaHocKy);
                END
            `);
        } catch (err) {
            console.warn('Could not create index on BANGDIEMMON:', err.message);
        }

        // Tạo bảng BAOCAOTONGKETMON và CT_BAOCAOTONGKETMON nếu chưa có
        try {
            await sequelize.query(`
                IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'BAOCAOTONGKETMON')
                BEGIN
                    CREATE TABLE BAOCAOTONGKETMON (
                        MaBCTKMon NVARCHAR(10) NOT NULL PRIMARY KEY,
                        TenNamHoc NVARCHAR(10) NOT NULL,
                        MaMonHoc NVARCHAR(10) NOT NULL,
                        MaHocKy NVARCHAR(10) NOT NULL,
                        TongSiSo INT NOT NULL DEFAULT 0,
                        TongSoLuongDat INT NOT NULL DEFAULT 0
                    );
                END
            `);
        } catch (err) {
            console.warn('Could not create BAOCAOTONGKETMON table:', err.message);
        }

        try {
            await sequelize.query(`
                IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CT_BAOCAOTONGKETMON')
                BEGIN
                    CREATE TABLE CT_BAOCAOTONGKETMON (
                        MaBCTKMon NVARCHAR(10) NOT NULL,
                        MaLop NVARCHAR(10) NOT NULL,
                        SiSo INT NOT NULL DEFAULT 0,
                        SoLuongDat INT NOT NULL DEFAULT 0,
                        TiLeDat DECIMAL(5,2) NOT NULL DEFAULT 0.0,
                        PRIMARY KEY (MaBCTKMon, MaLop)
                    );
                END
            `);
        } catch (err) {
            console.warn('Could not create CT_BAOCAOTONGKETMON table:', err.message);
        }

        console.log('All the table has been synchronized and is now clean.');
    } catch (error) {
        console.error('Database connection failed', error.message);
        process.exit(1); 
    }
};

export default db;