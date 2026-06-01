import {
    getToken,
    getMe,
    getUsers,
    createUser,
    updateUserRole,
    deleteUser
} from "../service/auth.service.js";
import { can } from "../permission.js";

// Hàm khởi tạo chính được gọi bởi router.js
export async function init() {
    const token = getToken();
    if (!token) {
        Toast.warning("Bạn chưa đăng nhập!");
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
        const userNameEl = document.querySelector("#userInfo .user-name");
        const userRoleEl = document.querySelector("#userInfo .user-role span");
        if (userNameEl) userNameEl.textContent = currentUser.username || currentUser.Username || "--";
        if (userRoleEl) userRoleEl.textContent = currentUser.role || currentUser.RoleName || "--";

        // Nếu là Admin thì mở chặn hiển thị khu vực quản lý và load danh sách
        if (currentUser.role === "Admin") {
            const adminSection = document.getElementById("adminSection");
            if (adminSection) {
                adminSection.style.display = "flex";
                await loadAllUsers();
                initAdminEventListeners();
            }
        }
    } catch (error) {
        console.error(error);
        Toast.error("Phiên đăng nhập hết hạn hoặc lỗi kết nối.");
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
            const role = user.RoleName;
            tr.innerHTML = `
                <td>${user.Id}</td>
                <td>${user.Username}</td>
                <td>
                    <select class="role-select qlsv-select" data-original="${role}">
                        <option value="Admin" ${role === 'Admin' ? 'selected' : ''}>Admin</option>
                        <option value="Manager" ${role === 'Manager' ? 'selected' : ''}>Manager</option>
                        <option value="User" ${role === 'User' ? 'selected' : ''}>User</option>
                    </select>
                </td>
                <td>
                    ${user.Id === window.currentUser.id
                        ? `<span class="current-user-badge">Đang sử dụng</span>`
                        : `
                            <button class="action-btn edit save-role-btn" title="Lưu"><i class="fas fa-save"></i></button>
                            ${can(window.currentUser, "delete") ? `<button class="action-btn delete delete-user-btn" title="Xóa"><i class="fas fa-trash"></i></button>` : ''}
                          `
                    }
                </td>
            `;
            tbody.appendChild(tr);

            const select = tr.querySelector(".role-select");
            select.onchange = () => {
                tr.classList.toggle("row-unsaved", select.value !== select.dataset.original);
            };
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
            Toast.warning("Vui lòng điền đầy đủ thông tin!");
            return;
        }

        const response = await createUser(Username, Password, RoleName);

        if (response.status === 201) {
            Toast.success("Tạo tài khoản thành công!");
            document.getElementById("newUsername").value = "";
            document.getElementById("newPassword").value = "";
            await loadAllUsers(); // Cập nhật lại bảng
        } else {
            const errData = await response.json();
            Toast.error(errData.message || "Không thể tạo tài khoản");
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
            const select = row.querySelector(".role-select");
            const selectedRole = select.value;

            const isSuccess = await updateUserRole(userId, selectedRole);
            if (isSuccess) {
                Toast.success("Cập nhật vai trò thành công!");
                select.dataset.original = selectedRole;
                row.classList.remove("row-unsaved");
            } else {
                Toast.error("Cập nhật thất bại.");
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
                Toast.success("Xóa thành công!");
                row.remove(); 
            } else {
                Toast.error("Xóa thất bại.");
            }
        };
    });
}