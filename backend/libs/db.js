import sql from "mssql";

export const connectDB = async () => {
    const config = {
        user: process.env.DB_USER, 
        password: process.env.DB_PWD,
        server: "localhost",
        database: process.env.DB_NAME,
        options: {
            encrypt: false,
            trustServerCertificate: true 
        }
    };

    try {
        console.log("Kết nối với user:", config.user); 
        
        await sql.connect(config);
        console.log("Database is connected successfully");
    } catch (error) {
        console.log("Error occur when trying connect Database", error.message);
        process.exit(1);
    }
}