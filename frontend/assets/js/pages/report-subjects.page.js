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
        alert("Vui lòng chọn đầy đủ Năm học, Học kỳ và Môn học");
        return;
    }

    try {
        const classesRes = await fetch(`${API}/class`);
        const allClasses = await classesRes.json();

        const diemDatMon = 5.0;
        const filteredClasses = allClasses.filter(c => c.TenNamHoc === TenNamHoc);
        filteredClasses.sort((a, b) => a.TenLop.localeCompare(b.TenLop));

        const tbody = document.getElementById("reportTableBody");

        if (filteredClasses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-table">Không có lớp nào trong năm học này</td></tr>';
            document.getElementById("reportTableFoot").style.display = "none";
            document.getElementById("summaryTotalSiSo").textContent = "--";
            document.getElementById("summaryTotalDat").textContent = "--";
            document.getElementById("summaryTiLe").textContent = "--";
            drawPieChart(0, 0);
            return;
        }

        let totalSiSo = 0;
        let totalDat = 0;
        let rows = "";

        for (let i = 0; i < filteredClasses.length; i++) {
            const c = filteredClasses[i];
            const siSo = c.SiSo || 0;

            try {
                const scoreRes = await fetch(`${API}/scores?MaLop=${c.MaLop}&MaMonHoc=${MaMonHoc}&MaHocKy=${MaHocKy}`);
                if (!scoreRes.ok) throw new Error("Không tìm thấy");
                const scoreData = await scoreRes.json();
                const students = scoreData.data || [];

                const soLuongDat = students.filter(s => (s.DiemTBMon ?? 0) >= diemDatMon).length;

                totalSiSo += siSo;
                totalDat += soLuongDat;
                const tiLe = siSo > 0 ? ((soLuongDat / siSo) * 100).toFixed(1) : 0;

                rows += `<tr>
                    <td style="text-align:center">${i + 1}</td>
                    <td>${c.TenLop}</td>
                    <td style="text-align:center">${siSo}</td>
                    <td style="text-align:center">${soLuongDat}</td>
                    <td style="text-align:center;font-weight:600;color:${tiLe >= 50 ? '#16a34a' : '#dc2626'}">${tiLe}%</td>
                </tr>`;
            } catch {
                totalSiSo += siSo;
                rows += `<tr>
                    <td style="text-align:center">${i + 1}</td>
                    <td>${c.TenLop}</td>
                    <td style="text-align:center">${siSo}</td>
                    <td style="text-align:center">--</td>
                    <td style="text-align:center">--</td>
                </tr>`;
            }
        }

        tbody.innerHTML = rows;
        const overallTiLe = totalSiSo > 0 ? ((totalDat / totalSiSo) * 100).toFixed(1) : 0;

        document.getElementById("summaryTotalSiSo").textContent = totalSiSo;
        document.getElementById("summaryTotalDat").textContent = totalDat;
        document.getElementById("summaryTiLe").textContent = `${overallTiLe}%`;

        document.getElementById("totalSiSo").textContent = totalSiSo;
        document.getElementById("totalDat").textContent = totalDat;
        document.getElementById("totalTiLe").textContent = `${overallTiLe}%`;
        document.getElementById("reportTableFoot").style.display = "table-footer-group";

        drawPieChart(totalDat, totalSiSo - totalDat);
    } catch (error) {
        console.error(error);
        alert("Lỗi khi tải báo cáo: " + error.message);
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

    const tbody = document.getElementById("reportTableBody");
    const rows = tbody.querySelectorAll("tr");

    let tableRows = "";
    rows.forEach((tr, i) => {
        const tds = tr.querySelectorAll("td");
        if (tds.length === 5) {
            tableRows += `<tr>
                <td style="text-align:center;padding:6px 8px;border:1px solid #ddd;font-size:11px">${tds[0].textContent}</td>
                <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px">${tds[1].textContent}</td>
                <td style="text-align:center;padding:6px 8px;border:1px solid #ddd;font-size:11px">${tds[2].textContent}</td>
                <td style="text-align:center;padding:6px 8px;border:1px solid #ddd;font-size:11px">${tds[3].textContent}</td>
                <td style="text-align:center;padding:6px 8px;border:1px solid #ddd;font-size:11px">${tds[4].textContent}</td>
            </tr>`;
        }
    });

    const today = new Date().toLocaleDateString("vi-VN");

    const pdfHtml = `
        <div style="padding:30px 40px;font-family:'Times New Roman',serif;color:#222">
            <div style="display:flex;justify-content:space-between;margin-bottom:20px;font-size:11px">
                <div style="text-align:left">
                    <div style="font-weight:bold">TRƯỜNG ...</div>
                    <div>---</div>
                </div>
                <div style="text-align:center;font-weight:bold">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
            </div>
            <div style="text-align:right;font-size:11px;font-style:italic;margin-bottom:20px">Độc lập - Tự do - Hạnh phúc</div>

            <h2 style="text-align:center;font-size:18px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px">BÁO CÁO MÔN HỌC THEO LỚP</h2>
            <div style="text-align:center;font-size:13px;margin-bottom:20px;color:#555">
                Năm học: <b>${TenNamHoc}</b> | Học kỳ: <b>${TenHocKy}</b> | Môn học: <b>${TenMonHoc}</b>
            </div>

            <div style="display:flex;gap:40px;justify-content:center;margin-bottom:20px;font-size:12px">
                <div><b>Tổng sĩ số:</b> ${totalSiSo}</div>
                <div><b>Số lượng đạt:</b> ${totalDat}</div>
                <div><b>Tỉ lệ đạt:</b> ${tiLe}</div>
            </div>

            <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
                <thead>
                    <tr style="background:#6b21a8;color:white">
                        <th style="text-align:center;padding:8px;border:1px solid #6b21a8;font-size:12px;width:40px">STT</th>
                        <th style="padding:8px;border:1px solid #6b21a8;font-size:12px">Lớp</th>
                        <th style="text-align:center;padding:8px;border:1px solid #6b21a8;font-size:12px;width:70px">Sĩ số</th>
                        <th style="text-align:center;padding:8px;border:1px solid #6b21a8;font-size:12px;width:90px">SL đạt</th>
                        <th style="text-align:center;padding:8px;border:1px solid #6b21a8;font-size:12px;width:80px">Tỉ lệ</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
                <tfoot>
                    <tr style="background:#f3e8ff;font-weight:bold">
                        <td style="text-align:center;padding:8px;border:1px solid #ddd;font-size:12px"></td>
                        <td style="padding:8px;border:1px solid #ddd;font-size:12px;color:#6b21a8">Tổng cộng</td>
                        <td style="text-align:center;padding:8px;border:1px solid #ddd;font-size:12px">${totalSiSo}</td>
                        <td style="text-align:center;padding:8px;border:1px solid #ddd;font-size:12px">${totalDat}</td>
                        <td style="text-align:center;padding:8px;border:1px solid #ddd;font-size:12px">${tiLe}</td>
                    </tr>
                </tfoot>
            </table>

            <div style="display:flex;justify-content:space-between;margin-top:30px;font-size:12px">
                <div style="text-align:center">
                    <div>Ngày ... tháng ... năm ...</div>
                    <div style="font-weight:bold;margin-top:4px">Người lập báo cáo</div>
                    <div style="margin-top:40px;font-style:italic">(Ký, ghi rõ họ tên)</div>
                </div>
                <div style="text-align:center">
                    <div>Ngày ${today}</div>
                    <div style="font-weight:bold;margin-top:4px">Xác nhận của nhà trường</div>
                    <div style="margin-top:40px;font-style:italic">(Ký, đóng dấu)</div>
                </div>
            </div>
        </div>
    `;

    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = "0";
    wrapper.style.top = "0";
    wrapper.style.width = "794px";
    wrapper.style.background = "white";
    wrapper.style.opacity = "0";
    wrapper.style.pointerEvents = "none";
    wrapper.style.zIndex = "-1";
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
        alert("Lỗi xuất PDF: " + err.message);
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

    const cx = size / 2;
    const cy = size / 2;
    const r = 80;

    ctx.clearRect(0, 0, size, size);

    const total = dat + khongDat;
    if (total === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = "#e5e7eb";
        ctx.fill();
        ctx.fillStyle = "#6b7280";
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
    ctx.fillStyle = "white";
    ctx.fill();

    ctx.fillStyle = "#4a3052";
    ctx.font = "bold 18px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${total}`, cx, cy - 6);
    ctx.font = "11px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#7e6b8a";
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
