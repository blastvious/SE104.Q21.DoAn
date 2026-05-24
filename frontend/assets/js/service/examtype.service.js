const API_URL = "http://localhost:5001/api/school";

export async function getAllExamTypes(keyword = "") {
    try {
        let url = `${API_URL}/examtype`;
        if (keyword) {
            url += `?keyword=${encodeURIComponent(keyword)}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Không thể tải danh sách loại hình kiểm tra");
        }
        return await response.json();
    } catch (error) {
        console.error("getAllExamTypes error:", error);
        throw error;
    }
}

export async function createExamType(data) {
    try {
        const response = await fetch(`${API_URL}/examtype`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Không thể thêm loại hình kiểm tra");
        }
        return result;
    } catch (error) {
        console.error("createExamType error:", error);
        throw error;
    }
}

export async function updateExamType(id, data) {
    try {
        const response = await fetch(`${API_URL}/examtype/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Không thể cập nhật loại hình kiểm tra");
        }
        return result;
    } catch (error) {
        console.error("updateExamType error:", error);
        throw error;
    }
}

export async function deleteExamType(id) {
    try {
        const response = await fetch(`${API_URL}/examtype/${id}`, {
            method: "DELETE",
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Không thể xóa loại hình kiểm tra");
        }
        return result;
    } catch (error) {
        console.error("deleteExamType error:", error);
        throw error;
    }
}
