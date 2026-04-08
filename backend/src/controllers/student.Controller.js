import db from "../../libs/db.js"

export const getAllStudent = async (req, res) =>{
    try {
        const student = await db.STUDENT.findAll();
        res.json(student);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
        
    }
}

//To do: Thêm method thêm học sinh

export const createStudent = async (req, res) => {
    try {
        const { Name, Email, Phone } = req.body;

        const newStudent = await db.STUDENT.create({
            Name,
            Email,
            Phone
        });
        res.status(201).json(newStudent);
    } catch (error) {
        console.error(error);
        res.status(500).json({statusCode: 500, message: "Error from server"})
    }
}