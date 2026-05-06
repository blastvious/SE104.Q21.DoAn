const API_URL = "http://localhost:5001/api/school/student";

// Lấy toàn bộ danh sách
export const getAllStudents = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Không thể tải danh sách");
    return await response.json();
};

// Thêm mới học sinh
export const createStudent = async (studentData) => {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Lỗi khi thêm");
    return data;
};

// student.service.js
export const bulkCreateStudents = async (dataArray) => {
    try {
        const response = await fetch(`${API_URL}/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataArray)
        });

        const result = await response.json();

        if (!response.ok) {
            // Nếu server trả về mảng details (lỗi Joi), ta nối chúng lại
            const errorMsg = result.details ? result.details.join("\n") : result.message;
            throw new Error(errorMsg || "Dữ liệu file Excel không hợp lệ!");
        }

        return result;
    } catch (error) {
        // Ném lỗi ra ngoài để hàm init() bắt được và alert()
        throw error;
    }
};