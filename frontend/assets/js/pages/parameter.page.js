import {
    getAllParameters,
    updateParameter
} from "../service/parameter.service.js";

let currentEditingName = "";
let isLocked = false;
let activeYearName = "";

/**
 * Hàm khởi tạo chính (Sẽ được Router gọi khi điều hướng vào trang này)
 */
export async function init() {
    await checkLockStatus();
    await fetchAndRenderParams();
    initControlPanel();
}

async function checkLockStatus() {
    try {
        const res = await fetch("http://localhost:5001/api/school/year");
        const years = await res.json();
        const today = new Date().toISOString().split('T')[0];

        const active = years.find(y =>
            y.NgayBatDau <= today && y.NgayKetThuc >= today
        );
        isLocked = !!active;
        activeYearName = active ? active.TenNamHoc : "";
    } catch (e) {
        isLocked = false;
        activeYearName = "";
    }
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
            tr.innerHTML = `
                <td style="text-align: center; padding: 14px 16px; font-weight: 600;">${index + 1}</td>
                <td class="param-name-cell" style="padding: 14px 16px; font-weight: 600;">${item.TenThamSo}</td>
                <td class="param-value-cell" style="padding: 14px 16px; font-weight: 500;">${item.GiaTri}</td>
                <td style="text-align: center; padding: 14px 16px;">
                    ${isLocked
                        ? '<span class="lock-badge" title="Không thể sửa trong năm học"><i class="fas fa-lock"></i></span>'
                        : `<button class="action-btn edit" title="Chỉnh sửa"><i class="fas fa-pen"></i></button>`
                    }
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Hiển thị banner khóa nếu cần
        showLockBanner();

        // Gán lại sự kiện trực tiếp cho các nút sửa/xóa vừa sinh ra
        if (!isLocked) bindRowEvents();

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
function showLockBanner() {
    const container = document.getElementById("paramNotices");
    if (!container) return;
    container.innerHTML = "";

    const info = document.createElement("div");
    info.style.cssText = "font-size:0.82rem;color:#d97706;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px 12px;margin-bottom:8px;display:flex;align-items:center;gap:8px;";
    info.innerHTML = '<i class="fas fa-info-circle"></i> Lưu ý: Chỉ được phép chỉnh sửa quy định trước ngày bắt đầu năm học. Khi năm học đang diễn ra, quy định sẽ bị khóa.';
    container.appendChild(info);

    if (isLocked) {
        const banner = document.createElement("div");
        banner.style.cssText = "background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px 16px;margin-bottom:8px;display:flex;align-items:center;gap:10px;font-size:0.9rem;color:#856404;";
        banner.innerHTML = `<i class="fas fa-lock"></i><span>Hiện đang trong năm học <strong>${activeYearName}</strong>, quy định không được phép chỉnh sửa. Chỉ được phép chỉnh sửa quy định trước ngày bắt đầu năm học.</span>`;
        container.appendChild(banner);
    }
}

function bindRowEvents() {
    // Xử lý sự kiện click nút SỬA
    document.querySelectorAll(".action-btn.edit").forEach(btn => {
        btn.onclick = (e) => {
            const row = e.target.closest("tr");
            const name = row.querySelector(".param-name-cell").innerText;
            const val = row.querySelector(".param-value-cell").innerText;

            currentEditingName = name;

            // Cập nhật lại giao diện Modal sang trạng thái "Chỉnh sửa"
            document.getElementById("modalTitle").innerText = "Chỉnh Sửa Tham Số Quy Định";
            document.getElementById("paramNameInput").value = name;
            document.getElementById("paramNameInput").disabled = true;
            document.getElementById("paramValueInput").value = val;
            
            document.getElementById("paramModal").style.display = "block";
        };
    });

}

/**
 * 3. Quản lý bảng điều khiển chính (Các nút mở modal, tìm kiếm, lưu dữ liệu form)
 */
function initControlPanel() {
    const modal = document.getElementById("paramModal");
    const closeBtn = modal?.querySelector(".close-modal");
    const cancelBtn = document.getElementById("cancelParamBtn");
    const saveBtn = document.getElementById("saveParamBtn");
    const searchInput = document.getElementById("searchParamInput");

    if (!modal) return;

    // Cơ chế đóng Modal
    const closeModal = () => {
        modal.style.display = "none";
        document.getElementById("paramNameInput").disabled = false;
    };
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    
    window.onclick = (e) => { if (e.target === modal) closeModal(); };

    // Tìm kiếm thời gian thực khi gõ phím
    if (searchInput) {
        let debounceTimer;
        searchInput.oninput = (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchAndRenderParams(e.target.value.trim());
            }, 300);
        };
    }

    // Xử lý nút LƯU THAY ĐỔI
    if (saveBtn) {
        saveBtn.onclick = async () => {
            const tenThamSo = currentEditingName;
            const giaTri = document.getElementById("paramValueInput").value.trim();

            if (!giaTri) {
                Toast.warning("Vui lòng nhập giá trị áp dụng!");
                return;
            }

            if (isLocked) {
                Toast.error("Không thể sửa quy định trong năm học đang diễn ra");
                closeModal();
                return;
            }

            try {
                const success = await updateParameter(tenThamSo, tenThamSo, giaTri);
                if (success) {
                    Toast.success("Cập nhật quy định hệ thống thành công!");
                    closeModal();
                    await fetchAndRenderParams(searchInput ? searchInput.value.trim() : "");
                } else {
                    Toast.error("Cập nhật thất bại. Vui lòng kiểm tra lại dữ liệu đầu vào.");
                }
            } catch (err) {
                console.error("Lỗi submit form tham số:", err);
                Toast.error("Lỗi đường truyền hệ thống không thể xử lý yêu cầu!");
            }
        };
    }
}