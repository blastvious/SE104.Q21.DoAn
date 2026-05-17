import { 
    getToken, 
    getMe, 
    getUsers, 
    createUser, 
    updateUserRole, 
    deleteUser 
} from "../service/auth.service.js";

// Hàm khởi tạo chính được gọi bởi router.js
export async function init() {
    const token = getToken();
    if (!token) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "login.html";
        return;
    }

    // Tiến hành tải thông tin tài khoản
    await loadCurrentUserInfo();
}

// 1. Đổ dữ liệu thông tin cá nhân và kiểm tra quyền Admin
async function loadCurrentUserInfo() {
    try {
        const currentUser = await getMe();
        
        // Render thông tin của chính mình
        const userInfoEl = document.getElementById("userInfo");
        if (userInfoEl) {
            userInfoEl.innerHTML = `
                <p><strong>Quyền hạn:</strong> <span class="badge">${currentUser.role}</span></p>
            `;
        }

        // Nếu là Admin thì mở chặn hiển thị khu vực quản lý và load danh sách
        if (currentUser.role === "Admin") {
            const adminSection = document.getElementById("adminSection");
            if (adminSection) {
                adminSection.style.display = "block";
                await loadAllUsers();
                initAdminEventListeners();
            }
        }
    } catch (error) {
        console.error(error);
        alert("Phiên đăng nhập hết hạn hoặc lỗi kết nối.");
    }
}

// 2. Render danh sách tài khoản vào table
async function loadAllUsers() {
    try {
        const users = await getUsers();
        const tbody = document.getElementById("userListTableBody");
        if (!tbody) return;
        
        tbody.innerHTML = ""; // Clear dữ liệu cũ

        users.forEach(user => {
            const tr = document.createElement("tr");
            tr.setAttribute("data-id", user.Id);
            tr.innerHTML = `
                <td>${user.Id}</td>
                <td>${user.Username}</td>
                <td>
                    <select class="role-select qlsv-input">
                        <option value="Admin" ${user.RoleName === 'Admin' ? 'selected' : ''}>Admin</option>
                        <option value="Manager" ${user.RoleName === 'Manager' ? 'selected' : ''}>Manager</option>
                        <option value="User" ${user.RoleName === 'User' ? 'selected' : ''}>User</option>
                    </select>
                </td>
                <td>
                    <button class="qlsv-btn qlsv-btn--success save-role-btn" style="padding: 4px 8px;">Lưu</button>
                    <button class="qlsv-btn qlsv-btn--danger delete-user-btn" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor:pointer;">Xóa</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        bindTableActions();
    } catch (error) {
        console.error("Lỗi khi load danh sách users:", error);
    }
}

// 3. Xử lý sự kiện khi ấn nút Tạo tài khoản mới
function initAdminEventListeners() {
    const createBtn = document.getElementById("createUserBtn");
    if (!createBtn) return;

    // Thay thế hoàn toàn Event Listener cũ tránh trùng lặp sự kiện khi chuyển trang qua lại
    createBtn.onclick = async () => {
        const Username = document.getElementById("newUsername").value.trim();
        const Password = document.getElementById("newPassword").value.trim();
        const RoleName = document.getElementById("newRole").value;

        if (!Username || !Password) {
            alert("Vui lòng điền đầy đủ thông tin!");
            return;
        }

        const response = await createUser(Username, Password, RoleName);

        if (response.status === 201) {
            alert("Tạo tài khoản thành công!");
            document.getElementById("newUsername").value = "";
            document.getElementById("newPassword").value = "";
            await loadAllUsers(); // Cập nhật lại bảng
        } else {
            const errData = await response.json();
            alert(errData.message || "Không thể tạo tài khoản");
        }
    };
}

// 4. Xử lý sự kiện ấn nút Lưu (Sửa) và nút Xóa trên từng hàng dữ liệu
function bindTableActions() {
    // Xử lý Sửa Role
    document.querySelectorAll(".save-role-btn").forEach(button => {
        button.onclick = async (e) => {
            const row = e.target.closest("tr");
            const userId = row.getAttribute("data-id");
            const selectedRole = row.querySelector(".role-select").value;

            const isSuccess = await updateUserRole(userId, selectedRole);
            if (isSuccess) {
                alert("Cập nhật vai trò thành công!");
                await loadAllUsers();
            } else {
                alert("Cập nhật thất bại.");
            }
        };
    });

    // Xử lý Xóa User
    document.querySelectorAll(".delete-user-btn").forEach(button => {
        button.onclick = async (e) => {
            const row = e.target.closest("tr");
            const userId = row.getAttribute("data-id");
            const username = row.children[1].innerText;

            if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}" không?`)) return;

            const isSuccess = await deleteUser(userId);
            if (isSuccess) {
                alert("Xóa thành công!");
                row.remove(); // Xóa trực tiếp row khỏi DOM mượt mà
            } else {
                alert("Xóa thất bại.");
            }
        };
    });
}