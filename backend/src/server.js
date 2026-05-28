import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from '../libs/db.js'; 
import studentRoute from '../routes/student.route.js'
import classRoute from "../routes/class.router.js"
import studyProcessRoute from '../routes/studyProcess.router.js'
import authRoute from '../routes/auth.route.js'
import academicRoute from '../routes/academic.router.js'
import scoreRoute from '../routes/score.router.js'
import parameterRoute from '../routes/parameter.router.js'

import reportSubjectsRoute from '../routes/reportSubjects.router.js'
import reportSemesterRoute from '../routes/reportSemester.router.js'
import searchRoute from '../routes/search.router.js'
import dashboardRoute from '../routes/dashboard.router.js'

import helmet from 'helmet'


import cors from 'cors';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());

//public route

app.use("/api/auth", authRoute);

//private route

app.use("/api/school", studentRoute);
app.use("/api/school", classRoute);
app.use("/api/school", studyProcessRoute);

app.use("/api/school", academicRoute);
app.use("/api/school", scoreRoute);
app.use("/api/school", parameterRoute);

app.use("/api/school", reportSubjectsRoute);
app.use("/api/school", reportSemesterRoute);
app.use("/api/school", searchRoute);
app.use("/api/school", dashboardRoute);

app.listen(PORT, async () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    
    await connectDB();
});
