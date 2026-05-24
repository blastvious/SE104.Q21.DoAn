import { settingsService } from "../service/settings.service.js"

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
            Toast.success("Thành công!");
            e.target.reset();
            clearFlatpickr('NgayBatDau');
            clearFlatpickr('NgayKetThuc');
            await loadAllData();
        } catch (err) { Toast.error(err.message); }
    };

    document.getElementById('form-semester').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const ten = document.getElementById('TenHocKy').value;
            await settingsService.createSemester(ten);
            await loadAllData();
        } catch (err) { Toast.error(err.message); }
    };

    document.getElementById('form-grade').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const ten = document.getElementById('TenKhoiLop').value;
            await settingsService.createGrade(ten);
            e.target.reset();
            await loadAllData();
        } catch (err) { Toast.error(err.message); }
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
            e.target.reset();
            await loadAllData();
        } catch (err) { Toast.error(err.message); }
    };

    document.getElementById('editSaveBtn').onclick = async () => {
        await saveEdit();
    };

    document.querySelectorAll('#table-year, #table-semester, #table-grade, #table-class').forEach(table => {
        table.addEventListener('click', handleTableClick);
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
            if (table.id === 'table-year') {
                await settingsService.deleteYear(id);
            } else if (table.id === 'table-semester') {
                await settingsService.deleteSemester(id);
            } else if (table.id === 'table-grade') {
                await settingsService.deleteGrade(id);
            } else if (table.id === 'table-class') {
                await settingsService.deleteClass(id);
            }
            Toast.success("Xóa thành công!");
            await loadAllData();
        } catch (err) {
            Toast.error(err.message || "Không thể xóa");
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
    } else if (tableId === 'table-semester') {
        const ma = cells[0].textContent;
        const ten = cells[1].textContent;
        title.textContent = "Chỉnh sửa học kỳ";
        body.innerHTML = `
            <div class="form-group">
                <label>Tên học kỳ</label>
                <input type="text" id="editTenHocKy" value="${ten}">
            </div>
        `;
        editingContext = { tableId, id: ma };
        modal.style.display = "block";
    } else if (tableId === 'table-grade') {
        const ma = cells[0].textContent;
        const ten = cells[1].textContent;
        title.textContent = "Chỉnh sửa khối lớp";
        body.innerHTML = `
            <div class="form-group">
                <label>Tên khối lớp</label>
                <input type="text" id="editTenKhoiLop" value="${ten}">
            </div>
        `;
        editingContext = { tableId, id: ma };
        modal.style.display = "block";
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
                <input type="number" id="editSiSo" value="${cells[0].dataset.siso || 0}" min="0">
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
        } else if (tableId === 'table-semester') {
            const ten = document.getElementById('editTenHocKy').value;
            await settingsService.updateSemester(id, { TenHocKy: ten });
        } else if (tableId === 'table-grade') {
            const ten = document.getElementById('editTenKhoiLop').value;
            await settingsService.updateGrade(id, { TenKhoiLop: ten });
        } else if (tableId === 'table-class') {
            const ten = document.getElementById('editTenLop').value;
            const siSo = parseInt(document.getElementById('editSiSo').value) || 0;
            await settingsService.updateClass(id, { TenLop: ten, SiSo: siSo });
        }
        Toast.success("Cập nhật thành công!");
        document.getElementById('editModal').style.display = 'none';
        editingContext = null;
        await loadAllData();
    } catch (err) {
        Toast.error(err.message || "Không thể cập nhật");
    }
}

async function loadAllData() {
    const [years, semesters, grades, classes] = await Promise.all([
        settingsService.fetchYears(),
        settingsService.fetchSemesters(),
        settingsService.fetchGrades(),
        settingsService.fetchClasses()
    ]);

    const actionBtns = (id) => `
        <div class="action-group">
            <button class="action-btn edit" title="Chỉnh sửa"><i class="fas fa-pen"></i></button>
            <button class="action-btn delete" title="Xóa"><i class="fas fa-trash"></i></button>
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
        <tr data-id="${s.MaHocKy}">
            <td>${s.MaHocKy}</td>
            <td>${s.TenHocKy}</td>
            <td>${actionBtns()}</td>
        </tr>
    `).join('');

    document.querySelector('#table-grade tbody').innerHTML = grades.map(g => `
        <tr data-id="${g.MaKhoiLop}">
            <td>${g.MaKhoiLop}</td>
            <td>${g.TenKhoiLop}</td>
            <td>${actionBtns()}</td>
        </tr>
    `).join('');

    document.querySelector('#table-class tbody').innerHTML = classes.map(c => `
        <tr data-id="${c.MaLop}">
            <td data-siso="${c.SiSo}">${c.MaLop}</td>
            <td>${c.TenLop}</td>
            <td>${c.MaKhoiLop}</td>
            <td>${c.TenNamHoc}</td>
            <td>${actionBtns()}</td>
        </tr>
    `).join('');

    const selectNam = document.getElementById('SelectNamHoc');
    selectNam.innerHTML = '<option value="">Chọn năm...</option>' + 
        years.map(y => `<option value="${y.TenNamHoc}">${y.TenNamHoc}</option>`).join('');

    const selectKhoi = document.getElementById('SelectKhoi');
    selectKhoi.innerHTML = '<option value="">Chọn khối...</option>' + 
        grades.map(g => `<option value="${g.MaKhoiLop}">${g.TenKhoiLop}</option>`).join('');
}
