import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from '../libs/db.js'; 
import studentRoute from '../routes/student.Route.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

//public route

//private route

app.use("/api/school", studentRoute);

app.listen(PORT, async () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    
    await connectDB();
});