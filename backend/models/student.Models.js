
import sql from "mssql"

export const getAllStudent = async () =>{
    try {
        const result = await sql.query`SELECT * FROM Student`
        return result.recordset;
    } catch (error) {
        console.log(error);
        
    }
}

//To do: Thêm một method về thêm học sinh vào cơ sở dữ liệu.

export const addStudent = async () =>{
    // Mở 1 khối try catch và bắt đầu code logic như trên. không gửi json hay status vì đó là nhiệm vụ của controllers.

}

//Todo: 