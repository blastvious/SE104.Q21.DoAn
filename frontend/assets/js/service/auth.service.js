const API_URL = "http://localhost:5001/api/auth";

// --- Quản lý Token ---
export const saveToken = (token) => localStorage.setItem("token", token);
export const getToken = () => localStorage.getItem("token");
export const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "./pages/login.html";
};

// --- Cấu hình Header mặc định cho các request cần token ---
const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`
});

// --- Các hàm gọi API tương tác với Backend ---

// 1. Đăng nhập
export const login = async (username, password) => {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    return res.json();
};

// 2. Lấy thông tin cá nhân (Me)
export const getMe = async () => {
    const res = await fetch(`${API_URL}/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Không thể xác thực tài khoản");
    return res.json();
};

// 3. Lấy danh sách toàn bộ user (Chỉ Admin)
export const getUsers = async () => {
    const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Không thể lấy danh sách người dùng");
    return res.json();
};

// 4. Tạo tài khoản mới (Chỉ Admin)
export const createUser = async (Username, Password, RoleName) => {
    const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ Username, Password, RoleName })
    });
    return res; // Trả về nguyên bản response để ở page check status code (ví dụ: 201)
};

// 5. Cập nhật vai trò (Chỉ Admin)
export const updateUserRole = async (userId, RoleName) => {
    const res = await fetch(`${API_URL}/users/${userId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ RoleName })
    });
    return res.ok;
};

// 6. Xóa người dùng (Chỉ Admin)
export const deleteUser = async (userId) => {
    const res = await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
        headers: getHeaders()
    });
    return res.ok;
};