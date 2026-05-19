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
    selected: new Set()
};

// ======================
// UTIL
// ======================
function toast(msg) { alert(msg); }

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
    const btnAdd          = getEl("scoreBtnAddColumn");
    const btnImport       = getEl("scoreBtnImportExcel");
    const btnSave         = getEl("scoreBtnSave");
    const btnDeleteColumn = getEl("scoreBtnDeleteColumn");
    if (btnAdd)          btnAdd.disabled          = !hasData;
    if (btnImport)       btnImport.disabled       = !hasData;
    if (btnSave)         btnSave.disabled         = !hasData;
    if (btnDeleteColumn) btnDeleteColumn.disabled = state.scoreColumns.length === 0;
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
    state.classes = await api("/class");
    state.classes
        .filter(c => c.TenNamHoc === year && c.MaKhoiLop === grade)
        .forEach(c => {
            el.innerHTML += `<option value="${c.MaLop}">${c.TenLop}</option>`;
        });
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
async function loadStudentsAndScores() {
    const f = state.filters;

    const studentsRes = await api(
        `/study-process/class-list?MaLop=${f.classId}&MaHocKy=${f.semester}`
    );
    const students = Array.isArray(studentsRes) ? studentsRes : (studentsRes.data || []);
    state.students = students.map(s => ({
        MaHS:  s.HOCSINH?.MaHS  || s.MaHS,
        HoTen: s.HOCSINH?.HoTen || s.HoTen
    }));

    state.scoreColumns    = [];
    state.scoreMap        = {};
    state.originalScoreMap = {};

    const colSet = new Set();

    try {
        const res = await api(
            `/scores?MaLop=${f.classId}&MaMonHoc=${f.subject}&MaHocKy=${f.semester}`
        );

        // API trả về { data: [ { MaHS, HoTen, loaidiem: [...] } ] }
        const hsRecords = Array.isArray(res) ? res : (res.data || []);

        hsRecords.forEach(hs => {
            const maHS = hs.MaHS;

            (hs.loaidiem || []).forEach(loai => {
                const maLoai  = loai.MaLoaiHinhKT;
                const tenLoai = loai.TenLoaiHinhKT;

                (loai.danhSachDiem || []).forEach(({ Lan, Diem }) => {
                    // Ghi vào scoreMap
                    const key    = `${maHS}_${maLoai}_${Lan}`;
                    state.scoreMap[key]         = Diem ?? "";
                    state.originalScoreMap[key] = Diem ?? "";

                    // Thêm cột nếu chưa có
                    const colKey = `${maLoai}_${Lan}`;
                    if (!colSet.has(colKey)) {
                        colSet.add(colKey);
                        state.scoreColumns.push({ MaLoaiHinhKT: maLoai, TenLoaiHinhKT: tenLoai, Lan });
                    }
                });
            });
        });

    } catch (err) {
        // 404 = chưa có bảng điểm → bình thường, không phải lỗi
        if (!err.message.includes("does not exist") && !err.message.includes("404")) {
            console.error("Load scores error:", err);
        }
    }

    // Luôn đảm bảo mỗi examType có ít nhất cột Lần 1
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

    state.scoreColumns.sort((a, b) => {
        const hesoA = state.examTypes.find(t => t.MaLoaiHinhKT === a.MaLoaiHinhKT)?.HeSo ?? 0;
        const hesoB = state.examTypes.find(t => t.MaLoaiHinhKT === b.MaLoaiHinhKT)?.HeSo ?? 0;
        if (hesoA !== hesoB) return hesoA - hesoB;                        // tăng dần theo hệ số
        if (a.MaLoaiHinhKT !== b.MaLoaiHinhKT)
            return a.MaLoaiHinhKT.localeCompare(b.MaLoaiHinhKT);          // cùng hệ số → theo mã
        return a.Lan - b.Lan;                                             // cùng loại → theo lần
    });

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

    let html = `
        <tr>
            <th style="width:52px;left:0;">STT</th>
            <th style="left:52px;">Họ và tên</th>
    `;

    state.scoreColumns
        .filter(c => c && c.MaLoaiHinhKT && c.TenLoaiHinhKT)
        .forEach(c => {
            html += `
                <th style="text-align:center;min-width:110px;">
                    ${c.TenLoaiHinhKT}<br>
                    <small style="font-weight:400;color:var(--text-muted);">Lần ${c.Lan}</small>
                </th>
            `;
        });

    html += `
        <th style="text-align:center;min-width:110px;">
            Điểm TB
        </th>
    `;

    html += `</tr>`;
    thead.innerHTML = html;
    tbody.innerHTML = "";

    if (!state.students.length) {
        tbody.innerHTML = `<tr><td colspan="100%" style="text-align:center;padding:24px;color:var(--text-muted);">Không có dữ liệu học sinh</td></tr>`;
        return;
    }

    state.students.forEach((s, i) => {
        const tr = document.createElement("tr");
        let row = `
            <td style="text-align:center;">${i + 1}</td>
            <td><strong>${s.HoTen}</strong></td>
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

        const dtb = tinhDTB(s.MaHS);
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
    bindColumnResize();
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
            if (dtbCell) dtbCell.textContent = tinhDTB(maHS);

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
                if (isFilterComplete()) await loadStudentsAndScores();
            });
        });
}

// ======================
// MODAL HELPERS
// ======================
function openModal(id) {
    const el = getEl(id);
    if (el) el.style.display = "flex";
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
        if (!maLoai) { toast("Vui lòng chọn loại hình kiểm tra!"); return; }

        const tenLoai  = state.examTypes.find(t => t.MaLoaiHinhKT === maLoai)?.TenLoaiHinhKT || maLoai;
        const existing = state.scoreColumns.filter(c => c.MaLoaiHinhKT === maLoai);
        const nextLan  = existing.length + 1;

        state.scoreColumns.push({ MaLoaiHinhKT: maLoai, TenLoaiHinhKT: tenLoai, Lan: nextLan });

        // ← thêm sort sau khi push
        state.scoreColumns.sort((a, b) => {
            const hesoA = state.examTypes.find(t => t.MaLoaiHinhKT === a.MaLoaiHinhKT)?.HeSo ?? 0;
            const hesoB = state.examTypes.find(t => t.MaLoaiHinhKT === b.MaLoaiHinhKT)?.HeSo ?? 0;
            if (hesoA !== hesoB) return hesoA - hesoB;
            if (a.MaLoaiHinhKT !== b.MaLoaiHinhKT)
                return a.MaLoaiHinhKT.localeCompare(b.MaLoaiHinhKT);
            return a.Lan - b.Lan;
        });

        renderTable();
        closeModal("modalAddColumn");
    });
}

// ======================
// MODAL: IMPORT EXCEL
// ======================
function bindModalImportExcel() {
    getEl("scoreBtnImportExcel")?.addEventListener("click", () => {
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
        if (!file) { toast("Vui lòng chọn file Excel!"); return; }
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
    const headerRow = ["STT", "Họ và tên", ...colHeaders, "Điểm TB"];

    const rows = [headerRow];

    state.students.forEach((s, i) => {
        const dataRow = [i + 1, s.HoTen, ...state.scoreColumns.map(c => {
            const key = `${s.MaHS}_${c.MaLoaiHinhKT}_${c.Lan}`;
            const val = state.scoreMap[key] ?? "";
            return val === "" ? "" : parseFloat(val);
        })];

        // Để trống ĐTB — sẽ gán công thức bên dưới
        dataRow.push(null);
        rows.push(dataRow);
    });

    if (typeof XLSX === "undefined") return;

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Gán công thức ĐTB cho từng dòng học sinh
    // Cột điểm bắt đầu từ C (index 2), số cột = state.scoreColumns.length
    const scoreStartCol = 2; // C
    const dtbColIdx     = scoreStartCol + state.scoreColumns.length; // cột ĐTB

    state.students.forEach((s, i) => {
        const excelRow = i + 2; // row 1 = header, data từ row 2

        // Build công thức: SUMPRODUCT(điểm * hệ số) / SUMPRODUCT(hệ số)
        // Ví dụ: =(C2*1 + D2*1 + E2*2) / (1+1+2)
        let tongHeSo = 0;
        const parts  = state.scoreColumns.map((c, ci) => {
            const heSo   = state.examTypes.find(t => t.MaLoaiHinhKT === c.MaLoaiHinhKT)?.HeSo ?? 1;
            tongHeSo    += heSo;
            const colLetter = XLSX.utils.encode_col(scoreStartCol + ci);
            return `${colLetter}${excelRow}*${heSo}`;
        });

        const formula = tongHeSo > 0
            ? `IF(COUNTA(${XLSX.utils.encode_col(scoreStartCol)}${excelRow}:${XLSX.utils.encode_col(scoreStartCol + state.scoreColumns.length - 1)}${excelRow})=0,"",ROUND((${parts.join("+")})/IF(COUNTA(${XLSX.utils.encode_col(scoreStartCol)}${excelRow}:${XLSX.utils.encode_col(scoreStartCol + state.scoreColumns.length - 1)}${excelRow})=0,1,${tongHeSo}),2))`
            : `""`;

        const dtbCellAddr = XLSX.utils.encode_cell({ r: excelRow - 1, c: dtbColIdx });
        ws[dtbCellAddr] = { t: "n", f: formula };
    });

    // Column widths
    ws["!cols"] = [
        { wch: 6 }, { wch: 28 },
        ...state.scoreColumns.map(() => ({ wch: 14 })),
        { wch: 12 }
    ];

    // Style header ĐTB (SheetJS CE không hỗ trợ style, chỉ set value)
    const dtbHeaderAddr = XLSX.utils.encode_cell({ r: 0, c: dtbColIdx });
    ws[dtbHeaderAddr] = { t: "s", v: "Điểm TB" };

    // Cập nhật range
    const range = XLSX.utils.decode_range(ws["!ref"]);
    range.e.c = Math.max(range.e.c, dtbColIdx);
    ws["!ref"] = XLSX.utils.encode_range(range);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Điểm");
    XLSX.writeFile(wb, "mau_diem.xlsx");
}

// ======================
// IMPORT EXCEL FILE
// ======================
async function importExcelFile(file) {
    if (typeof XLSX === "undefined") {
        toast("Thư viện SheetJS chưa được tải.");
        return;
    }

    try {
        const data = await file.arrayBuffer();
        const wb   = XLSX.read(data, { type: "array" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) { toast("File không có dữ liệu."); return; }

        // Đọc header row để map cột → scoreColumn
        const headerRow = rows[0];

        // Build map: colIndex → { MaLoaiHinhKT, Lan }
        // Header mẫu: ["STT", "Họ và tên", "15 PHUT", "15 PHUT (Lần 2)", "1 TIET", ...]
        // Tương ứng với scoreColumns theo thứ tự
        const colIndexMap = {}; // excelColIndex → scoreColumn index
        let scoreColIdx = 0;
        for (let i = 2; i < headerRow.length; i++) {
            if (scoreColIdx < state.scoreColumns.length) {
                colIndexMap[i] = scoreColIdx;
                scoreColIdx++;
            }
        }

        const dataRows = rows.slice(1).filter(r => r.some(c => c !== "" && c !== undefined));
        if (!dataRows.length) { toast("File không có dữ liệu hợp lệ."); return; }

        let updatedCount = 0;
        let errorCount   = 0;

        dataRows.forEach(row => {
            const hoTen = String(row[1] || "").trim();
            if (!hoTen) return;

            const student = state.students.find(s =>
                s.HoTen.trim().toLowerCase() === hoTen.toLowerCase()
            );
            if (!student) return;

            // Duyệt từng cột điểm
            Object.entries(colIndexMap).forEach(([excelIdx, scIdx]) => {
                const col  = state.scoreColumns[scIdx];
                if (!col) return;

                const raw  = row[excelIdx];
                const key  = `${student.MaHS}_${col.MaLoaiHinhKT}_${col.Lan}`;
                const newVal = (raw === undefined || raw === null || raw === "")
                    ? ""
                    : String(raw).trim();

                // Validate nếu có giá trị
                if (newVal !== "") {
                    const diem = parseFloat(newVal.replace(",", "."));
                    if (isNaN(diem) || diem < 0 || diem > 10) {
                        errorCount++;
                        return;
                    }
                }

                const oldVal = (state.scoreMap[key] ?? "").toString();

                // Chỉ update nếu thay đổi
                if (newVal !== oldVal) {
                    state.scoreMap[key] = newVal;
                    updatedCount++;
                }
            });
        });

        if (errorCount > 0) {
            toast(`Có ${errorCount} ô điểm không hợp lệ (ngoài 0–10) bị bỏ qua.`);
        }

        if (updatedCount === 0 && errorCount === 0) {
            toast("Không có thay đổi nào so với dữ liệu hiện tại.");
            return;
        }

        renderTable();
        closeModal("modalImportExcel");

        const banner   = getEl("importSuccessBanner");
        const bannerTx = getEl("importBannerText");
        if (banner && bannerTx) {
            bannerTx.innerHTML = `
                Import thành công: cập nhật <strong>${updatedCount}</strong> ô điểm
                ${errorCount > 0 ? `, bỏ qua <strong>${errorCount}</strong> ô không hợp lệ` : ""}.
                Kiểm tra trước khi lưu dữ liệu</strong>!
            `;
            banner.style.display = "flex";
            setTimeout(() => { banner.style.display = "none"; }, 7000);
        }

    } catch (err) {
        console.error("Import Excel lỗi:", err);
        toast("Lỗi đọc file: " + err.message);
    }
}

// ======================
// LƯU DỮ LIỆU
// ======================
function bindSave() {
    getEl("scoreBtnSave")?.addEventListener("click", async () => {
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
            toast(`Có ${errors.length} điểm không hợp lệ (phải từ 0–10). Vui lòng kiểm tra:\n\n${lines}`);
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

        if (!columnGroups.length) { toast("Chưa có điểm nào để lưu."); return; }

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
            toast(`✓ Lưu thành công!`);

        } catch (err) {
            toast("Lỗi lưu điểm: " + err.message);
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
        bindModalAddColumn();
        bindModalImportExcel();
        bindModalDeleteColumn();
        bindSave();
    });
}
// ======================
// RESIZABLE COLUMNS
// ======================
function bindColumnResize() {
    const table = document.querySelector(".score-table");
    if (!table) return;

    table.querySelectorAll("th").forEach(th => {
        // Tránh thêm resizer trùng
        if (th.querySelector(".col-resizer")) return;

        const resizer = document.createElement("div");
        resizer.className = "col-resizer";
        th.appendChild(resizer);

        let startX, startWidth;

        resizer.addEventListener("mousedown", (e) => {
            startX     = e.pageX;
            startWidth = th.offsetWidth;
            resizer.classList.add("resizing");

            const onMouseMove = (e) => {
                const newWidth = Math.max(60, startWidth + (e.pageX - startX));
                th.style.width    = newWidth + "px";
                th.style.minWidth = newWidth + "px";
            };

            const onMouseUp = () => {
                resizer.classList.remove("resizing");
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup",  onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup",   onMouseUp);
            e.preventDefault();
        });
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
        if (!checked) { toast("Vui lòng chọn cột muốn xóa!"); return; }

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
// TÍNH ĐIỂM TRUNG BÌNH
// ======================
function tinhDTB(maHS) {
    let tongDiem = 0;
    let tongHeSo = 0;

    state.scoreColumns.forEach(c => {
        const key  = `${maHS}_${c.MaLoaiHinhKT}_${c.Lan}`;
        const raw  = (state.scoreMap[key] ?? "").toString().trim();
        if (raw === "") return;

        const diem = parseFloat(raw.replace(",", "."));
        if (isNaN(diem)) return;

        const heSo = state.examTypes.find(t => t.MaLoaiHinhKT === c.MaLoaiHinhKT)?.HeSo ?? 1;
        tongDiem += diem * heSo;
        tongHeSo += heSo;
    });

    if (tongHeSo === 0) return "";
    return (tongDiem / tongHeSo).toFixed(2);
}