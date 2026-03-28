import * as  studentModel from "../../models/student.Models.js"

export const getStudent = async (req, res) =>{
    try {
        const student = await studentModel.getAllStudent();
        res.status(200).json(student)
    } catch (error) {
        console.log("Error when get Student from db" ,error);
        return res.status(500).json({message: "System Error"});
    }
//To do: Thêm method thêm học sinh
}