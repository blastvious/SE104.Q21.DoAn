import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from '../libs/db.js'; 
import studentRoute from '../routes/student.route.js'
import classRoute from "../routes/class.router.js"
import studyProcessRoute from '../routes/studyProcess.router.js'
import authRoute from '../routes/auth.route.js'
import academicRoute from '../routes/academic.router.js'
import scoreRoute from '../routes/score.router.js'
import helmet from 'helmet'

import cors from 'cors';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());

//public route

app.use("/api/school", authRoute);

//private route

app.use("/api/school", studentRoute);
app.use("/api/school", classRoute);
app.use("/api/school", studyProcessRoute);

app.use("/api/school", academicRoute);
app.use("/api/school", scoreRoute);

app.listen(PORT, async () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    
    await connectDB();
});
