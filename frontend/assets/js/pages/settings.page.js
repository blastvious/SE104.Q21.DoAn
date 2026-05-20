// Đổi từ "../services/settings.service.js" thành "../service/settings.service.js"
import { settingsService } from "../service/settings.service.js"

// Helper: Chuyển DD/MM/YYYY thành YYYY-MM-DD cho Backend
const toISODate = (vnDate) => {
    const parts = vnDate.split("/");
    if (parts.length !== 3) return null;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
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

export const init = async () => {
    // 1. Khởi tạo date picker
    setupFlatpickr('NgayBatDau');
    setupFlatpickr('NgayKetThuc');

    // 2. Tải dữ liệu ban đầu
    await loadAllData();

    // 3. Xử lý Form Năm Học
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

    // 4. Xử lý Form Học Kỳ
    document.getElementById('form-semester').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const ten = document.getElementById('TenHocKy').value;
            await settingsService.createSemester(ten);
            await loadAllData();
        } catch (err) { Toast.error(err.message); }
    };

    // 5. Xử lý Form Khối
    document.getElementById('form-grade').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const ten = document.getElementById('TenKhoiLop').value;
            await settingsService.createGrade(ten);
            e.target.reset();
            await loadAllData();
        } catch (err) { Toast.error(err.message); }
    };

    // 6. Xử lý Form Lớp
    document.getElementById('form-class').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                TenLop: document.getElementById('TenLop').value,
                TenNamHoc: document.getElementById('SelectNamHoc').value,
                MaKhoiLop: document.getElementById('SelectKhoi').value,
                SiSo: 0 // Mặc định khi tạo lớp mới
            };
            await settingsService.createClass(data);
            e.target.reset();
            await loadAllData();
        } catch (err) { Toast.error(err.message); }
    };
};

async function loadAllData() {
    const [years, semesters, grades, classes] = await Promise.all([
        settingsService.fetchYears(),
        settingsService.fetchSemesters(),
        settingsService.fetchGrades(),
        settingsService.fetchClasses()
    ]);

    // Render Bảng Năm Học
    const yearBody = document.querySelector('#table-year tbody');
    yearBody.innerHTML = years.map(y => `
        <tr><td>${y.TenNamHoc}</td><td>${y.NgayBatDau}</td><td>${y.NgayKetThuc}</td></tr>
    `).join('');

    // Render Bảng Học Kỳ
    document.querySelector('#table-semester tbody').innerHTML = semesters.map(s => `
        <tr><td>${s.MaHocKy}</td><td>${s.TenHocKy}</td></tr>
    `).join('');

    // Render Bảng Khối
    document.querySelector('#table-grade tbody').innerHTML = grades.map(g => `
        <tr><td>${g.MaKhoiLop}</td><td>${g.TenKhoiLop}</td></tr>
    `).join('');

    // Render Bảng Lớp
    document.querySelector('#table-class tbody').innerHTML = classes.map(c => `

        <tr><td>${c.MaLop}</td><td>${c.TenLop}</td><td>${c.MaKhoiLop}</td><td>${c.TenNamHoc}</td></tr>
    `).join('');

    // Cập nhật các thẻ Select (Dropdown) trong form tạo Lớp
    const selectNam = document.getElementById('SelectNamHoc');
    selectNam.innerHTML = '<option value="">Chọn năm...</option>' + 
        years.map(y => `<option value="${y.TenNamHoc}">${y.TenNamHoc}</option>`).join('');

    const selectKhoi = document.getElementById('SelectKhoi');
    selectKhoi.innerHTML = '<option value="">Chọn khối...</option>' + 
        grades.map(g => `<option value="${g.MaKhoiLop}">${g.TenKhoiLop}</option>`).join('');
}