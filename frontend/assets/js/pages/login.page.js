import { login, saveToken, getToken } from "../service/auth.service.js";

// 🔥 Nếu đã login → đá về index
if (getToken()) {
    window.location.href = "../index.html";
}

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const data = await login(username, password);

        if (data.token) {
            saveToken(data.token);

            // 🔥 chuyển trang
            window.location.href = "../index.html";
        } else {
            alert("Sai tài khoản hoặc mật khẩu");
        }
    } catch (err) {
        console.error(err);
        alert("Lỗi server");
    }
});