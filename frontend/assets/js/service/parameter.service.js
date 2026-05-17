const API_URL = "http://localhost:5001/api/school/parameter";

// Tiện ích lấy token từ localStorage
const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

// 1. Lấy toàn bộ danh sách tham số (có hỗ trợ tìm kiếm bằng keyword)
export const getAllParameters = async (keyword = "") => {
    const url = keyword ? `${API_URL}?keyword=${encodeURIComponent(keyword)}` : API_URL;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error("Không thể tải danh sách tham số");
    return res.json();
};

// 2. Tạo một tham số mới
export const createParameter = async (TenThamSo, GiaTri) => {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ TenThamSo, GiaTri })
    });
    return res; 
};

// 3. Cập nhật giá trị tham số
export const updateParameter = async (oldName, newName, giaTri) => {
    const res = await fetch(`${API_URL}/${encodeURIComponent(oldName)}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ TenThamSo: newName, GiaTri: giaTri })
    });
    return res.ok;
};

// 4. Xóa tham số
export const deleteParameter = async (name) => {
    const res = await fetch(`${API_URL}/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: getHeaders()
    });
    return res.ok;
};