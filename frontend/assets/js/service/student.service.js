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