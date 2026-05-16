const API_URL = "http://localhost:5001/api/auth";

export const login = async (username, password) => {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    return res.json();
};

// lưu token
export const saveToken = (token) => {
    localStorage.setItem("token", token);
};

// lấy token
export const getToken = () => {
    return localStorage.getItem("token");
};

// logout
export const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "./pages/login.html";
};