import express from 'express'
import dotenv from 'dotenv'
import studenRoute from "../routes/student.routes.js"
import sql from "mssql";
import { connectDB } from '../libs/db.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

//middlewares

app.use(express.json());

//public route

//private route

app.use("/api/school", studenRoute);


connectDB();


app.listen(PORT, () =>{
    console.log(`Server is running at ${PORT}`);
    
})