// ======================
// CONFIG
// ======================
const API_BASE = "http://localhost:5001/api/school";

// ======================
// SAFE DOM
// ======================
const $ = (id) => document.getElementById(id);

function getEl(id) {
    const el = $(id);
    if (!el) console.warn(`[DOM WARN] Missing element: ${id}`);
    return el;
}

// ======================
// API LAYER
// ======================
async function api(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    console.log("[API]", url);

    const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options
    });

    if (!res.ok) {
        let msg = "API Error";
        try {
            const err = await res.json();
            msg = err.message || msg;
        } catch {}
        console.error("[API ERROR]", url, msg);
        throw new Error(msg);
    }

    return res.json();
}

// ======================
// STATE
// ======================
const state = {
    filters: { year: "", grade: "", classId: "", subject: "", semester: "" },
    years: [], grades: [], classes: [], subjects: [], semesters: [], examTypes: [],
    students: [], scoreColumns: [],
    scoreMap: {}, originalScoreMap: {},
    dtbMap: {},
    selected: new Set(),
    pendingImport: null
};

// ======================
// UTIL
// ======================

function isFilterComplete() {
    const f = state.filters;
    return f.year && f.grade && f.classId && f.subject && f.semester;
}

function syncFilters() {
    state.filters.year     = getEl("scoreNamHoc")?.value || "";
    state.filters.grade    = getEl("scoreKhoi")?.value   || "";
    state.filters.classId  = getEl("scoreLop")?.value    || "";
    state.filters.subject  = getEl("scoreMonHoc")?.value || "";
    state.filters.semester = getEl("scoreHocKy")?.value  || "";
}

function buildExamTypeOptions() {
    return `
        <option value="">-- Chọn loại --</option>
        ${state.examTypes.map(t =>
            `<option value="${t.MaLoaiHinhKT}">${t.TenLoaiHinhKT}</option>`
        ).join("")}
    `;
}

// ======================
// UI STATE
// ======================
function updateButtons() {
    const hasData = state.students.length > 0;
    const btnImport = getEl("scoreBtnImportExcel");
    const btnSave   = getEl("scoreBtnSave");
    [btnImport, btnSave].forEach(btn => {
        if (!btn) return;
        if (hasData) {
            btn.classList.remove("btn-disabled");
        } else {
            btn.classList.add("btn-disabled");
        }
    });
}

// ======================
// LOAD MASTER DATA
// ======================
async function loadYears() {
    state.years = await api("/year");
    const el = getEl("scoreNamHoc");
    if (!el) return;
    el.innerHTML = `<option value="">-- Chọn năm học --</option>`;
    state.years.forEach(y => {
        el.innerHTML += `<option value="${y.TenNamHoc}">${y.TenNamHoc}</option>`;
    });
}

async function loadGrades() {
    state.grades = await api("/grades");
    const el = getEl("scoreKhoi");
    if (!el) return;
    el.innerHTML = `<option value="">-- Chọn khối --</option>`;
    state.grades.forEach(g => {
        el.innerHTML += `<option value="${g.MaKhoiLop}">${g.TenKhoiLop}</option>`;
    });
    el.disabled = false;
}

async function loadSubjects() {
    state.subjects = await api("/subject");
    const el = getEl("scoreMonHoc");
    if (!el) return;
    el.innerHTML = `<option value="">-- Chọn môn --</option>`;
    state.subjects.forEach(s => {
        el.innerHTML += `<option value="${s.MaMonHoc}">${s.TenMonHoc}</option>`;
    });
}

async function loadSemesters() {
    state.semesters = await api("/semester");
    const el = getEl("scoreHocKy");
    if (!el) return;
    el.innerHTML = `<option value="">-- Chọn học kỳ --</option>`;
    state.semesters.forEach(s => {
        el.innerHTML += `<option value="${s.MaHocKy}">${s.TenHocKy}</option>`;
    });
}

async function loadClasses() {
    const { year, grade } = state.filters;
    const el = getEl("scoreLop");
    if (!el) return;
    el.innerHTML = `<option value="">-- Chọn lớp --</option>`;
    if (!year || !grade) return;
    try {
        state.classes = await api("/class");
        state.classes
            .filter(c => c.TenNamHoc === year && c.MaKhoiLop === grade)
            .forEach(c => {
                el.innerHTML += `<option value="${c.MaLop}">${c.TenLop}</option>`;
            });
    } catch (err) {
        console.error("loadClasses error:", err);
    }
}

async function loadExamTypes() {
    try {
        const res = await api("/examtype");
        const data =
            Array.isArray(res)        ? res        :
            Array.isArray(res.data)   ? res.data   :
            Array.isArray(res.result) ? res.result : [];

        state.examTypes = data.filter(x =>
            x && typeof x === "object" && x.MaLoaiHinhKT && x.TenLoaiHinhKT
        );
        console.log("EXAM TYPES NORMALIZED:", state.examTypes);
    } catch (err) {
        console.error("loadExamTypes error:", err);
    }
}

// ======================
// STUDENTS + SCORES
// ======================
async function loadStudentsByClass() {
    const f = state.filters;
    try {
        const studentsRes = await api(
            `/study-process/class-list?MaLop=${f.classId}&MaHocKy=${f.semester}`
        );
        const students = Array.isArray(studentsRes) ? studentsRes : (studentsRes.data || []);
        state.students = students.map(s => ({
            MaHS:  s.HOCSINH?.MaHS  || s.MaHS,
            HoTen: s.HOCSINH?.HoTen || s.HoTen
        }));

        // Nếu không có học sinh cho học kỳ này, thử lấy từ học kỳ 1
        if (state.students.length === 0 && f.semester !== "") {
            try {
                const fallbackSem = state.semesters.find(s => s.MaHocKy !== f.semester);
                if (fallbackSem) {
                    const fallbackRes = await api(
                        `/study-process/class-list?MaLop=${f.classId}&MaHocKy=${fallbackSem.MaHocKy}`
                    );
                    const fbStudents = Array.isArray(fallbackRes) ? fallbackRes : (fallbackRes.data || []);
                    if (fbStudents.length > 0) {
                        state.students = fbStudents.map(s => ({
                            MaHS:  s.HOCSINH?.MaHS  || s.MaHS,
                            HoTen: s.HOCSINH?.HoTen || s.HoTen
                        }));
                    }
                }
            } catch (fbErr) {
                console.warn("Fallback student load failed:", fbErr);
            }
        }

        await loadScores();
    } catch (err) {
        console.error("loadStudentsByClass error:", err);
        state.students = [];
        await loadScores();
    }
}

async function loadScores() {
    const f = state.filters;

    state.scoreColumns    = [];
    state.scoreMap        = {};
    state.originalScoreMap = {};
    state.dtbMap          = {};

    const colSet = new Set();

    try {
        const res = await api(
            `/scores?MaLop=${f.classId}&MaMonHoc=${f.subject}&MaHocKy=${f.semester}`
        );

        const hsRecords = Array.isArray(res) ? res : (res.data || []);

        hsRecords.forEach(hs => {
            const maHS = hs.MaHS;
            state.dtbMap[maHS] = hs.DiemTBMon;

            (hs.loaidiem || []).forEach(loai => {
                const maLoai  = loai.MaLoaiHinhKT;
                const tenLoai = loai.TenLoaiHinhKT;

                (loai.danhSachDiem || []).forEach(({ Lan, Diem }) => {
                    const key    = `${maHS}_${maLoai}_${Lan}`;
                    state.scoreMap[key]         = Diem ?? "";
                    state.originalScoreMap[key] = Diem ?? "";

                    const colKey = `${maLoai}_${Lan}`;
                    if (!colSet.has(colKey)) {
                        colSet.add(colKey);
                        state.scoreColumns.push({ MaLoaiHinhKT: maLoai, TenLoaiHinhKT: tenLoai, Lan });
                    }
                });
            });
        });

    } catch (err) {
        if (!err.message.includes("does not exist") && !err.message.includes("404")) {
            console.error("Load scores error:", err);
        }
    }

    state.examTypes.forEach(t => {
        const colKey = `${t.MaLoaiHinhKT}_1`;
        if (!colSet.has(colKey)) {
            colSet.add(colKey);
            state.scoreColumns.push({
                MaLoaiHinhKT:  t.MaLoaiHinhKT,
                TenLoaiHinhKT: t.TenLoaiHinhKT,
                Lan: 1
            });
        }
    });

    sortScoreColumns();
    renderTable();
    updateButtons();
}

// ======================
// RENDER
// ======================
function renderTable() {
    const thead = getEl("scoreTableHead");
    const tbody = getEl("scoreTableBody");
    if (!thead || !tbody) return;

    // Group columns by exam type
    const groups = {};
    state.scoreColumns.forEach(c => {
        if (!c || !c.MaLoaiHinhKT || !c.TenLoaiHinhKT) return;
        if (!groups[c.MaLoaiHinhKT]) {
            groups[c.MaLoaiHinhKT] = { TenLoaiHinhKT: c.TenLoaiHinhKT, columns: [] };
        }
        groups[c.MaLoaiHinhKT].columns.push(c);
    });
    const groupList = Object.values(groups);

    // Row 1: group headers
    let html = `
        <tr>
            <th rowspan="2" class="col-stt" style="width:48px;">STT</th>
            <th rowspan="2" class="col-name" style="min-width:140px;text-align:left;">Họ và tên</th>
    `;

    groupList.forEach((g, idx) => {
        const colIndex = state.scoreColumns.indexOf(g.columns[0]);
        const cls = idx === groupList.length - 1 ? ' class="last-exam-group"' : '';
        html += `<th colspan="${g.columns.length}" data-colidx="${colIndex}" style="text-align:center;"${cls}>${g.TenLoaiHinhKT}</th>`;
    });

    html += `
        <th rowspan="2" style="width:80px;text-align:center;">Điểm TB</th>
    </tr>`;

    // Row 2: sub-headers (Lần X)
    html += `<tr class="header-row-2">`;
    groupList.forEach(g => {
        g.columns.forEach(c => {
            const colIndex = state.scoreColumns.indexOf(c);
            html += `<th data-colidx="${colIndex}" style="text-align:center;font-weight:400;color:var(--text-muted);font-size:0.78rem;">Lần ${c.Lan}</th>`;
        });
    });
    html += `</tr>`;

    thead.innerHTML = html;

    // Set row 2 sticky top = height of row 1
    const hdrRows = thead.querySelectorAll("tr");
    if (hdrRows.length >= 2) {
        const r1h = hdrRows[0].offsetHeight;
        hdrRows[1].querySelectorAll("th").forEach(th => {
            th.style.top = r1h + "px";
        });
    }

    tbody.innerHTML = "";

    if (!state.students.length) {
        tbody.innerHTML = `<tr><td colspan="100%" style="text-align:center;padding:24px;color:var(--text-muted);">Không có dữ liệu học sinh</td></tr>`;
        return;
    }

    state.students.forEach((s, i) => {
        const tr = document.createElement("tr");
        let row = `
            <td style="text-align:center;">${i + 1}</td>
            <td style="text-align:left;">${s.HoTen}</td>
        `;

        state.scoreColumns.forEach(c => {
            const key = `${s.MaHS}_${c.MaLoaiHinhKT}_${c.Lan}`;
            const val = state.scoreMap[key] ?? "";
            row += `
                <td style="text-align:center;">
                    <div class="score-cell"
                         contenteditable="true"
                         data-key="${key}"
                         data-mahs="${s.MaHS}"
                         data-hoten="${s.HoTen}">
                        ${val}
                    </div>
                </td>
            `;
        });

        const dtb = getDTBForStudent(s.MaHS);
        row += `
            <td class="dtb-cell" data-mahs="${s.MaHS}"
                style="text-align:center;font-weight:700;color:#1d4ed8;background:#eff6ff;">
                ${dtb}
            </td>
        `;

        tr.innerHTML = row;
        tbody.appendChild(tr);
    });

    bindCellEvents();
    markUnsavedRows();
}

// ======================
// CELL EVENTS
// ======================
function bindCellEvents() {
    document.querySelectorAll(".score-cell").forEach(el => {
        el.addEventListener("input", e => {
            const key   = e.target.dataset.key;
            const maHS  = e.target.dataset.mahs;
            const raw   = e.target.textContent.trim();
            state.scoreMap[key] = raw;

            // Cập nhật ĐTB realtime
            const dtbCell = document.querySelector(`.dtb-cell[data-mahs="${maHS}"]`);
            if (dtbCell) dtbCell.textContent = getDTBForStudent(maHS);

            const tr = e.target.closest("tr");
            if (!tr) return;
            const idx = [...tr.parentNode.children].indexOf(tr);
            const s = state.students[idx];
            if (!s) return;

            let hasInvalid = false;
            let hasUnsaved = false;

            state.scoreColumns.forEach(c => {
                const k   = `${s.MaHS}_${c.MaLoaiHinhKT}_${c.Lan}`;
                const val = (state.scoreMap[k] ?? "").toString().trim();
                if (val !== "") {
                    const diem = parseFloat(val.replace(",", "."));
                    if (isNaN(diem) || diem < 0 || diem > 10) hasInvalid = true;
                }
                if (val !== (state.originalScoreMap[k] ?? "").toString()) hasUnsaved = true;
            });

            tr.classList.toggle("row-invalid", hasInvalid);
            tr.classList.toggle("row-unsaved", !hasInvalid && hasUnsaved);
        });
    });
}

function markUnsavedRows() {
    const tbody = getEl("scoreTableBody");
    if (!tbody) return;

    tbody.querySelectorAll("tr").forEach((tr, i) => {
        const s = state.students[i];
        if (!s) return;

        let hasInvalid = false;
        let hasUnsaved = false;

        state.scoreColumns.forEach(c => {
            const key = `${s.MaHS}_${c.MaLoaiHinhKT}_${c.Lan}`;
            const val = (state.scoreMap[key] ?? "").toString().trim();

            if (val !== "") {
                const diem = parseFloat(val.replace(",", "."));
                if (isNaN(diem) || diem < 0 || diem > 10) hasInvalid = true;
            }
            if (val !== (state.originalScoreMap[key] ?? "").toString()) hasUnsaved = true;
        });

        tr.classList.toggle("row-invalid", hasInvalid);
        tr.classList.toggle("row-unsaved", !hasInvalid && hasUnsaved);
    });
}

// ======================
// FILTER EVENTS
// ======================
function bindEvents() {
    ["scoreNamHoc", "scoreKhoi", "scoreLop", "scoreMonHoc", "scoreHocKy"]
        .forEach(id => {
            getEl(id)?.addEventListener("change", async () => {
                syncFilters();
                if (id === "scoreNamHoc" || id === "scoreKhoi") await loadClasses();
                if (!isFilterComplete()) return;

                if (id === "scoreHocKy") {
                    // Chỉ đổi học kỳ → load lại điểm, giữ nguyên danh sách học sinh
                    if (state.students.length > 0) {
                        await loadScores();
                    } else {
                        await loadStudentsByClass();
                    }
                } else {
                    await loadStudentsByClass();
                }
            });
        });
}

// ======================
// MODAL HELPERS
// ======================
function openModal(id) {
    const el = getEl(id);
    if (el) el.style.display = "block";
}

function closeModal(id) {
    const el = getEl(id);
    if (el) el.style.display = "none";
}

// ======================
// MODAL: THÊM CỘT MỚI
// ======================
function bindModalAddColumn() {
    getEl("scoreBtnAddColumn")?.addEventListener("click", () => {
        const sel = getEl("popupLoaiKTAdd");
        if (sel) sel.innerHTML = buildExamTypeOptions();
        const chip = getEl("addColumnLanInfo");
        if (chip) chip.style.display = "none";
        openModal("modalAddColumn");
    });

    getEl("closeModalAddColumn")?.addEventListener("click",  () => closeModal("modalAddColumn"));
    getEl("cancelModalAddColumn")?.addEventListener("click", () => closeModal("modalAddColumn"));
    getEl("modalAddColumn")?.addEventListener("click", (e) => {
        if (e.target === getEl("modalAddColumn")) closeModal("modalAddColumn");
    });

    // Delegation — tránh mất listener khi innerHTML bị replace
    document.addEventListener("change", (e) => {
        if (e.target.id !== "popupLoaiKTAdd") return;
        const maLoai = e.target.value;
        const chip   = getEl("addColumnLanInfo");
        const text   = getEl("addColumnLanText");
        if (!maLoai) { if (chip) chip.style.display = "none"; return; }

        const existing = state.scoreColumns.filter(c => c.MaLoaiHinhKT === maLoai);
        const nextLan  = existing.length + 1;
        const tenLoai  = state.examTypes.find(t => t.MaLoaiHinhKT === maLoai)?.TenLoaiHinhKT || maLoai;

        if (text) text.textContent = `${tenLoai} — Lần ${nextLan}`;
        if (chip) chip.style.display = "flex";
    });

    getEl("confirmAddColumnBtn")?.addEventListener("click", () => {
        const maLoai = getEl("popupLoaiKTAdd")?.value;
        if (!maLoai) { Toast.warning("Vui lòng chọn loại hình kiểm tra!"); return; }

        const tenLoai  = state.examTypes.find(t => t.MaLoaiHinhKT === maLoai)?.TenLoaiHinhKT || maLoai;
        const existing = state.scoreColumns.filter(c => c.MaLoaiHinhKT === maLoai);
        const nextLan  = existing.length + 1;

        state.scoreColumns.push({ MaLoaiHinhKT: maLoai, TenLoaiHinhKT: tenLoai, Lan: nextLan });

        // ← thêm sort sau khi push
    sortScoreColumns();

        renderTable();
        closeModal("modalAddColumn");
    });
}

// ======================
// MODAL: IMPORT EXCEL
// ======================
function bindModalImportExcel() {
    getEl("scoreBtnImportExcel")?.addEventListener("click", () => {
        if (!isFilterComplete()) {
            Toast.warning("Vui lòng chọn đầy đủ thông tin lớp và môn học");
            return;
        }
        resetImportModal();
        openModal("modalImportExcel");
    });

    getEl("closeModalImport")?.addEventListener("click",  () => closeModal("modalImportExcel"));
    getEl("cancelModalImport")?.addEventListener("click", () => closeModal("modalImportExcel"));
    getEl("modalImportExcel")?.addEventListener("click", (e) => {
        if (e.target === getEl("modalImportExcel")) closeModal("modalImportExcel");
    });

    getEl("confirmImportBtn")?.addEventListener("click", async () => {
        const file = getEl("scoreFileInput")?.files?.[0];
        if (!file) { Toast.warning("Vui lòng chọn file Excel!"); return; }
        await importExcelFile(file);
    });

    document.addEventListener("change", (e) => {
        if (e.target.id === "scoreFileInput") {
            const file    = e.target.files?.[0];
            const display = getEl("fileNameDisplay");
            const nameEl  = getEl("fileNameText");
            if (file && display && nameEl) {
                nameEl.textContent    = file.name;
                display.style.display = "flex";
            }
        }
    });

    document.addEventListener("click", (e) => {
        if (e.target.closest("#btnDownloadTemplate")) {
            downloadExcelTemplate();
        }
    });
}

function bindModalImportConfirm() {
    getEl("closeModalImportConfirm")?.addEventListener("click", () => {
        state.pendingImport = null;
        closeModal("modalImportConfirm");
    });

    getEl("cancelModalImportConfirm")?.addEventListener("click", () => {
        state.pendingImport = null;
        closeModal("modalImportConfirm");
    });

    getEl("confirmImportModeBtn")?.addEventListener("click", () => {
        const mode = document.querySelector('input[name="importMode"]:checked')?.value;
        if (!state.pendingImport) return;
        const { dataRows, colMapRaw } = state.pendingImport;
        state.pendingImport = null;
        try {
            applyImportData(dataRows, colMapRaw, mode || "replace");
        } catch (err) {
            console.error("applyImportData error:", err);
            Toast.error("Lỗi xử lý dữ liệu: " + err.message);
        }
        closeModal("modalImportConfirm");
    });

    getEl("modalImportConfirm")?.addEventListener("click", (e) => {
        if (e.target === getEl("modalImportConfirm")) {
            state.pendingImport = null;
            closeModal("modalImportConfirm");
        }
    });
}

function resetImportModal() {
    const fileDisplay = getEl("fileNameDisplay");
    if (fileDisplay) fileDisplay.style.display = "none";
    const fileName = getEl("fileNameText");
    if (fileName) fileName.textContent = "";
    const fi = getEl("scoreFileInput");
    if (fi) fi.value = "";
}

// Render radio list: cột đã có + thêm mới
function renderImportColOptions(maLoai) {
    const selector  = getEl("importColSelector");
    const container = getEl("importColOptions");
    const chip      = getEl("importLanInfo");

    if (chip)      chip.style.display = "none";
    if (!selector || !container) return;

    if (!maLoai) {
        selector.style.display = "none";
        container.innerHTML    = "";
        return;
    }

    const tenLoai      = state.examTypes.find(t => t.MaLoaiHinhKT === maLoai)?.TenLoaiHinhKT || maLoai;
    const existingCols = state.scoreColumns.filter(c => c.MaLoaiHinhKT === maLoai);
    const nextLan      = existingCols.length + 1;

    let html = "";

    existingCols.forEach(c => {
        const countFilled = state.students.filter(s => {
            const key = `${s.MaHS}_${c.MaLoaiHinhKT}_${c.Lan}`;
            return (state.scoreMap[key] ?? "").toString().trim() !== "";
        }).length;

        html += `
            <label class="col-option">
                <input type="radio" name="importColChoice" value="lan_${c.Lan}">
                <div class="col-option-label">
                    <span>${tenLoai} — Lần ${c.Lan}</span>
                    <small>${countFilled > 0
                        ? `Đã có ${countFilled}/${state.students.length} điểm — import sẽ ghi đè`
                        : "Chưa có điểm nào"
                    }</small>
                </div>
            </label>
        `;
    });

    html += `
        <label class="col-option col-option-new">
            <input type="radio" name="importColChoice" value="new">
            <div class="col-option-label">
                <span><i class="fas fa-plus" style="font-size:12px;"></i> Thêm cột mới — Lần ${nextLan}</span>
                <small>Tạo cột điểm lần ${nextLan} cho ${tenLoai}</small>
            </div>
        </label>
    `;

    container.innerHTML    = html;
    selector.style.display = "block";

    // Tự chọn option đầu tiên
    const firstRadio = container.querySelector('input[type="radio"]');
    if (firstRadio) {
        firstRadio.checked = true;
        firstRadio.closest(".col-option")?.classList.add("selected");
        updateImportChip(maLoai, firstRadio.value);
    }
}

function selectColOption(label) {
    document.querySelectorAll(".col-option").forEach(el => el.classList.remove("selected"));
    label.classList.add("selected");

    const radio  = label.querySelector("input[type='radio']");
    const maLoai = getEl("popupLoaiKTImport")?.value;
    if (radio && maLoai) updateImportChip(maLoai, radio.value);
}

function updateImportChip(maLoai, choiceVal) {
    const chip    = getEl("importLanInfo");
    const text    = getEl("importLanText");
    if (!chip || !text) return;

    const tenLoai = state.examTypes.find(t => t.MaLoaiHinhKT === maLoai)?.TenLoaiHinhKT || maLoai;
    const lan     = choiceVal === "new"
        ? state.scoreColumns.filter(c => c.MaLoaiHinhKT === maLoai).length + 1
        : parseInt(choiceVal.replace("lan_", ""));

    const isNew = choiceVal === "new";
    text.textContent     = isNew
        ? `Sẽ tạo cột mới: ${tenLoai} — Lần ${lan}`
        : `Sẽ ghi đè lên: ${tenLoai} — Lần ${lan}`;

    chip.style.background   = isNew ? "#f0fdf4" : "#fef9c3";
    chip.style.borderColor  = isNew ? "#bbf7d0" : "#fde68a";
    chip.style.color        = isNew ? "#166534" : "#92400e";
    chip.style.display      = "flex";
}

// ======================
// DOWNLOAD TEMPLATE
// ======================
function downloadExcelTemplate() {
    const colHeaders = state.scoreColumns.map(c =>
        `${c.TenLoaiHinhKT} (Lần ${c.Lan})`
    );
    const headerRow = ["STT", "Họ và tên", ...colHeaders];

    if (typeof XLSX === "undefined") return;

    const rows = [headerRow];

    state.students.forEach((s, i) => {
        const rowData = [i + 1, s.HoTen];

        state.scoreColumns.forEach(c => {
            const key = `${s.MaHS}_${c.MaLoaiHinhKT}_${c.Lan}`;
            const val = (state.scoreMap[key] ?? "").toString().trim();
            rowData.push(val === "" ? "" : parseFloat(val));
        });

        rows.push(rowData);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws["!cols"] = [
        { wch: 6 }, { wch: 28 },
        ...state.scoreColumns.map(() => ({ wch: 14 }))
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Điểm");
    XLSX.writeFile(wb, "mau_diem.xlsx");
}

// ======================
// IMPORT EXCEL FILE
// ======================
async function importExcelFile(file) {
    if (typeof XLSX === "undefined") {
        Toast.error("Thư viện SheetJS chưa được tải.");
        return;
    }

    try {
        const data = await file.arrayBuffer();
        const wb   = XLSX.read(data, { type: "array" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) { Toast.warning("File không có dữ liệu."); return; }

        const headerRow = rows[0];

        // Build map: excelColIndex → { maLoai, tenLoai, lan } từ header text
        const colMapRaw = {}; // excelColIndex → { maLoai, tenLoai, lan }
        let newColCount = 0;

        for (let i = 2; i < headerRow.length; i++) {
            const header = headerRow[i];
            if (header === undefined || header === null) continue;

            const parsed = parseExcelHeader(header);
            if (!parsed) continue;

            const examType = findExamType(parsed.tenLoai);
            if (!examType) {
                console.warn(`Unknown exam type in Excel: "${parsed.tenLoai}"`);
                continue;
            }

            const exists = state.scoreColumns.some(c =>
                c.MaLoaiHinhKT === examType.MaLoaiHinhKT && c.Lan === parsed.lan
            );
            if (!exists) newColCount++;

            colMapRaw[i] = {
                maLoai: examType.MaLoaiHinhKT,
                tenLoai: examType.TenLoaiHinhKT,
                lan: parsed.lan
            };
        }

        if (Object.keys(colMapRaw).length === 0) {
            Toast.warning("Không tìm thấy cột điểm nào khớp với dữ liệu.");
            return;
        }

        console.group("📊 Import Excel debug");
        console.log("Header row:", headerRow);
        console.log("scoreColumns:", state.scoreColumns.map(c => `${c.TenLoaiHinhKT} (Lần ${c.Lan})`));
        console.log("colMapRaw (Excel col → exam type):", colMapRaw);
        console.log("New columns needed:", newColCount);
        console.log("Sample rows:", rows.slice(1, 4));
        console.groupEnd();

        const dataRows = rows.slice(1).filter(r => r.some(c => c !== "" && c !== undefined));
        if (!dataRows.length) { Toast.warning("File không có dữ liệu hợp lệ."); return; }

        // Kiểm tra xem có dữ liệu cũ không
        const hasExistingData = state.students.some(s =>
            state.scoreColumns.some(c => {
                const key = `${s.MaHS}_${c.MaLoaiHinhKT}_${c.Lan}`;
                return (state.scoreMap[key] ?? "").toString().trim() !== "";
            })
        );

        if (hasExistingData || newColCount > 0) {
            // Lưu tạm và show popup xác nhận
            state.pendingImport = { dataRows, colMapRaw };
            closeModal("modalImportExcel");

            const infoEl = document.querySelector("#modalImportConfirm .info-text");
            if (infoEl) {
                let msg = "Phát hiện dữ liệu điểm hiện có.";
                if (newColCount > 0) {
                    msg += ` File Excel có <strong>${newColCount}</strong> cột mới sẽ được thêm vào bảng.`;
                }
                infoEl.innerHTML = msg;
            }
            openModal("modalImportConfirm");
        } else {
            // Không có dữ liệu cũ → import trực tiếp
            closeModal("modalImportExcel");
            applyImportData(dataRows, colMapRaw, "replace");
        }

    } catch (err) {
        console.error("Import Excel lỗi:", err);
        Toast.error("Lỗi đọc file: " + err.message);
    }
}

function applyImportData(dataRows, colMapRaw, mode) {
    // 1. Tạo cột thiếu (chỉ sort 1 lần sau cùng, tránh lỗi vị trí)
    const newColumns = [];
    Object.values(colMapRaw).forEach(c => {
        const exists = state.scoreColumns.some(sc =>
            sc.MaLoaiHinhKT === c.maLoai && sc.Lan === c.lan
        );
        if (!exists) {
            newColumns.push({ MaLoaiHinhKT: c.maLoai, TenLoaiHinhKT: c.tenLoai, Lan: c.lan });
        }
    });
    if (newColumns.length > 0) {
        state.scoreColumns.push(...newColumns);
        sortScoreColumns();
    }

    // 2. Resolve colMapRaw → colMap (object references)
    const colMap = {};
    Object.entries(colMapRaw).forEach(([excelIdx, c]) => {
        const col = state.scoreColumns.find(sc =>
            sc.MaLoaiHinhKT === c.maLoai && sc.Lan === c.lan
        );
        if (col) colMap[excelIdx] = col;
    });

    let updatedCount = 0;
    let errorCount   = 0;
    let matchedCount = 0;

    dataRows.forEach(row => {
        const hoTen = normalizeName(row[1]);
        if (!hoTen) return;

        const student = state.students.find(s =>
            normalizeName(s.HoTen) === hoTen
        );
        if (!student) return;
        matchedCount++;

        Object.entries(colMap).forEach(([excelIdx, col]) => {
            const raw    = row[excelIdx];
            const key    = `${student.MaHS}_${col.MaLoaiHinhKT}_${col.Lan}`;
            const newVal = (raw === undefined || raw === null || raw === "")
                ? ""
                : String(raw).trim();

            if (newVal !== "") {
                const diem = parseFloat(newVal.replace(",", "."));
                if (isNaN(diem) || diem < 0 || diem > 10) {
                    errorCount++;
                    return;
                }
            }

            const oldVal = (state.scoreMap[key] ?? "").toString();

            // "keep": không ghi đè lên dữ liệu cũ
            if (mode === "keep" && oldVal !== "") return;

            if (newVal !== oldVal) {
                state.scoreMap[key] = newVal;
                updatedCount++;
            }
        });
    });

    if (matchedCount === 0) {
        if (dataRows.length === 0) {
            Toast.warning("File không có dữ liệu hợp lệ.");
        } else {
            Toast.warning(`Không tìm thấy học sinh nào khớp với dữ liệu trong file (đã đọc ${dataRows.length} dòng). Kiểm tra lại tên học sinh.`);
        }
        return;
    }

    if (errorCount > 0) {
        Toast.warning(`Có ${errorCount} ô điểm không hợp lệ (ngoài 0–10) bị bỏ qua.`);
    }

    if (updatedCount === 0 && errorCount === 0) {
        renderTable();
        return;
    }

    renderTable();

    const banner   = getEl("importSuccessBanner");
    const bannerTx = getEl("importBannerText");
    if (banner && bannerTx) {
        bannerTx.innerHTML = `
            Import thành công: cập nhật <strong>${updatedCount}</strong> ô điểm
            ${errorCount > 0 ? `, bỏ qua <strong>${errorCount}</strong> ô không hợp lệ` : ""}.
            Kiểm tra trước khi lưu dữ liệu!
        `;
        banner.style.display = "flex";
        setTimeout(() => { banner.style.display = "none"; }, 7000);
    }
}

function normalizeName(name) {
    return String(name).trim().replace(/\s+/g, " ").normalize("NFC").toLowerCase();
}

// ======================
// EXCEL HEADER PARSING
// ======================

function parseExcelHeader(text) {
    if (!text || typeof text !== "string") return null;
    const s = text.trim();
    const match = s.match(/^(.+?)\s*\([Ll]ần\s*(\d+)\)\s*$/);
    if (match) return { tenLoai: match[1].trim(), lan: parseInt(match[2], 10) };
    return { tenLoai: s, lan: 1 };
}

function normalizeText(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function findExamType(input) {
    const normalized = normalizeText(input);
    for (const t of state.examTypes) {
        if (normalizeText(t.TenLoaiHinhKT) === normalized) return t;
    }
    for (const t of state.examTypes) {
        const name = normalizeText(t.TenLoaiHinhKT);
        if (name.includes(normalized) || normalized.includes(name)) return t;
    }
    return null;
}

function findOrCreateScoreColumn(maLoai, tenLoai, lan) {
    let col = state.scoreColumns.find(c =>
        c.MaLoaiHinhKT === maLoai && c.Lan === lan
    );
    if (col) return col;
    col = { MaLoaiHinhKT: maLoai, TenLoaiHinhKT: tenLoai, Lan: lan };
    state.scoreColumns.push(col);
    return col;
}

// ======================
// IMPORT 1 CỘT TỪ EXCEL
// ======================
function triggerSingleColumnImport(col) {
    if (!col) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (file) await importSingleColumn(file, col);
        input.remove();
    }, { once: true });
    input.click();
}

async function importSingleColumn(file, col) {
    if (typeof XLSX === "undefined") { Toast.error("Thư viện SheetJS chưa được tải."); return; }

    try {
        const data = await file.arrayBuffer();
        const wb   = XLSX.read(data, { type: "array" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) { Toast.warning("File không có dữ liệu."); return; }

        const dataRows = rows.slice(1).filter(r => r.some(c => c !== "" && c !== undefined));
        if (!dataRows.length) { Toast.warning("File không có dữ liệu hợp lệ."); return; }

        let updatedCount = 0;
        let errorCount   = 0;
        let matchedCount = 0;

        dataRows.forEach(row => {
            const hoTen = normalizeName(row[1]);
            if (!hoTen) return;

            const student = state.students.find(s =>
                normalizeName(s.HoTen) === hoTen
            );
            if (!student) return;
            matchedCount++;

            const raw = row[2]; // cột C: điểm
            const key = `${student.MaHS}_${col.MaLoaiHinhKT}_${col.Lan}`;
            const newVal = (raw === undefined || raw === null || raw === "") ? "" : String(raw).trim();

            if (newVal !== "") {
                const diem = parseFloat(newVal.replace(",", "."));
                if (isNaN(diem) || diem < 0 || diem > 10) { errorCount++; return; }
            }

            if (newVal !== (state.scoreMap[key] ?? "").toString()) {
                state.scoreMap[key] = newVal;
                updatedCount++;
            }
        });

        if (matchedCount === 0) {
            if (dataRows.length === 0) {
                Toast.warning("File không có dữ liệu hợp lệ.");
            } else {
                Toast.warning(`Không tìm thấy học sinh nào khớp với dữ liệu trong file (đã đọc ${dataRows.length} dòng). Kiểm tra lại tên học sinh.`);
            }
            return;
        }

        if (errorCount > 0) {
            Toast.warning(`Có ${errorCount} ô điểm không hợp lệ (ngoài 0–10) bị bỏ qua.`);
        }
        if (updatedCount === 0 && errorCount === 0) {
            Toast.info("Không có thay đổi nào so với dữ liệu hiện tại."); return;
        }

        renderTable();
        Toast.success(`Đã import ${updatedCount} ô vào cột ${col.TenLoaiHinhKT} (Lần ${col.Lan}).`);
    } catch (err) {
        console.error("Import cột lỗi:", err);
        Toast.error("Lỗi đọc file: " + err.message);
    }
}

function bindColumnHeaderClick() {
    const table = document.querySelector(".score-table");
    if (!table) return;
    table.addEventListener("click", (e) => {
        const th = e.target.closest(".score-table th[data-colidx]");
        if (!th) return;
        if (e.target.closest(".col-resizer")) return;
        const col = state.scoreColumns[parseInt(th.dataset.colidx)];
        if (!col) return;
        triggerSingleColumnImport(col);
    });
}

// ======================
// LƯU DỮ LIỆU
// ======================
function bindSave() {
    getEl("scoreBtnSave")?.addEventListener("click", async () => {
        if (!isFilterComplete()) {
            Toast.warning("Vui lòng chọn đầy đủ thông tin lớp và môn học");
            return;
        }
        const f       = state.filters;
        const btnSave = getEl("scoreBtnSave");
        const errors  = [];

        // Validate toàn bộ trước
        state.scoreColumns.forEach(c => {
            state.students.forEach(s => {
                const key = `${s.MaHS}_${c.MaLoaiHinhKT}_${c.Lan}`;
                const raw = (state.scoreMap[key] ?? "").toString().trim();
                if (raw === "") return;

                const diem = parseFloat(raw.replace(",", "."));
                if (isNaN(diem) || diem < 0 || diem > 10) {
                    errors.push({
                        HoTen: s.HoTen,
                        TenLoaiHinhKT: c.TenLoaiHinhKT,
                        Lan: c.Lan,
                        val: raw
                    });
                    const cell = document.querySelector(`.score-cell[data-key="${key}"]`);
                    if (cell) cell.closest("tr")?.classList.add("row-invalid");
                }
            });
        });

        if (errors.length > 0) {
            const lines = errors.map(e =>
                `• ${e.HoTen} — ${e.TenLoaiHinhKT} (Lần ${e.Lan}): "${e.val}"`
            ).join("\n");
            Toast.error(`Có ${errors.length} điểm không hợp lệ (phải từ 0–10). Vui lòng kiểm tra:\n\n${lines}`);
            return;
        }

        // Nhóm theo cột
        const columnGroups = [];
        state.scoreColumns.forEach(c => {
            const danhSachDiem = [];
            state.students.forEach(s => {
                const key = `${s.MaHS}_${c.MaLoaiHinhKT}_${c.Lan}`;
                const raw = (state.scoreMap[key] ?? "").toString().trim();
                if (raw === "") return;
                danhSachDiem.push({ MaHS: s.MaHS, Diem: parseFloat(raw.replace(",", ".")) });
            });
            if (danhSachDiem.length > 0) {
                columnGroups.push({
                    MaLop:        f.classId,
                    MaMonHoc:     f.subject,
                    MaHocKy:      f.semester,
                    MaLoaiHinhKT: c.MaLoaiHinhKT,
                    Lan:          c.Lan,
                    danhSachDiem
                });
            }
        });

        if (!columnGroups.length) { Toast.warning("Chưa có điểm nào để lưu."); return; }

        try {
            if (btnSave) {
                btnSave.disabled  = true;
                btnSave.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang lưu...`;
            }

            for (const payload of columnGroups) {
                await api("/scores/bulk", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
            }

            // Cập nhật originalScoreMap
            state.scoreColumns.forEach(c => {
                state.students.forEach(s => {
                    const key = `${s.MaHS}_${c.MaLoaiHinhKT}_${c.Lan}`;
                    if (state.scoreMap[key] !== undefined) {
                        state.originalScoreMap[key] = state.scoreMap[key];
                    }
                });
            });

            markUnsavedRows();
            Toast.success(`✓ Lưu thành công!`);

        } catch (err) {
            Toast.error("Lỗi lưu điểm: " + err.message);
        } finally {
            if (btnSave) {
                btnSave.disabled  = false;
                btnSave.innerHTML = `<i class="fas fa-save"></i> Lưu dữ liệu`;
            }
        }
    });
}

// ======================
// INIT
// ======================
export async function init() {
    await Promise.all([
        loadYears(),
        loadGrades(),
        loadSubjects(),
        loadSemesters(),
        loadExamTypes()
    ]);

    requestAnimationFrame(() => {
        bindEvents();
        bindModalImportExcel();
        bindModalImportConfirm();
        bindColumnContextMenu();
        bindColumnHeaderClick();
        bindSave();
    });
}

function bindModalDeleteColumn() {
    getEl("scoreBtnDeleteColumn")?.addEventListener("click", () => {
        renderDeleteColOptions();
        openModal("modalDeleteColumn");
    });

    getEl("closeModalDeleteColumn")?.addEventListener("click",  () => closeModal("modalDeleteColumn"));
    getEl("cancelModalDeleteColumn")?.addEventListener("click", () => closeModal("modalDeleteColumn"));
    getEl("modalDeleteColumn")?.addEventListener("click", (e) => {
        if (e.target === getEl("modalDeleteColumn")) closeModal("modalDeleteColumn");
    });

    getEl("confirmDeleteColumnBtn")?.addEventListener("click", () => {
        const checked = document.querySelector('input[name="deleteColChoice"]:checked');
        if (!checked) { Toast.warning("Vui lòng chọn cột muốn xóa!"); return; }

        const [maLoai, lan] = checked.value.split("__");
        const lanNum = parseInt(lan);

        // Xóa khỏi scoreColumns
        state.scoreColumns = state.scoreColumns.filter(
            c => !(c.MaLoaiHinhKT === maLoai && c.Lan === lanNum)
        );

        // Xóa điểm khỏi scoreMap & originalScoreMap
        state.students.forEach(s => {
            const key = `${s.MaHS}_${maLoai}_${lanNum}`;
            delete state.scoreMap[key];
            delete state.originalScoreMap[key];
        });

        renderTable();
        updateButtons();
        closeModal("modalDeleteColumn");

        const banner   = getEl("importSuccessBanner");
        const bannerTx = getEl("importBannerText");
        if (banner && bannerTx) {
            const col = state.examTypes.find(t => t.MaLoaiHinhKT === maLoai);
            bannerTx.innerHTML = `Đã xóa cột <strong>${col?.TenLoaiHinhKT || maLoai} — Lần ${lanNum}</strong>. Nhấn <strong>Lưu dữ liệu</strong> để xác nhận.`;
            banner.style.display = "flex";
            setTimeout(() => { banner.style.display = "none"; }, 7000);
        }
    });
}

function renderDeleteColOptions() {
    const container = getEl("deleteColOptions");
    if (!container) return;

    if (!state.scoreColumns.length) {
        container.innerHTML = `<p style="color:var(--text-muted);font-size:14px;">Không có cột nào để xóa.</p>`;
        return;
    }

    container.innerHTML = state.scoreColumns.map((c, i) => {
        const filledCount = state.students.filter(s => {
            const key = `${s.MaHS}_${c.MaLoaiHinhKT}_${c.Lan}`;
            return (state.scoreMap[key] ?? "").toString().trim() !== "";
        }).length;

        return `
            <label class="col-option">
                <input type="radio" name="deleteColChoice" value="${c.MaLoaiHinhKT}__${c.Lan}" ${i === 0 ? "checked" : ""}>
                <div class="col-option-label">
                    <span>${c.TenLoaiHinhKT} — Lần ${c.Lan}</span>
                    <small>${filledCount > 0
                        ? `Có ${filledCount}/${state.students.length} học sinh đã có điểm`
                        : "Chưa có điểm nào"
                    }</small>
                </div>
            </label>
        `;
    }).join("");

    // Highlight option đầu tiên
    container.querySelector(".col-option")?.classList.add("selected");

    // Bind click để highlight
    container.querySelectorAll(".col-option").forEach(label => {
        label.addEventListener("click", () => {
            container.querySelectorAll(".col-option").forEach(el => el.classList.remove("selected"));
            label.classList.add("selected");
        });
    });
}
// ======================
// SORT COLUMNS
// ======================
function sortScoreColumns() {
    state.scoreColumns.sort((a, b) => {
        const maA = a?.MaLoaiHinhKT, maB = b?.MaLoaiHinhKT;
        if (!maA || !maB) return 0;
        const hesoA = state.examTypes.find(t => t.MaLoaiHinhKT === maA)?.HeSo ?? 0;
        const hesoB = state.examTypes.find(t => t.MaLoaiHinhKT === maB)?.HeSo ?? 0;
        if (hesoA !== hesoB) return hesoA - hesoB;
        if (maA !== maB) return maA.localeCompare(maB);
        return (a?.Lan ?? 0) - (b?.Lan ?? 0);
    });
}

// ======================
// CONTEXT MENU
// ======================
let contextMenuCol = null;

function bindColumnContextMenu() {
    const menu = getEl("colContextMenu");
    if (!menu) return;

    const menuAdd    = getEl("colContextAdd");
    const menuDelete = getEl("colContextDelete");

    document.addEventListener("contextmenu", (e) => {
        const th = e.target.closest(".score-table th");
        if (!th) { menu.style.display = "none"; return; }

        const colIdx = th.dataset.colidx;
        if (colIdx == null) { menu.style.display = "none"; return; }

        const col = state.scoreColumns[parseInt(colIdx)];
        if (!col) { menu.style.display = "none"; return; }

        e.preventDefault();
        contextMenuCol = col;

        const isGroup = th.hasAttribute("colspan");
        menuAdd.classList.toggle("hidden", !isGroup);
        menuDelete.classList.toggle("hidden", isGroup);

        menu.style.left = e.pageX + "px";
        menu.style.top = e.pageY + "px";
        menu.style.display = "block";
    });

    document.addEventListener("click", () => { menu.style.display = "none"; });

    menuAdd?.addEventListener("click", () => {
        menu.style.display = "none";
        if (!contextMenuCol) return;

        const maLoai  = contextMenuCol.MaLoaiHinhKT;
        const tenLoai = state.examTypes.find(t => t.MaLoaiHinhKT === maLoai)?.TenLoaiHinhKT || maLoai;
        const existing = state.scoreColumns.filter(c => c.MaLoaiHinhKT === maLoai);
        const nextLan  = existing.length + 1;

        state.scoreColumns.push({ MaLoaiHinhKT: maLoai, TenLoaiHinhKT: tenLoai, Lan: nextLan });
        sortScoreColumns();
        renderTable();
        contextMenuCol = null;
    });

    menuDelete?.addEventListener("click", () => {
        menu.style.display = "none";
        if (!contextMenuCol) return;

        const col    = contextMenuCol;
        const maLoai = col.MaLoaiHinhKT;
        const lan    = col.Lan;
        const ten    = state.examTypes.find(t => t.MaLoaiHinhKT === maLoai)?.TenLoaiHinhKT || maLoai;

        const sameTypeCount = state.scoreColumns.filter(c => c.MaLoaiHinhKT === maLoai).length;
        if (sameTypeCount <= 1) {
            Toast.warning("Chỉ có một cột của loại này, không thể xóa.");
            contextMenuCol = null;
            return;
        }

        if (!confirm(`Bạn có chắc muốn xóa cột "${ten} — Lần ${lan}" không?`)) {
            contextMenuCol = null;
            return;
        }

        // Xóa khỏi scoreColumns
        state.scoreColumns = state.scoreColumns.filter(
            c => !(c.MaLoaiHinhKT === maLoai && c.Lan === lan)
        );

        // Xóa điểm khỏi scoreMap & originalScoreMap
        state.students.forEach(s => {
            delete state.scoreMap[`${s.MaHS}_${maLoai}_${lan}`];
            delete state.originalScoreMap[`${s.MaHS}_${maLoai}_${lan}`];
        });

        // Renumber các cột cùng loại có Lan > lan vừa xóa
        state.scoreColumns
            .filter(c => c.MaLoaiHinhKT === maLoai && c.Lan > lan)
            .sort((a, b) => a.Lan - b.Lan)
            .forEach(c => {
                const oldLan = c.Lan;
                const newLan = c.Lan - 1;
                c.Lan = newLan;

                state.students.forEach(s => {
                    const oldKey = `${s.MaHS}_${maLoai}_${oldLan}`;
                    const newKey = `${s.MaHS}_${maLoai}_${newLan}`;
                    if (state.scoreMap[oldKey] !== undefined) {
                        state.scoreMap[newKey] = state.scoreMap[oldKey];
                        delete state.scoreMap[oldKey];
                    }
                    if (state.originalScoreMap[oldKey] !== undefined) {
                        state.originalScoreMap[newKey] = state.originalScoreMap[oldKey];
                        delete state.originalScoreMap[oldKey];
                    }
                });
            });

        renderTable();
        updateButtons();
        contextMenuCol = null;

        const banner   = getEl("importSuccessBanner");
        const bannerTx = getEl("importBannerText");
        if (banner && bannerTx) {
            bannerTx.innerHTML = `Đã xóa cột <strong>${ten} — Lần ${lan}</strong>. Nhấn <strong>Lưu dữ liệu</strong> để xác nhận.`;
            banner.style.display = "flex";
            setTimeout(() => { banner.style.display = "none"; }, 7000);
        }
    });
}
// ======================
function getCKExamType() {
    return state.examTypes.reduce((best, t) =>
        (t.HeSo > (best?.HeSo || 0)) ? t : best, null
    );
}

function hasAnyScore(maHS) {
    return state.scoreColumns.some(c => {
        const key = `${maHS}_${c.MaLoaiHinhKT}_${c.Lan}`;
        const val = (state.scoreMap[key] ?? "").toString().trim();
        return val !== "";
    });
}

function getDTBForStudent(maHS) {
    if (!hasAnyScore(maHS)) return "";
    return tinhDTB(maHS);
}

function tinhDTB(maHS) {
    let tongDiem = 0;
    let tongHeSo = 0;

    state.scoreColumns.forEach(c => {
        const heSo = state.examTypes.find(t => t.MaLoaiHinhKT === c.MaLoaiHinhKT)?.HeSo ?? 1;
        tongHeSo += heSo;

        const key = `${maHS}_${c.MaLoaiHinhKT}_${c.Lan}`;
        const raw = (state.scoreMap[key] ?? "").toString().trim();
        const diem = raw === "" ? 0 : parseFloat(raw.replace(",", "."));
        if (isNaN(diem)) return;

        tongDiem += diem * heSo;
    });

    if (tongHeSo === 0) return "";
    return (tongDiem / tongHeSo).toFixed(2);
}