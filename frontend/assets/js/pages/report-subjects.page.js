const API = "http://localhost:5001/api/school";

export async function init() {
    await Promise.all([
        loadYears().catch(() => {}),
        loadSemesters().catch(() => {}),
        loadSubjects().catch(() => {}),
    ]);
    setupEventListeners();
    drawPieChart(0, 0);
}

function setupEventListeners() {
    document.getElementById("reportFilterBtn").addEventListener("click", loadReport);
    document.getElementById("exportPdfBtn").addEventListener("click", exportPDF);
}

async function loadYears() {
    const res = await fetch(`${API}/year`);
    const years = await res.json();
    const select = document.getElementById("reportYear");
    select.innerHTML = '<option value="">-- Chọn năm --</option>' +
        years.map(y => `<option value="${y.TenNamHoc}">${y.TenNamHoc}</option>`).join("");
}

async function loadSemesters() {
    const res = await fetch(`${API}/semester`);
    const semesters = await res.json();
    const select = document.getElementById("reportSemester");
    select.innerHTML = '<option value="">-- Chọn học kỳ --</option>' +
        semesters.map(s => `<option value="${s.MaHocKy}">${s.TenHocKy}</option>`).join("");
}

async function loadSubjects() {
    const res = await fetch(`${API}/subject`);
    const subjects = await res.json();
    const select = document.getElementById("reportSubject");
    select.innerHTML = '<option value="">-- Chọn môn --</option>' +
        subjects.map(s => `<option value="${s.MaMonHoc}">${s.TenMonHoc}</option>`).join("");
}

async function loadReport() {
    const MaMonHoc = document.getElementById("reportSubject").value;
    const MaHocKy = document.getElementById("reportSemester").value;
    const TenNamHoc = document.getElementById("reportYear").value;

    if (!MaMonHoc || !MaHocKy || !TenNamHoc) {
        Toast.warning("Vui lòng chọn đầy đủ Năm học, Học kỳ và Môn học");
        return;
    }

    try {
        const res = await fetch(`${API}/report-subjects`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ TenNamHoc, MaHocKy, MaMonHoc })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Lỗi khi tạo báo cáo");
        }

        const response = await res.json();
        const data = response.data;
        const details = data.details || [];

        const tbody = document.getElementById("reportTableBody");

        if (details.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-table">Không có lớp nào trong năm học này</td></tr>';
            document.getElementById("reportTableFoot").style.display = "none";
            document.getElementById("summaryTotalSiSo").textContent = "--";
            document.getElementById("summaryTotalDat").textContent = "--";
            document.getElementById("summaryTiLe").textContent = "--";
            drawPieChart(0, 0);
            return;
        }

        let rows = "";
        const isDark = document.body.classList.contains("dark-mode");
        details.forEach((d, i) => {
            const tiLe = d.TiLeDat;
            const tleColor = tiLe >= 50
                ? (isDark ? '#22c55e' : '#16a34a')
                : (isDark ? '#ef4444' : '#dc2626');
            rows += `<tr>
                <td style="text-align:center">${i + 1}</td>
                <td>${d.TenLop}</td>
                <td style="text-align:center">${d.SiSo}</td>
                <td style="text-align:center">${d.SoLuongDat}</td>
                <td style="text-align:center;font-weight:600;color:${tleColor}">${tiLe}%</td>
            </tr>`;
        });

        tbody.innerHTML = rows;

        document.getElementById("summaryTotalSiSo").textContent = data.TongSiSo;
        document.getElementById("summaryTotalDat").textContent = data.TongSoLuongDat;
        document.getElementById("summaryTiLe").textContent = `${data.TongTiLeDat}%`;

        document.getElementById("totalSiSo").textContent = data.TongSiSo;
        document.getElementById("totalDat").textContent = data.TongSoLuongDat;
        document.getElementById("totalTiLe").textContent = `${data.TongTiLeDat}%`;
        document.getElementById("reportTableFoot").style.display = "table-footer-group";
        document.getElementById("exportPdfBtn").dataset.maBCTKMon = data.MaBCTKMon;

        drawPieChart(data.TongSoLuongDat, data.TongSiSo - data.TongSoLuongDat);
    } catch (error) {
        console.error(error);
        Toast.error("Lỗi khi tải báo cáo: " + error.message);
    }
}

async function exportPDF() {
    const btn = document.getElementById("exportPdfBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xuất...';

    const TenNamHoc = document.getElementById("reportYear").value;
    const MaHocKy = document.getElementById("reportSemester").value;
    const TenHocKy = document.getElementById("reportSemester").selectedOptions[0]?.text || "";
    const TenMonHoc = document.getElementById("reportSubject").selectedOptions[0]?.text || "";

    const totalSiSo = document.getElementById("summaryTotalSiSo").textContent;
    const totalDat = document.getElementById("summaryTotalDat").textContent;
    const tiLe = document.getElementById("summaryTiLe").textContent;

    const MaBCTKMon = document.getElementById("exportPdfBtn").dataset.maBCTKMon || "";

    const tbody = document.getElementById("reportTableBody");
    const rows = tbody.querySelectorAll("tr");
    const tongSoLop = rows.length;

    let tableRows = "";
    rows.forEach((tr) => {
        const tds = tr.querySelectorAll("td");
        if (tds.length === 5) {
            tableRows += `<tr>
                <td style="text-align:center;padding:6px 8px;border:1px solid #000;font-size:13pt">${tds[0].textContent}</td>
                <td style="padding:6px 8px;border:1px solid #000;font-size:13pt">${tds[1].textContent}</td>
                <td style="text-align:center;padding:6px 8px;border:1px solid #000;font-size:13pt">${tds[2].textContent}</td>
                <td style="text-align:center;padding:6px 8px;border:1px solid #000;font-size:13pt">${tds[3].textContent}</td>
                <td style="text-align:center;padding:6px 8px;border:1px solid #000;font-size:13pt">${tds[4].textContent}</td>
            </tr>`;
        }
    });

    const days = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
    const d = new Date();
    const todayStr = `${days[d.getDay()]}, ngày ${String(d.getDate()).padStart(2,'0')} tháng ${String(d.getMonth()+1).padStart(2,'0')} năm ${d.getFullYear()}`;

    const pdfHtml = `
        <div style="padding:30px 40px;font-family:'Times New Roman',serif;color:#000;font-size:13pt;line-height:1.4">
            <table style="width:100%;border-collapse:collapse;border:none;margin-bottom:20px">
                <tr>
                    <td style="width:40%;text-align:center;border:none;vertical-align:top;padding:0">
                        <div style="font-weight:bold;font-size:13pt">TRƯỜNG THPT VinSchool</div>
                        <div style="font-weight:bold;font-style:italic;font-size:13pt;margin-top:2px">Mã báo cáo: #${MaBCTKMon}</div>
                    </td>
                    <td style="width:60%;text-align:center;border:none;vertical-align:top;padding:0">
                        <div style="font-weight:bold;font-size:13pt">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                        <div style="font-weight:bold;font-size:13pt;margin-top:2px;border-bottom:1px solid #000;display:inline-block;padding-bottom:2px">Độc lập - Tự do - Hạnh phúc</div>
                        <div style="font-style:italic;font-size:13pt;margin-top:2px">${todayStr}</div>
                    </td>
                </tr>
            </table>

            <h2 style="text-align:center;font-size:18pt;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px">BÁO CÁO TỔNG KẾT MÔN HỌC</h2>
            <div style="text-align:center;font-size:13pt;margin-bottom:16px">
                <div>Năm học: <b>${TenNamHoc}</b></div>
                <div>Học kỳ: <b>${TenHocKy.replace(/^Học\s?Kỳ\s*/i, '')}</b></div>
                <div>Môn học: <b>${TenMonHoc}</b></div>
            </div>

            <div style="margin-bottom:16px;font-size:13pt">
                <div style="font-weight:bold;margin-bottom:6px">I. THÔNG TIN CHUNG</div>
                <div style="margin-left:20px">
                    <div>Tổng số lớp: <b>${tongSoLop}</b></div>
                    <div>Tổng số học sinh: <b>${totalSiSo}</b></div>
                    <div>Tỉ lệ đạt chung: <b>${tiLe}</b></div>
                </div>
            </div>

            <div style="margin-bottom:6px;font-size:13pt">
                <div style="font-weight:bold;margin-bottom:6px">II. CHI TIẾT THEO LỚP</div>
            </div>

            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13pt">
                <thead>
                    <tr>
                        <th style="text-align:center;padding:8px;border:1px solid #000;width:40px;font-weight:bold;background:white;font-size:14pt;color:#000">STT</th>
                        <th style="text-align:center;padding:8px;border:1px solid #000;font-weight:bold;background:white;font-size:14pt;color:#000">Tên Lớp</th>
                        <th style="text-align:center;padding:8px;border:1px solid #000;width:60px;font-weight:bold;background:white;font-size:14pt;color:#000">Sĩ Số</th>
                        <th style="text-align:center;padding:8px;border:1px solid #000;width:70px;font-weight:bold;background:white;font-size:14pt;color:#000">SL Đạt</th>
                        <th style="text-align:center;padding:8px;border:1px solid #000;width:80px;font-weight:bold;background:white;font-size:14pt;color:#000">Tỉ Lệ (%)</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
                <tfoot>
                    <tr style="font-weight:bold;font-size:14pt">
                        <td style="text-align:center;padding:8px;border:1px solid #000"></td>
                        <td style="padding:8px;border:1px solid #000">Tổng cộng</td>
                        <td style="text-align:center;padding:8px;border:1px solid #000">${totalSiSo}</td>
                        <td style="text-align:center;padding:8px;border:1px solid #000">${totalDat}</td>
                        <td style="text-align:center;padding:8px;border:1px solid #000">${tiLe}</td>
                    </tr>
                </tfoot>
            </table>

            <div style="display:flex;justify-content:space-between;margin-top:24px;font-size:13pt">
                <div style="text-align:center;width:45%">
                    <div style="font-weight:bold;margin-top:4px">Người lập báo cáo</div>
                    <div style="margin-top:36px;font-style:italic">(Ký, ghi rõ họ tên)</div>
                </div>
                <div style="text-align:center;width:45%">
                    <div style="font-weight:bold;margin-top:4px">Xác nhận của nhà trường</div>
                    <div style="margin-top:36px;font-style:italic">(Ký, đóng dấu)</div>
                </div>
            </div>
        </div>
    `;

    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "0";
    wrapper.style.width = "794px";
    wrapper.style.background = "white";
    wrapper.innerHTML = pdfHtml;
    document.body.appendChild(wrapper);

    try {
        await new Promise(resolve => setTimeout(resolve, 200));

        const canvas = await html2canvas(wrapper, {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            width: 794,
            windowWidth: 794,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("portrait", "mm", "a4");
        const pdfW = 190;
        const pdfH = (canvas.height * pdfW) / canvas.width;

        let heightLeft = pdfH;
        let position = 8;

        pdf.addImage(imgData, "JPEG", 10, position, pdfW, pdfH);
        heightLeft -= 277;

        while (heightLeft > 0) {
            position = heightLeft - pdfH + 8;
            pdf.addPage();
            pdf.addImage(imgData, "JPEG", 10, position, pdfW, pdfH);
            heightLeft -= 277;
        }

        pdf.save(`BaoCaoMonHoc_${TenMonHoc}_${TenNamHoc}.pdf`);
    } catch (err) {
        console.error("PDF error:", err);
        Toast.error("Lỗi xuất PDF: " + err.message);
    }

    document.body.removeChild(wrapper);
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-file-pdf"></i> Xuất PDF';
}

function drawPieChart(dat, khongDat) {
    const canvas = document.getElementById("reportPieChart");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const size = 200;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.scale(dpr, dpr);

    const isDark = document.body.classList.contains("dark-mode");

    const cx = size / 2;
    const cy = size / 2;
    const r = 80;

    ctx.clearRect(0, 0, size, size);

    const total = dat + khongDat;
    if (total === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? "#1a2e40" : "#e5e7eb";
        ctx.fill();
        ctx.fillStyle = isDark ? "#7a9ab0" : "#6b7280";
        ctx.font = "14px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Không có dữ liệu", cx, cy);
        return;
    }

    const datAngle = (dat / total) * Math.PI * 2;
    const khongDatAngle = (khongDat / total) * Math.PI * 2;

    const colors = ["#22c55e", "#f43f5e"];
    const slices = [
        { value: dat, color: colors[0], label: "Đạt" },
        { value: khongDat, color: colors[1], label: "Chưa đạt" },
    ];

    let startAngle = -Math.PI / 2;
    for (const slice of slices) {
        if (slice.value === 0) continue;
        const sliceAngle = (slice.value / total) * Math.PI * 2;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = slice.color;
        ctx.fill();

        const midAngle = startAngle + sliceAngle / 2;
        const labelR = r * 0.65;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;

        ctx.fillStyle = "white";
        ctx.font = "bold 12px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (slice.value / total > 0.08) {
            ctx.fillText(`${((slice.value / total) * 100).toFixed(0)}%`, lx, ly);
        }

        startAngle += sliceAngle;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? "#1a2e40" : "white";
    ctx.fill();

    ctx.fillStyle = isDark ? "#c8dce8" : "#2c3e50";
    ctx.font = "bold 18px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${total}`, cx, cy - 6);
    ctx.font = "11px 'Segoe UI', sans-serif";
    ctx.fillStyle = isDark ? "#7a9ab0" : "#5a7080";
    ctx.fillText("HS", cx, cy + 14);

    const legendEl = document.getElementById("chartLegend");
    legendEl.innerHTML = slices.map(s => `
        <div class="legend-item">
            <span class="legend-dot" style="background:${s.color}"></span>
            <span class="legend-label">${s.label}</span>
            <span class="legend-value">${s.value}</span>
        </div>
    `).join("");
}
