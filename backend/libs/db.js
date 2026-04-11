import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import Usertmodel from '../models/User.Models.js';
import Studentmodel from '../models/Student.Models.js';

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

db.HOCSINH = Studentmodel(sequelize);

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connect Database QLHS successfully (MSSQL).');
        
        
        await sequelize.sync(); 
        console.log('All the table has been synchronized and is now clean.');
    } catch (error) {
        console.error('Database connection failed', error.message);
        process.exit(1); 
    }
};

export default db;