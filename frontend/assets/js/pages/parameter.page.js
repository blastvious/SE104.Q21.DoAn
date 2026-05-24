import {
    getAllParameters,
    createParameter,
    updateParameter,
    deleteParameter
} from "../service/parameter.service.js";

// Trạng thái cục bộ của trang
let isEditMode = false;
let currentEditingName = ""; // Lưu lại tên tham số cũ trước khi sửa để làm điều kiện tìm kiếm cập nhật

/**
 * Hàm khởi tạo chính (Sẽ được Router gọi khi điều hướng vào trang này)
 */
export async function init() {
    await fetchAndRenderParams();
    initControlPanel();
}

/**
 * 1. Lấy dữ liệu từ Service và kết xuất (Render) ra bảng HTML
 */
async function fetchAndRenderParams(keyword = "") {
    try {
        const data = await getAllParameters(keyword);
        const tbody = document.getElementById("parameterTableBody");
        
        if (!tbody) return;
        tbody.innerHTML = "";

        // Trường hợp không tìm thấy dữ liệu phù hợp
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #94a3b8; padding: 30px; font-size: 0.9rem;">
                        <i class="fas fa-box-open" style="margin-right: 6px;"></i> Không tìm thấy tham số nào phù hợp.
                    </td>
                </tr>`;
            return;
        }

        // Duyệt danh sách đổ dữ liệu vào từng dòng (tr)
        data.forEach((item, index) => {
            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid #f1f5f9";
            tr.innerHTML = `
                <td style="text-align: center; padding: 14px 16px; font-weight: 600; color: #64748b;">${index + 1}</td>
                <td class="param-name-cell" style="padding: 14px 16px; font-weight: 600; color: #475569;">${item.TenThamSo}</td>
                <td class="param-value-cell" style="padding: 14px 16px; font-weight: 500; color: #334155;">${item.GiaTri}</td>
                <td style="text-align: right; padding: 14px 25px;">
                    <div class="action-group">
                        <button class="action-btn edit" title="Chỉnh sửa">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="action-btn delete" title="Xóa bỏ">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Gán lại sự kiện trực tiếp cho các nút sửa/xóa vừa sinh ra
        bindRowEvents();

    } catch (err) {
        console.error("Lỗi khi render danh sách tham số:", err);
        const tbody = document.getElementById("parameterTableBody");
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #ef4444; padding: 30px; font-weight: 600;">
                        <i class="fas fa-exclamation-triangle" style="margin-right: 6px;"></i> Không thể kết nối đến máy chủ dữ liệu!
                    </td>
                </tr>`;
        }
    }
}

/**
 * 2. Gán sự kiện cho các nút hành động (Sửa / Xóa) nằm trên mỗi hàng của bảng
 */
function bindRowEvents() {
    // Xử lý sự kiện click nút SỬA
    document.querySelectorAll(".action-btn.edit").forEach(btn => {
        btn.onclick = (e) => {
            const row = e.target.closest("tr");
            const name = row.querySelector(".param-name-cell").innerText;
            const val = row.querySelector(".param-value-cell").innerText;

            isEditMode = true;
            currentEditingName = name;

            // Cập nhật lại giao diện Modal sang trạng thái "Chỉnh sửa"
            document.getElementById("modalTitle").innerText = "Chỉnh Sửa Tham Số Quy Định";
            document.getElementById("paramNameInput").value = name;
            document.getElementById("paramValueInput").value = val;
            
            document.getElementById("paramModal").style.display = "block";
        };
    });

    // Xử lý sự kiện click nút XÓA
    document.querySelectorAll(".action-btn.delete").forEach(btn => {
        btn.onclick = async (e) => {
            const row = e.target.closest("tr");
            const name = row.querySelector(".param-name-cell").innerText;

            if (!confirm(`Bạn có chắc chắn muốn xóa tham số "${name}" ra khỏi hệ thống quy định không?`)) return;

            try {
                const success = await deleteParameter(name);
                if (success) {
                    Toast.success("Xóa cấu hình tham số thành công!");
                    row.remove();
                    // Tải lại để cập nhật chính xác số thứ tự STT
                    const searchInput = document.getElementById("searchParamInput");
                    await fetchAndRenderParams(searchInput ? searchInput.value.trim() : "");
                } else {
                    Toast.error("Không thể xóa tham số cấu hình này.");
                }
            } catch (err) {
                Toast.error("Xảy ra lỗi trong quá trình kết nối xóa dữ liệu.");
            }
        };
    });
}

/**
 * 3. Quản lý bảng điều khiển chính (Các nút mở modal, tìm kiếm, lưu dữ liệu form)
 */
function initControlPanel() {
    const modal = document.getElementById("paramModal");
    const openBtn = document.getElementById("openAddParamModalBtn");
    const closeBtn = modal?.querySelector(".close-modal");
    const cancelBtn = document.getElementById("cancelParamBtn");
    const saveBtn = document.getElementById("saveParamBtn");
    const searchInput = document.getElementById("searchParamInput");

    if (!modal) return;

    // Sự kiện mở Modal Thêm Mới
    if (openBtn) {
        openBtn.onclick = () => {
            isEditMode = false;
            currentEditingName = "";
            document.getElementById("paramForm").reset();
            document.getElementById("modalTitle").innerText = "Thêm Tham Số Hệ Thống";
            modal.style.display = "block";
        };
    }

    // Cơ chế đóng đóng Modal
    const closeModal = () => { modal.style.display = "none"; };
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    
    // Đóng khi click ngoài vùng trắng nội dung của Modal
    window.onclick = (e) => { if (e.target === modal) closeModal(); };

    // Tìm kiếm thời gian thực khi gõ phím
    if (searchInput) {
        let debounceTimer;
        searchInput.oninput = (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchAndRenderParams(e.target.value.trim());
            }, 300); // Trì hoãn 300ms tránh spam request liên tục lên API
        };
    }

    // Xử lý nút LƯU THAY ĐỔI (Submit Form)
    if (saveBtn) {
        saveBtn.onclick = async () => {
            const tenThamSo = document.getElementById("paramNameInput").value.trim();
            const giaTri = document.getElementById("paramValueInput").value.trim();

            // Kiểm tra tính hợp lệ dữ liệu đầu vào (Validation)
            if (!tenThamSo || !giaTri) {
                Toast.warning("Vui lòng nhập đầy đủ cả tên tham số và giá trị áp dụng!");
                return;
            }

            try {
                if (isEditMode) {
                    // Chế độ: CẬP NHẬT (UPDATE)
                    const success = await updateParameter(currentEditingName, tenThamSo, giaTri);
                    if (success) {
                        Toast.success("Cập nhật quy định hệ thống thành công!");
                        closeModal();
                        await fetchAndRenderParams(searchInput ? searchInput.value.trim() : "");
                    } else {
                        Toast.error("Cập nhật thất bại. Vui lòng kiểm tra lại dữ liệu đầu vào.");
                    }
                } else {
                    // Chế độ: TẠO MỚI (CREATE)
                    const response = await createParameter(tenThamSo, giaTri);
                    if (response.status === 201) {
                        Toast.success("Thêm mới cấu hình tham số thành công!");
                        closeModal();
                        if (searchInput) searchInput.value = ""; // Reset thanh tìm kiếm về rỗng để hiển thị hàng mới thêm
                        await fetchAndRenderParams();
                    } else {
                        const errorData = await response.json();
                        Toast.error(errorData.message || "Tạo mới thất bại. Tên tham số có thể đã tồn tại!");
                    }
                }
            } catch (err) {
                console.error("Lỗi submit form tham số:", err);
                Toast.error("Lỗi đường truyền hệ thống không thể xử lý yêu cầu!");
            }
        };
    }
}