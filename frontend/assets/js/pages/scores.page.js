const BASE_URL = "http://localhost:5001/api/school";

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const state = {
    students: [],
    scoreMap: {},
    MaLop: "",
    MaMonHoc: "",
    MaHocKy: "",
    MaLoaiHinhKT: "",
    Lan: 1,
};

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────
async function api(path, opts = {}) {
    const res = await fetch(BASE_URL + path, {
        headers: { "Content-Type": "application/json" },
        ...opts,
    });

    let data = {};
    try { data = await res.json(); } catch (_) {}

    if (!res.ok) {
        const err = new Error(data.message || `Server error ${res.status}`);
        err.status = res.status;
        throw err;
    }

    return data;
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function toast(msg, type = "success") {
    console.log(`[${type.toUpperCase()}] ${msg}`);
    if (typeof window.showToast === "function") {
        window.showToast(msg, type);
        return;
    }
    alert(msg);
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function sortByName(arr) {
    return [...arr].sort((a, b) =>
        a.HoTen.localeCompare(b.HoTen, "vi", { sensitivity: "base" })
    );
}

function isInfoComplete() {
    return !!(state.MaLop && state.MaMonHoc && state.MaHocKy && state.MaLoaiHinhKT && state.Lan);
}

// ─────────────────────────────────────────────
// UI SYNC
// ─────────────────────────────────────────────
function syncUI() {
    const ok = isInfoComplete();

    document.getElementById("scoreBtnLoad").disabled     = !ok;
    document.getElementById("scoreBtnTemplate").disabled = !ok;
    document.getElementById("scoreBtnSave").disabled     = !ok;
    document.getElementById("scoreBtnDelete").disabled   = !ok;
    document.getElementById("scoreFileInput").disabled   = !ok;

    // Cập nhật alert box
    const alertBox  = document.getElementById("scoreAlert");
    const alertText = document.getElementById("scoreAlertText");
    if (!alertBox || !alertText) return;

    if (ok) {
        alertBox.style.background   = "#f0fdf4";
        alertBox.style.borderColor  = "#bbf7d0";
        alertBox.style.color        = "#166534";
        alertBox.querySelector("i").className = "fas fa-check-circle";
        const tenLop = document.getElementById("scoreLop").selectedOptions[0]?.text || "";
        const tenMon = document.getElementById("scoreMonHoc").selectedOptions[0]?.text || "";
        const tenHK  = document.getElementById("scoreHocKy").selectedOptions[0]?.text || "";
        alertText.innerHTML = `Sẵn sàng — <strong>${tenLop}</strong> | <strong>${tenMon}</strong> | <strong>${tenHK}</strong> | Lần <strong>${state.Lan}</strong>`;
    } else {
        alertBox.style.background   = "#eaf2f7";
        alertBox.style.borderColor  = "#d4e8f2";
        alertBox.style.color        = "#2c5f7a";
        alertBox.querySelector("i").className = "fas fa-info-circle";
        alertText.innerHTML = `Vui lòng chọn đầy đủ bộ lọc: <strong>Năm học → Khối → Lớp → Môn → Học kỳ</strong> để thực hiện tác vụ.`;
    }
}

// ─────────────────────────────────────────────
// LOAD DROPDOWNS
// ─────────────────────────────────────────────
async function loadNamHoc() {
    const list = await api("/year");
    const sel  = document.getElementById("scoreNamHoc");
    list.forEach((y) => sel.appendChild(new Option(y.TenNamHoc, y.TenNamHoc)));
}

async function loadMonHoc() {
    const list = await api("/subject");
    const sel  = document.getElementById("scoreMonHoc");
    list.forEach((m) => sel.appendChild(new Option(m.TenMonHoc, m.MaMonHoc)));
}

async function loadHocKy() {
    const list = await api("/semester");
    const sel  = document.getElementById("scoreHocKy");
    list.forEach((m) => sel.appendChild(new Option(m.TenHocKy, m.MaHocKy)));
}

async function loadLoaiKT() {
    const list = await api("/examtype");
    const sel  = document.getElementById("scoreLoaiKT");
    list.forEach((m) =>
        sel.appendChild(new Option(`${m.TenLoaiHinhKT} (HS ${m.HeSo})`, m.MaLoaiHinhKT))
    );
}

async function loadLop(khoi, namHoc) {
    const sel = document.getElementById("scoreLop");
    sel.innerHTML = `<option value="">-- Chọn lớp --</option>`;
    state.MaLop = "";
    if (!khoi || !namHoc) return;

    // Map value HTML ("Lớp 10/11/12") → MaKhoiLop (KL01/KL02/KL03)
    const khoiMap = {
        "Lớp 10": "KL01",
        "Lớp 11": "KL02",
        "Lớp 12": "KL03",
        "10": "KL01", "11": "KL02", "12": "KL03",
    };
    const maKhoi = khoiMap[String(khoi)];

    try {
        const list = await api("/class");
        const filtered = list.filter((c) =>
            c.TenNamHoc === namHoc &&
            (maKhoi ? c.MaKhoiLop === maKhoi : c.TenLop.includes(khoi))
        );
        filtered.forEach((c) => sel.appendChild(new Option(c.TenLop, c.MaLop)));
    } catch (e) {
        toast("Không tải được lớp: " + e.message, "error");
    }

    syncUI();
}

// ─────────────────────────────────────────────
// LOAD STUDENTS  ← BUG 1 ĐÃ SỬA
// Lỗi cũ: chỉ gọi API điểm cũ, không gọi API lấy danh sách HS
// → state.students luôn rỗng → bảng trống
// ─────────────────────────────────────────────
async function loadStudents() {

    if (!isInfoComplete()) {
        toast("Vui lòng chọn đủ thông tin", "warning");
        return;
    }

    const btn = document.getElementById("scoreBtnLoad");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải...';

    try {
        // ── Bước 1: Lấy danh sách học sinh của lớp ──
        let enrollment = await api(
            `/study-process/class-list?MaLop=${state.MaLop}&MaHocKy=${state.MaHocKy}`
        );

        // Nếu trả về rỗng, thử lại không có MaHocKy (một số endpoint không cần)
        if (!enrollment?.length) {
            console.warn("[DEBUG] class-list với MaHocKy trả về rỗng, thử không có MaHocKy...");
            enrollment = await api(`/study-process/class-list?MaLop=${state.MaLop}`);
        }

        console.log("[DEBUG] class-list response:", enrollment);

        // Tự nhận dạng structure: [{ HOCSINH: {...} }] hoặc [{ MaHS, HoTen }]
        state.students = sortByName(
            enrollment.map((item) => item.HOCSINH ?? item)
        );
        state.scoreMap = {};

        // ── Bước 2: Load điểm cũ nếu đã có bảng điểm ──
        try {
            const oldScores = await api(
                `/scores/bang-diem-mon?MaLop=${state.MaLop}&MaMonHoc=${state.MaMonHoc}&MaHocKy=${state.MaHocKy}`
            );

            (oldScores.data || []).forEach((hs) => {
                const loai = (hs.loaidiem || []).find(
                    (l) => l.MaLoaiHinhKT === state.MaLoaiHinhKT
                );
                if (!loai) return;

                const lan = (loai.danhSachDiem || []).find(
                    (d) => Number(d.Lan) === Number(state.Lan)
                );
                if (!lan) return;

                state.scoreMap[hs.MaHS] = lan.Diem;
            });

        } catch (err) {
            // 404 = chưa có bảng điểm → bình thường, bỏ qua
            if (err.status !== 404) {
                console.warn("Không load được điểm cũ:", err.message);
            }
        }

        renderTable();
        toast(`Đã tải ${state.students.length} học sinh`, "success");

    } catch (err) {
        toast("Lỗi tải học sinh: " + err.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-search"></i> Tải danh sách';
    }
}

// ─────────────────────────────────────────────
// RENDER TABLE
// ─────────────────────────────────────────────
function renderTable() {
    const tbody = document.getElementById("scoreTableBody");

    if (!state.students.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:#94a3b8;">
            Không có dữ liệu</td></tr>`;
        return;
    }

    tbody.innerHTML = state.students.map((hs, i) => {
        const diem    = state.scoreMap[hs.MaHS];
        const hasDiem = diem != null && diem !== "";
        const badge   = hasDiem
            ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;background:#dcfce7;color:#166534;"><i class="fas fa-check"></i> Đã nhập</span>`
            : `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;background:#f1f5f9;color:#64748b;">Chưa nhập</span>`;
        return `
            <tr>
                <td style="text-align:center;">
                    <input type="checkbox" class="custom-checkbox score-check" data-mahs="${hs.MaHS}">
                </td>
                <td style="text-align:center;color:#94a3b8;font-size:13px;">${i + 1}</td>
                <td>${hs.HoTen}</td>
                <td style="text-align:center;">
                    <input type="number" min="0" max="10" step="0.01"
                        class="input-score score-input" data-mahs="${hs.MaHS}"
                        value="${hasDiem ? Number(diem).toFixed(2) : ""}">
                </td>
                <td style="text-align:center;" id="scoreBadge-${hs.MaHS}">${badge}</td>
            </tr>`;
    }).join("");

    // Gắn selectAll
    const selectAll = document.getElementById("selectAllScores");
    if (selectAll) {
        selectAll.checked = false;
        selectAll.onchange = function () {
            document.querySelectorAll(".score-check").forEach((c) => c.checked = this.checked);
        };
    }

    bindScoreEvents();
    updateStats();
}

function bindScoreEvents() {
    document.querySelectorAll(".score-input").forEach((inp) => {
        inp.addEventListener("input", (e) => {
            const mahs  = e.target.dataset.mahs;
            const value = e.target.value;

            if (value === "") {
                e.target.style.borderColor = "";
                state.scoreMap[mahs] = "";
            } else {
                const num = parseFloat(value);
                if (isNaN(num) || num < 0 || num > 10) {
                    e.target.style.borderColor = "#dc2626"; // chỉ đổi màu, không toast spam
                    return;
                }
                e.target.style.borderColor = "";
                state.scoreMap[mahs] = Number(num.toFixed(2));
            }
            updateStats();
        });

        // Format 2 chữ số thập phân khi rời ô
        inp.addEventListener("blur", (e) => {
            const num = parseFloat(e.target.value);
            if (!isNaN(num)) e.target.value = num.toFixed(2);
        });
    });
}

function updateStats() {
    const total  = state.students.length;
    const filled = Object.values(state.scoreMap).filter((x) => x !== "" && x != null).length;
    const empty  = total - filled;

    const elTotal  = document.getElementById("statTotal");
    const elFilled = document.getElementById("statFilled");
    const elEmpty  = document.getElementById("statEmpty");

    if (elTotal)  elTotal.textContent  = total;
    if (elFilled) elFilled.textContent = filled;
    if (elEmpty)  elEmpty.textContent  = empty;
}

// ─────────────────────────────────────────────
// SAVE
// ─────────────────────────────────────────────
async function saveScores() {
    try {
        const list = Object.entries(state.scoreMap)
            .filter(([, v]) => v !== "" && v != null)
            .map(([MaHS, Diem]) => ({ MaHS, Diem }));

        if (!list.length) { toast("Không có điểm để lưu", "warning"); return; }

        await api("/scores/bulk", {
            method: "POST",
            body: JSON.stringify({
                MaLop:        state.MaLop,
                MaMonHoc:     state.MaMonHoc,
                MaHocKy:      state.MaHocKy,
                MaLoaiHinhKT: state.MaLoaiHinhKT,
                Lan:          Number(state.Lan),
                danhSachDiem: list,
            }),
        });

        toast("Lưu điểm thành công", "success");

    } catch (error) {
        toast(error.message, "error");
    }
}

// ─────────────────────────────────────────────
// DELETE SELECTED
// ─────────────────────────────────────────────
function deleteSelectedScores() {
    const checked = document.querySelectorAll(".score-check:checked");
    if (!checked.length) { toast("Chưa chọn dòng nào", "warning"); return; }

    checked.forEach((c) => { state.scoreMap[c.dataset.mahs] = ""; });
    renderTable();
    toast("Đã xóa điểm được chọn", "success");
}

// ─────────────────────────────────────────────
// DOWNLOAD TEMPLATE XLSX
// ─────────────────────────────────────────────
async function downloadTemplate() {
    try {
        if (!window.XLSX) { toast("Thiếu thư viện XLSX", "error"); return; }
        if (!isInfoComplete()) { toast("Vui lòng chọn đủ thông tin", "warning"); return; }

        // Nếu chưa có danh sách HS thì tải trước
        if (!state.students.length) {
            await loadStudents();
            if (!state.students.length) return; // loadStudents đã toast lỗi
        }

        const XLSX = window.XLSX;

        // 3 cột: STT | Họ và tên | Điểm (mặc định 0.00)
        const wsData = [
            ["STT", "Họ và tên", "Điểm"],
            ...state.students.map((hs, i) => [i + 1, hs.HoTen, 0.00]),
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Độ rộng cột
        ws["!cols"] = [{ wch: 6 }, { wch: 32 }, { wch: 10 }];

        // Định dạng số 2 chữ số thập phân cho cột Điểm (từ dòng 1 trở đi, index 0)
        for (let r = 1; r <= state.students.length; r++) {
            const addr = XLSX.utils.encode_cell({ r, c: 2 });
            if (ws[addr]) {
                ws[addr].t = "n";
                ws[addr].z = "0.00";
            }
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BangDiem");
        XLSX.writeFile(wb, "mau_nhap_diem.xlsx");

        toast(`Đã tải file mẫu — ${state.students.length} học sinh`, "success");

    } catch (error) {
        toast(error.message, "error");
    }
}

// ─────────────────────────────────────────────
// UPLOAD XLSX  ← BUG 2 ĐÃ SỬA
//
// Lỗi cũ:
//   1. rows.slice(1) bỏ đúng 1 dòng header — đúng nếu file do code tạo ra.
//      Nhưng nếu người dùng mở Excel và lưu lại, một số app thêm dòng trắng
//      hoặc đổi kiểu dữ liệu khiến parseFloat(row[2]) ra NaN.
//   2. Kiểm tra `!stt` sẽ fail khi STT = 0 (không xảy ra) hoặc khi ô STT
//      là số nguyên đọc đúng nhưng cột Điểm bị đọc là string "0.00" → NaN.
//   3. Không có fallback khi state.students rỗng (chưa bấm Tải danh sách).
//
// Cách sửa:
//   - Tự động tải students nếu rỗng trước khi xử lý file.
//   - Tìm dòng header thực sự thay vì hardcode slice(1).
//   - Ép kiểu cột Điểm bằng Number() thay vì parseFloat() để xử lý
//     cả string "8.50" lẫn number 8.5 từ SheetJS.
//   - Bỏ điều kiện `!stt` gây bỏ sót dòng, thay bằng kiểm tra HoTen.
// ─────────────────────────────────────────────
async function handleUpload(file) {
    if (!file) return;
    if (!window.XLSX) { toast("Thiếu thư viện XLSX", "error"); return; }
    if (!isInfoComplete()) { toast("Vui lòng chọn đủ thông tin trước khi upload", "warning"); return; }

    // Nếu chưa load danh sách HS thì load trước
    if (!state.students.length) {
        toast("Đang tải danh sách học sinh...", "success");
        await loadStudents();
        if (!state.students.length) return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const workbook = window.XLSX.read(e.target.result, { type: "binary" });
            const sheet    = workbook.Sheets[workbook.SheetNames[0]];

            // Đọc toàn bộ sheet thành mảng các mảng (raw, không bỏ dòng nào)
            const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

            // ── Tìm dòng header thực sự ──
            // Tránh hardcode slice(1): tìm dòng chứa "Họ và tên" (hoặc "Họ và Tên")
            let headerIdx = -1;
            let iName = -1, iScore = -1, iStt = -1;

            for (let i = 0; i < rows.length; i++) {
                const normalized = rows[i].map((c) => String(c).trim().toLowerCase());
                const nameCol    = normalized.findIndex((c) =>
                    c === "họ và tên" || c === "họ và ten" || c === "hoten" || c === "ho ten"
                );
                const scoreCol   = normalized.findIndex((c) =>
                    c === "điểm" || c === "diem" || c === "score"
                );

                if (nameCol !== -1 && scoreCol !== -1) {
                    headerIdx = i;
                    iName     = nameCol;
                    iScore    = scoreCol;
                    iStt      = normalized.findIndex((c) => c === "stt");
                    break;
                }
            }

            if (headerIdx === -1) {
                toast("Không tìm thấy cột 'Họ và tên' và 'Điểm' trong file", "error");
                return;
            }

            // ── Build lookup: HoTen → MaHS (để match kể cả khi thứ tự khác) ──
            const nameToMaHS = {};
            state.students.forEach((hs, idx) => {
                // Key: tên đã normalize (lowercase, bỏ dấu thừa)
                const key = hs.HoTen.trim().toLowerCase();
                nameToMaHS[key] = { MaHS: hs.MaHS, idx };
            });

            let imported = 0;
            let skipped  = 0;

            rows.slice(headerIdx + 1).forEach((row, rowOffset) => {
                const hoTen   = String(row[iName] ?? "").trim();
                const rawDiem = row[iScore];

                // Bỏ qua dòng trống
                if (!hoTen) return;

                // ── Ép kiểu điểm đúng cách ──
                // SheetJS có thể trả về number hoặc string tùy file
                // Number("") → 0, Number("8,5") → NaN nên cần xử lý dấu phẩy
                const cleanRaw = String(rawDiem).replace(",", ".").trim();
                const diem     = cleanRaw === "" ? null : Number(cleanRaw);

                if (diem === null || isNaN(diem) || diem < 0 || diem > 10) {
                    skipped++;
                    return;
                }

                // ── Match HS: ưu tiên theo tên, fallback theo STT ──
                const key    = hoTen.toLowerCase();
                let   maHS   = nameToMaHS[key]?.MaHS;

                if (!maHS && iStt !== -1) {
                    // Fallback: dùng STT để lấy HS theo index
                    const sttVal = parseInt(row[iStt]);
                    const hs     = state.students[sttVal - 1];
                    if (hs) maHS = hs.MaHS;
                }

                if (!maHS) {
                    skipped++;
                    return;
                }

                state.scoreMap[maHS] = Number(diem.toFixed(2));
                imported++;
            });

            renderTable();

            if (skipped > 0) {
                toast(`Đã import ${imported} điểm (bỏ qua ${skipped} dòng lỗi/không khớp)`, "warning");
            } else {
                toast(`Đã import ${imported} điểm từ file Excel`, "success");
            }

        } catch (error) {
            console.error(error);
            toast("Lỗi đọc file Excel: " + error.message, "error");
        }
    };

    reader.readAsBinaryString(file);
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
export async function init() {

    // Reset state mỗi lần vào trang
    Object.assign(state, {
        students: [], scoreMap: {},
        MaLop: "", MaMonHoc: "", MaHocKy: "", MaLoaiHinhKT: "", Lan: 1,
    });

    await Promise.all([loadNamHoc(), loadMonHoc(), loadHocKy(), loadLoaiKT()]);

    syncUI();

    document.getElementById("scoreNamHoc").addEventListener("change", function () {
        document.getElementById("scoreKhoi").disabled = !this.value;
    });

    document.getElementById("scoreKhoi").addEventListener("change", function () {
        loadLop(this.value, document.getElementById("scoreNamHoc").value);
    });

    document.getElementById("scoreLop").addEventListener("change", function () {
        state.MaLop     = this.value;
        state.students  = []; // reset khi đổi lớp
        state.scoreMap  = {};
        syncUI();
    });

    document.getElementById("scoreMonHoc").addEventListener("change", function () {
        state.MaMonHoc = this.value;
        syncUI();
    });

    document.getElementById("scoreHocKy").addEventListener("change", function () {
        state.MaHocKy = this.value;
        syncUI();
    });

    document.getElementById("scoreLoaiKT").addEventListener("change", function () {
        state.MaLoaiHinhKT = this.value;
        syncUI();
    });

    document.getElementById("scoreLan").addEventListener("change", function () {
        state.Lan = Number(this.value);
        syncUI();
    });

    document.getElementById("scoreBtnLoad").addEventListener("click", loadStudents);
    document.getElementById("scoreBtnTemplate").addEventListener("click", downloadTemplate);
    document.getElementById("scoreBtnDelete").addEventListener("click", deleteSelectedScores);
    document.getElementById("scoreBtnSave").addEventListener("click", saveScores);

    document.getElementById("scoreFileInput").addEventListener("change", function () {
        if (this.files[0]) {
            handleUpload(this.files[0]);
            this.value = ""; // reset để có thể upload cùng file lần nữa
        }
    });
}
