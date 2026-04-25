import db from "../../libs/db.js"
import { Op } from "sequelize"

// Thứ tự nên có là Nam học, học kỳ, khối lớp rồi mới đến lớp nha.

// Năm học
export const createYear = async (req, res) =>{
    try {
        // Todo: từ db gọi đến NAMHOC và tạo năm học.
        // Đọc từ req.body
        // Tạo đối tượng 
        // Thêm vào database
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}

export const getAllYear = async(req, res) =>{
    try {
        // Todo: Tham Khảo student.controller.js
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}

// Học Kỳ 
export const createSemester = async (req, res) =>{
    try {
        // Todo: từ db gọi đến HOCKY và tạo các học kỳ.
        // Đọc từ req.body
        // Tạo đối tượng 
        // Thêm vào database
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}

export const getAllSemester = async(req, res) =>{
    try {
        // Todo: Tham Khảo student.controller.js
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}

// Khối Lớp
export const createGrade = async (req, res) =>{
    try {
        // Todo: từ db gọi đến KHOILOP và tạo các khối lớp.
        // Đọc từ req.body
        // Kiểm tra xem năm học đã tồn tại chưa
        // Tạo đối tượng 
        // Thêm vào database
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}

export const getAllGrade = async(req, res) =>{
    try {
        // Todo: Tham Khảo student.controller.js
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}


// Lớp
export const createClass = async (req, res) =>{
    try {
        // Todo: từ db gọi đến LOP và tạo các  lớp.
        // Đọc từ req.body
        // Tạo đối tượng 
        // Thêm vào database
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}

export const getAllClass = async(req, res) =>{
    try {
        // Todo: Tham Khảo student.controller.js
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error from server"});
    }
}