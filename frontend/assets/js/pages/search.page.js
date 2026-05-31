const API = "http://localhost:5001/api/school";

let currentStudent = null;
let currentRow = null;
let cachedStudents = [];

export async function init() {
    setupEventListeners();

    const existing = document.querySelector("body > #modalOverlay");
    if (existing) existing.remove();
    document.body.appendChild(document.getElementById("modalOverlay"));

    window.onSearchInput = onSearchInput;
    window.selectAC      = selectAC;
    window.doSearch      = doSearch;
    window.openDetail    = openDetail;
    window.closeModal    = closeModal;
    window.closeModalBtn = closeModalBtn;
    window.exportRowPDF  = exportRowPDF;
    window.exportModalPDF = exportModalPDF;
}

function setupEventListeners() {
    document.getElementById("reportFilterBtn")?.addEventListener("click", doSearch);

    document.addEventListener("click", e => {
        if (!e.target.closest(".filter-item")) {
            document.querySelectorAll(".autocomplete-list")
                .forEach(a => a.classList.remove("show"));
        }
    });
}

export async function onSearchInput(input, type) {
    const val = input.value.trim();
    const acId = type === "ten" ? "acTen" : type === "lop" ? "acLop" : "acSdt";
    const ac = document.getElementById(acId);

    if (!val) { ac.classList.remove("show"); return; }

    try {
        const param = type === "ten"
            ? `ten=${encodeURIComponent(val)}`
            : type === "lop"
                ? `lop=${encodeURIComponent(val)}`
                : `sdt=${encodeURIComponent(val)}`;

        const res = await fetch(`${API}/search/suggest?${param}`);
        const data = await res.json();
        let results = data.data || [];

        cachedStudents = results;

        if (!results.length) { ac.classList.remove("show"); return; }

        const regex = new RegExp(`(${val})`, "gi");

        if (type === "lop") {
            const uniqueLop = [...new Map(results.map(s => [s.TenLop, s])).values()];
            ac.innerHTML = uniqueLop.slice(0, 6).map(s => {
                const highlighted = s.TenLop.replace(regex, '<span class="ac-highlight">$1</span>');
                return `<div class="ac-item" onclick="selectAC('${s.MaHS}','${type}')">
                    <span class="ac-name">${highlighted}</span>
                </div>`;
            }).join("");
        } else if (type === "sdt") {
            ac.innerHTML = results.slice(0, 6).map(s => {
                const highlighted = s.SoDienThoai.replace(regex, '<span class="ac-highlight">$1</span>');
                return `<div class="ac-item" onclick="selectAC('${s.MaHS}','${type}')">
                    <span class="ac-name">${s.HoTen}</span>
                    <span class="ac-lop">${highlighted}</span>
                </div>`;
            }).join("");
        }else {
            ac.innerHTML = results.slice(0, 6).map(s => {
                const highlighted = s.HoTen.replace(regex, '<span class="ac-highlight">$1</span>');
                return `<div class="ac-item" onclick="selectAC('${s.MaHS}','${type}')">
                    <span class="ac-name">${highlighted}</span>
                    <span class="ac-lop">${s.TenLop}</span>
                </div>`;
            }).join("");
        }

        ac.classList.add("show");
    } catch (err) {
        console.error("Lỗi autocomplete:", err);
    }
}

export function selectAC(maHS, type) {
    const s = cachedStudents.find(x => x.MaHS === maHS);
    if (!s) return;
    if (type === "ten") {
        document.getElementById("inputTen").value = s.HoTen;
        document.getElementById("acTen").classList.remove("show");
    } else if (type === "lop") {
        document.getElementById("inputLop").value = s.TenLop;
        document.getElementById("acLop").classList.remove("show");
    } else if (type === "sdt") {                              
        document.getElementById("inputSdt").value = s.SoDienThoai;
        document.getElementById("acSdt").classList.remove("show");
    }
}

export async function doSearch() {
    const ten = document.getElementById("inputTen").value.trim();
    const lop = document.getElementById("inputLop").value.trim();
    const sdt = document.getElementById("inputSdt")?.value.trim() || "";
    
    if (!ten || !lop || !sdt) { 
        Toast.warning("Vui lòng nhập đầy đủ họ tên, lớp và số điện thoại để tìm kiếm!"); 
        return; 
    }

    try {
        const params = new URLSearchParams();
        if (ten) params.append("ten", ten);
        if (lop) params.append("lop", lop);
        if (sdt) params.append("sdt", sdt);

        const res = await fetch(`${API}/search?${params}`);
        const data = await res.json();
        const results = data.data || [];

        if (!results.length) { 
            Toast.info("Không tìm thấy học sinh phù hợp"); 
            return; 
        }

        await renderStudent(results[0]);

    } catch (err) {
        console.error("Lỗi tìm kiếm:", err);
        Toast.error("Lỗi khi tìm kiếm: " + err.message);
    }
}

async function renderStudent(s) {
    currentStudent = s;

    document.getElementById("resHoTen").textContent    = s.HoTen;
    document.getElementById("resLop").textContent      = s.TenLop;
    document.getElementById("resMaHS").textContent     = s.MaHS;
    document.getElementById("resGioiTinh").textContent = s.GioiTinh;
    document.getElementById("resNgaySinh").textContent = s.NgaySinh
        ? new Date(s.NgaySinh).toLocaleDateString("vi-VN") : "--";
    document.getElementById("resDiaChi").textContent   = s.DiaChi   || "--";
    document.getElementById("resEmail").textContent    = s.Email    || "--";
    document.getElementById("resSdt").textContent      = s.SoDienThoai || "--";

    await loadHistory(s.MaHS);

    const section = document.getElementById("resultSection");
    section.style.display = "block";
    section.style.animation = "fadeIn 0.4s ease";
    section.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function loadHistory(maHS) {
    const tbody = document.getElementById("historyBody");
    tbody.innerHTML = `<div class="empty-state"><div class="empty-circle"></div>Đang tải...</div>`;

    try {
        const res = await fetch(`${API}/search/${maHS}/history`);
        const data = await res.json();
        const history = data.data || [];

        if (!history.length) {
            tbody.innerHTML = `<div class="empty-state"><div class="empty-circle"></div>Chưa có dữ liệu học tập</div>`;
            return;
        }

        let html = `<table>
            <thead><tr>
                <th>STT</th><th>Năm học</th><th>Học kỳ</th>
                <th>Lớp</th><th>ĐTB Học Kỳ</th><th>Thao tác</th>
            </tr></thead><tbody>`;

        history.forEach((h, i) => {
            const dtb = parseFloat(h.DiemTBHocKy) || 0;
            const cls = dtb >= 8 ? "score-good" : dtb >= 6.5 ? "score-avg" : "score-bad";
            html += `<tr>
                <td style="text-align:center">${i + 1}</td>
                <td>${h.TenNamHoc}</td>
                <td>${h.TenHocKy}</td>
                <td><strong>${h.TenLop}</strong></td>
                <td><span class="score-badge ${cls}">${dtb.toFixed(1)}</span></td>
                <td>
                    <div class="actions">
                        <button class="qlsv-btn qlsv-btn--outline" title="Xem chi tiết"
                            onclick="openDetail('${h.MaLop}','${h.MaHocKy}','${h.TenHocKy}','${h.TenNamHoc}',${dtb})">
                            <i class="fas fa-eye"></i> Xem
                        </button>
                        <button class="qlsv-btn qlsv-btn--blue" title="Xuất PDF"
                            onclick="exportRowPDF('${h.MaLop}','${h.MaHocKy}','${h.TenHocKy}','${h.TenNamHoc}',${dtb})">
                            <i class="fas fa-file-pdf"></i> PDF
                        </button>
                    </div>
                </td>
            </tr>`;
        });

        html += `</tbody></table>`;
        tbody.innerHTML = html;

    } catch (err) {
        console.error("Lỗi load history:", err);
        tbody.innerHTML = `<div class="empty-state"><div class="empty-circle"></div>Lỗi tải dữ liệu</div>`;
    }
}

export async function openDetail(maLop, maHocKy, tenHocKy, tenNamHoc, dtb) {
    const s = currentStudent;

    currentRow = { maLop, maHocKy, tenHocKy, tenNamHoc, dtb };

    document.getElementById("modalTitle").textContent = `Chi tiết điểm – ${tenHocKy} / ${tenNamHoc}`;
    document.getElementById("mHoTen").textContent  = s.HoTen;
    document.getElementById("mLop").textContent    = s.TenLop;
    document.getElementById("mHocKy").textContent  = tenHocKy;
    document.getElementById("mNamHoc").textContent = tenNamHoc;
    document.getElementById("mDTB").textContent    = parseFloat(dtb).toFixed(1);

    const thead = document.getElementById("modalTableHead");
    const tbody = document.getElementById("modalTableBody");
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#aaa">Đang tải...</td></tr>`;

    document.getElementById("modalOverlay").style.display = "flex";

    try {
        const res = await fetch(`${API}/search/${s.MaHS}/score?maLop=${maLop}&maHocKy=${maHocKy}`);
        const data = await res.json();
        const chiTiet = data.data?.chiTietDiem || [];
        const columns = data.data?.columns || [];

        // Cập nhật ĐTB Học Kỳ từ API (tính từ DiemTBMon, không phải QUATRINHHOC)
        const diemTBFromAPI = data.data?.thongTinHocKy?.DiemTBHocKy;
        if (diemTBFromAPI != null) {
            document.getElementById("mDTB").textContent = parseFloat(diemTBFromAPI).toFixed(1);
        }

        // Render header động theo các cột trả về từ API
        if (thead && columns.length > 0) {
            thead.innerHTML = `
                <th>STT</th>
                <th>Môn học</th>
                <th>Hệ số</th>
                ${columns.map(col => `<th>${col}</th>`).join("")}
                <th>ĐTB Môn</th>`;
        }

        const colspan = 3 + columns.length + 1;

        tbody.innerHTML = chiTiet.map((m, i) => {
            const dtbMon = parseFloat(m.DiemTBMon) || 0;
            const cls = dtbMon >= 8 ? "score-good" : dtbMon >= 6.5 ? "score-avg" : "score-bad";
            const colCells = columns.map(col =>
                `<td style="text-align:center">${m[col] ?? "--"}</td>`
            ).join("");
            return `<tr>
                <td style="text-align:center">${i + 1}</td>
                <td><strong>${m.TenMonHoc}</strong></td>
                <td style="text-align:center">${m.HeSo}</td>
                ${colCells}
                <td style="text-align:center">
                    <span class="score-badge ${cls}">${dtbMon.toFixed(1)}</span>
                </td>
            </tr>`;
        }).join("") || `<tr><td colspan="${colspan}" style="text-align:center;padding:20px;color:#aaa">Không có dữ liệu</td></tr>`;

    } catch (err) {
        console.error("Lỗi load điểm:", err);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:red">Lỗi tải dữ liệu</td></tr>`;
    }
}

export function closeModal(e) {
    if (e.target === document.getElementById("modalOverlay")) closeModalBtn();
}

export function closeModalBtn() {
    document.getElementById("modalOverlay").style.display = "none";
}

export async function exportRowPDF(maLop, maHocKy, tenHocKy, tenNamHoc, dtb) {
    const s = currentStudent;

    try {
        const res = await fetch(`${API}/search/${s.MaHS}/score?maLop=${maLop}&maHocKy=${maHocKy}`);
        const data = await res.json();
        const chiTiet = data.data?.chiTietDiem || [];
        const columns = data.data?.columns || [];

        const h = { maLop, maHocKy, tenHocKy, tenNamHoc, dtb, chiTiet, columns };
        await doExportPDF(s, h);

    } catch (err) {
        console.error("Lỗi xuất PDF:", err);
        Toast.error("Lỗi xuất PDF: " + err.message);
    }
}

export async function exportModalPDF() {
    if (!currentStudent || !currentRow) return;

    const s = currentStudent;
    const { maLop, maHocKy, tenHocKy, tenNamHoc, dtb } = currentRow;

    try {
        const res = await fetch(`${API}/search/${s.MaHS}/score?maLop=${maLop}&maHocKy=${maHocKy}`);
        const data = await res.json();
        const chiTiet = data.data?.chiTietDiem || [];
        const columns = data.data?.columns || [];
        await doExportPDF(s, { tenHocKy, tenNamHoc, dtb, chiTiet, columns });
    } catch (err) {
        console.error("Lỗi xuất PDF:", err);
        Toast.error("Lỗi xuất PDF: " + err.message);
    }
}

async function doExportPDF(s, h) {
    const d = new Date();
    const today = `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;

    const pdfColumns = h.columns || [];
    const rows = (h.chiTiet || []).map((m, i) => {
        const colCells = pdfColumns.map(col =>
            `<td style="text-align:center;border:1px solid #000;padding:6px">${m[col] ?? "--"}</td>`
        ).join("");
        return `<tr>
            <td style="text-align:center;border:1px solid #000;padding:6px">${i + 1}</td>
            <td style="border:1px solid #000;padding:6px">${m.TenMonHoc}</td>
            <td style="text-align:center;border:1px solid #000;padding:6px">${m.HeSo}</td>
            ${colCells}
            <td style="text-align:center;border:1px solid #000;padding:6px;font-weight:bold">
                ${parseFloat(m.DiemTBMon || 0).toFixed(1)}
            </td>
        </tr>`;
    }).join("");

    const pdfHtml = `
        <div style="width:794px;background:#fff;color:#000;padding:40px;font-family:'Times New Roman',serif;font-size:14px;line-height:1.6;box-sizing:border-box">
            <table style="width:100%;border:none;border-collapse:collapse;margin-bottom:20px">
                <tr>
                    <td style="width:40%;text-align:center;border:none;vertical-align:top">
                        <div style="font-weight:bold">TRƯỜNG THPT VinSchool</div>
                    </td>
                    <td style="width:60%;text-align:center;border:none;vertical-align:top">
                        <div style="font-weight:bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                        <div style="font-weight:bold;border-bottom:1px solid #000;display:inline-block;padding-bottom:2px;margin-top:4px">Độc lập - Tự do - Hạnh phúc</div>
                        <div style="font-style:italic;margin-top:6px">${today}</div>
                    </td>
                </tr>
            </table>
            <div style="text-align:center;margin:20px 0 24px">
                <div style="font-size:22px;font-weight:bold;text-transform:uppercase">BẢNG ĐIỂM CHI TIẾT</div>
                <div style="margin-top:8px">${h.tenHocKy} – Năm học <b>${h.tenNamHoc}</b></div>
            </div>
            <div style="margin-bottom:16px">
                <div><b>Mã HS:</b> ${s.MaHS}</div>
                <div><b>Họ và tên:</b> ${s.HoTen} &nbsp;&nbsp; <b>Lớp:</b> ${s.TenLop}</div>
                <div style="margin-top:4px"><b>Ngày sinh:</b> ${s.NgaySinh} &nbsp;&nbsp; <b>Giới tính:</b> ${s.GioiTinh}</div>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                    <tr style="background:#e8d5f5">
                        <th style="border:1px solid #000;padding:8px;text-align:center">STT</th>
                        <th style="border:1px solid #000;padding:8px;text-align:center">Môn học</th>
                        <th style="border:1px solid #000;padding:8px;text-align:center">Hệ số</th>
                        ${pdfColumns.map(col => `<th style="border:1px solid #000;padding:8px;text-align:center">${col}</th>`).join("")}
                        <th style="border:1px solid #000;padding:8px;text-align:center">ĐTB Môn</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
                <tfoot>
                    <tr style="font-weight:bold">
                        <td colspan="${3 + pdfColumns.length}" style="border:1px solid #000;padding:8px;text-align:right">ĐTB Học kỳ:</td>
                        <td style="border:1px solid #000;padding:8px;text-align:center">${parseFloat(h.dtb).toFixed(1)}</td>
                    </tr>
                </tfoot>
            </table>
            <table style="width:100%;border:none;border-collapse:collapse;margin-top:60px">
                <tr>
                    <td style="width:60%;border:none"></td>
                    <td style="width:40%;text-align:center;border:none;vertical-align:top">
                        <div style="font-weight:bold">Xác nhận của nhà trường</div>
                        <div style="margin-top:50px;font-style:italic">(Ký, đóng dấu)</div>
                    </td>
                </tr>
            </table>
        </div>`;

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:absolute;left:-9999px;top:0";
    wrapper.innerHTML = pdfHtml;
    document.body.appendChild(wrapper);

    await new Promise(r => setTimeout(r, 200));
    const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true, backgroundColor: "#fff" });
    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const w = 190, h2 = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, "JPEG", 10, 10, w, h2);
    pdf.save(`BangDiem_${s.MaHS}_${h.tenHocKy}_${h.tenNamHoc}.pdf`);
    document.body.removeChild(wrapper);
}
