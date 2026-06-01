import { settingsService } from "../service/settings.service.js"
import { can } from "../permission.js";

const translateError = (err) => {
    const msg = err?.message || "";
    const map = {
        "Missing required fields": "Vui lòng điền đầy đủ thông tin",
        "Year already exists": "Năm học đã tồn tại",
        "School year must use format YYYY-YYYY": "Năm học phải đúng định dạng YYYY-YYYY",
        "School year must be consecutive years": "Năm học phải là 2 năm liên tiếp",
        "Invalid date format": "Định dạng ngày không hợp lệ",
        "Start date must be before end date": "Ngày bắt đầu phải trước ngày kết thúc",
        "Date range must match school year": "Khoảng ngày phải khớp với năm học",
        "Class already exists for this grade and school year": "Lớp đã tồn tại trong khối và năm học này",
        "Class code already exists": "Mã lớp đã tồn tại",
        "School year not found": "Không tìm thấy năm học",
        "Grade not found": "Không tìm thấy khối lớp",
        "Class name must not exceed 15 characters": "Tên lớp không được quá 15 ký tự",
        "Grade id must not exceed 10 characters": "Mã khối không được quá 10 ký tự",
        "School year must not exceed 10 characters": "Năm học không được quá 10 ký tự",
        "Invalid SiSo": "Sĩ số không hợp lệ",
        "Error from server": "Lỗi từ máy chủ",
        "Grade already exists": "Khối lớp đã tồn tại",
        "Học kỳ đã tồn tại": "Học kỳ đã tồn tại",
    };
    return map[msg] || msg || "Lỗi không xác định";
};

const toISODate = (vnDate) => {
    const parts = vnDate.split("/");
    if (parts.length !== 3) return null;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const toVNDate = (isoDate) => {
    if (!isoDate) return "";
    const parts = isoDate.split("-");
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const setupFlatpickr = (id) => {
    flatpickr(`#${id}`, {
        dateFormat: "d/m/Y",
        allowInput: true,
        locale: { firstDayOfWeek: 1 },
    });
};

const clearFlatpickr = (id) => {
    const el = document.getElementById(id);
    if (el && el._flatpickr) el._flatpickr.clear();
};

let editingContext = null;

export const init = async () => {
    setupFlatpickr('NgayBatDau');
    setupFlatpickr('NgayKetThuc');

    await loadAllData();

    document.getElementById('form-year').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                TenNamHoc: document.getElementById('TenNamHoc').value,
                NgayBatDau: toISODate(document.getElementById('NgayBatDau').value),
                NgayKetThuc: toISODate(document.getElementById('NgayKetThuc').value)
            };
            await settingsService.createYear(data);
            Toast.success("Thêm năm học thành công");
            e.target.reset();
            clearFlatpickr('NgayBatDau');
            clearFlatpickr('NgayKetThuc');
            await loadAllData();
        } catch (err) { Toast.error(translateError(err)); }
    };

    document.getElementById('form-class').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                TenLop: document.getElementById('TenLop').value,
                TenNamHoc: document.getElementById('SelectNamHoc').value,
                MaKhoiLop: document.getElementById('SelectKhoi').value,
                SiSo: 0
            };
            await settingsService.createClass(data);
            Toast.success("Thêm lớp thành công");
            e.target.reset();
            await loadAllData();
        } catch (err) { Toast.error(translateError(err)); }
    };

    document.getElementById('editSaveBtn').onclick = async () => {
        await saveEdit();
    };

    document.querySelectorAll('#table-year, #table-class').forEach(table => {
        table.addEventListener('click', handleTableClick);
    });

    const collapsedBar = document.querySelector('.collapsed-bar');
    const settingsGrid = document.querySelector('.settings-grid');

    document.querySelectorAll('.card-minimize-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.config-card');
            const isCollapsed = card.parentElement === collapsedBar;
            if (isCollapsed) {
                const index = parseInt(card.dataset.index);
                let insertBefore = null;
                for (const child of settingsGrid.children) {
                    if (parseInt(child.dataset.index) > index) {
                        insertBefore = child;
                        break;
                    }
                }
                if (insertBefore) {
                    settingsGrid.insertBefore(card, insertBefore);
                } else {
                    settingsGrid.appendChild(card);
                }
                btn.textContent = '−';
            } else {
                collapsedBar.appendChild(card);
                btn.textContent = '+';
            }
        });
    });
};

async function handleTableClick(e) {
    const editBtn = e.target.closest('.action-btn.edit');
    const deleteBtn = e.target.closest('.action-btn.delete');
    if (editBtn) {
        const tr = editBtn.closest('tr');
        const table = editBtn.closest('table');
        openEditModal(table.id, tr);
    } else if (deleteBtn) {
        const tr = deleteBtn.closest('tr');
        const table = deleteBtn.closest('table');
        const id = tr.dataset.id;
        if (!id) return;
        if (!confirm("Bạn có chắc chắn muốn xóa?")) return;
        try {
            let msg = "";
            if (table.id === 'table-year') {
                await settingsService.deleteYear(id);
                msg = "Xóa năm học thành công";
            } else if (table.id === 'table-semester') {
                await settingsService.deleteSemester(id);
                msg = "Xóa học kỳ thành công";
            } else if (table.id === 'table-grade') {
                await settingsService.deleteGrade(id);
                msg = "Xóa khối lớp thành công";
            } else if (table.id === 'table-class') {
                await settingsService.deleteClass(id);
                msg = "Xóa lớp thành công";
            }
            Toast.success(msg);
            await loadAllData();
        } catch (err) {
            Toast.error(translateError(err));
        }
    }
}

function openEditModal(tableId, tr) {
    const cells = tr.querySelectorAll('td');
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const body = document.getElementById('editModalBody');

    if (tableId === 'table-year') {
        const ten = cells[0].textContent;
        const start = cells[1].textContent;
        const end = cells[2].textContent;
        title.textContent = "Chỉnh sửa năm học";
        body.innerHTML = `
            <div class="form-group">
                <label>Tên năm học</label>
                <input type="text" id="editTenNamHoc" value="${ten}" readonly style="background:#f0f0f0;">
            </div>
            <div class="form-group">
                <label>Ngày bắt đầu</label>
                <input type="text" id="editNgayBatDau" class="datepicker" value="${toVNDate(start)}">
            </div>
            <div class="form-group">
                <label>Ngày kết thúc</label>
                <input type="text" id="editNgayKetThuc" class="datepicker" value="${toVNDate(end)}">
            </div>
        `;
        editingContext = { tableId, id: ten };
        modal.style.display = "block";
        setTimeout(() => {
            setupFlatpickr('editNgayBatDau');
            setupFlatpickr('editNgayKetThuc');
        }, 100);
    } else if (tableId === 'table-class') {
        const ma = cells[0].textContent;
        const ten = cells[1].textContent;
        title.textContent = "Chỉnh sửa lớp học";
        body.innerHTML = `
            <div class="form-group">
                <label>Tên lớp</label>
                <input type="text" id="editTenLop" value="${ten}">
            </div>
            <div class="form-group">
                <label>Sĩ số</label>
                <input type="number" id="editSiSo" value="${cells[0].dataset.siso || 0}" min="0" readonly style="background:#f0f0f0;">
            </div>
        `;
        editingContext = { tableId, id: ma };
        modal.style.display = "block";
    }
}

async function saveEdit() {
    if (!editingContext) return;
    const { tableId, id } = editingContext;
    try {
        if (tableId === 'table-year') {
            const data = {
                NgayBatDau: toISODate(document.getElementById('editNgayBatDau').value),
                NgayKetThuc: toISODate(document.getElementById('editNgayKetThuc').value)
            };
            await settingsService.updateYear(id, data);
        } else if (tableId === 'table-class') {
            const ten = document.getElementById('editTenLop').value;
            const siSo = parseInt(document.getElementById('editSiSo').value) || 0;
            // await settingsService.updateClass(id, { TenLop: ten, SiSo: siSo });
        }
        const editMsgs = { 'table-year': 'Cập nhật năm học thành công', 'table-class': 'Cập nhật lớp thành công' };
        Toast.success(editMsgs[tableId] || "Cập nhật thành công");
        document.getElementById('editModal').style.display = 'none';
        editingContext = null;
        await loadAllData();
    } catch (err) {
        Toast.error(translateError(err));
    }
}

async function loadAllData() {
    const [years, semesters, grades, classes] = await Promise.all([
        settingsService.fetchYears(),
        settingsService.fetchSemesters(),
        settingsService.fetchGrades(),
        settingsService.fetchClasses()
    ]);

    const actionBtns = (showEdit = true, showDelete = true) => `
        <div class="action-group">
            ${showEdit ? `<button class="action-btn edit" title="Chỉnh sửa"><i class="fas fa-pen"></i></button>` : ''}
            ${showDelete && can(window.currentUser, "delete") ? `<button class="action-btn delete" title="Xóa"><i class="fas fa-trash"></i></button>` : ''}
        </div>
    `;

    document.querySelector('#table-year tbody').innerHTML = years.map(y => `
        <tr data-id="${y.TenNamHoc}">
            <td>${y.TenNamHoc}</td>
            <td>${y.NgayBatDau}</td>
            <td>${y.NgayKetThuc}</td>
            <td>${actionBtns()}</td>
        </tr>
    `).join('');

    document.querySelector('#table-semester tbody').innerHTML = semesters.map(s => `
        <tr>
            <td>${s.MaHocKy}</td>
            <td>${s.TenHocKy}</td>
        </tr>
    `).join('');

    document.querySelector('#table-grade tbody').innerHTML = grades.map(g => `
        <tr>
            <td>${g.MaKhoiLop}</td>
            <td>${g.TenKhoiLop}</td>
        </tr>
    `).join('');

    renderClassTable(classes);

    const selectNam = document.getElementById('SelectNamHoc');
    selectNam.innerHTML = '<option value="">Chọn năm...</option>' + 
        years.map(y => `<option value="${y.TenNamHoc}">${y.TenNamHoc}</option>`).join('');

    const selectKhoi = document.getElementById('SelectKhoi');
    selectKhoi.innerHTML = '<option value="">Chọn khối...</option>' + 
        grades.map(g => `<option value="${g.MaKhoiLop}">${g.TenKhoiLop}</option>`).join('');

    selectNam.onchange = () => renderClassTable(classes);
    selectKhoi.onchange = () => renderClassTable(classes);
}

function renderClassTable(classes) {
    const actionBtns = (showEdit = true, showDelete = true) => `
        <div class="action-group">
            ${showEdit ? `<button class="action-btn edit" title="Chỉnh sửa"><i class="fas fa-pen"></i></button>` : ''}
            ${showDelete && can(window.currentUser, "delete") ? `<button class="action-btn delete" title="Xóa"><i class="fas fa-trash"></i></button>` : ''}
        </div>
    `;

    const namFilter = document.getElementById('SelectNamHoc').value;
    const khoiFilter = document.getElementById('SelectKhoi').value;

    let filtered = [...classes];
    if (namFilter) filtered = filtered.filter(c => c.TenNamHoc === namFilter);
    if (khoiFilter) filtered = filtered.filter(c => c.MaKhoiLop === khoiFilter);

    filtered.sort((a, b) => b.TenNamHoc.localeCompare(a.TenNamHoc));

    document.querySelector('#table-class tbody').innerHTML = filtered.map(c => `
        <tr data-id="${c.MaLop}">
            <td data-siso="${c.SiSo}">${c.MaLop}</td>
            <td>${c.TenLop}</td>
            <td>${c.MaKhoiLop}</td>
            <td>${c.TenNamHoc}</td>
            <td>${actionBtns()}</td>
        </tr>
    `).join('');
}


