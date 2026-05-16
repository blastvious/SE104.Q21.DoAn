const API = "http://localhost:5001/api/school";

let barChart = null;
let doughnutChart = null;
let currentReportData = null;

export async function init() {
    await Promise.all([
        loadYears(),
        loadSemesters(),
    ]);
    setupEventListeners();
    drawDoughnutChart(0, 0);
}

function setupEventListeners() {
    document.getElementById("reportFilterBtn").addEventListener("click", loadReport);
    document.getElementById("exportPdfBtn").addEventListener("click", exportPDF);
}

async function loadYears() {
    // const res = await fetch(`${API}/year`);
    // const years = await res.json();
    // const select = document.getElementById("selNam");
    // select.innerHTML = '<option value="">-- Chọn năm --</option>' +
    //     years.map(y => `<option value="${y.TenNamHoc}">${y.TenNamHoc}</option>`).join("");

    const res = await fetch(`${API}/year`);

    const years = await res.json();

    console.log("Years:", years);

    const select = document.getElementById("selNam");

    console.log("Select:", select);

    if (!select) {
        console.error("Không tìm thấy selNam");
        return;
    }

    select.innerHTML =
        '<option value="">-- Chọn năm --</option>' +
        years.map(y =>
            `<option value="${y.TenNamHoc}">
                ${y.TenNamHoc}
            </option>`
        ).join("");
}

async function loadSemesters() {
    const res = await fetch(`${API}/semester`);
    const semesters = await res.json();
    const select = document.getElementById("selHK");
    select.innerHTML = '<option value="">-- Chọn học kỳ --</option>' +
        semesters.map(s => `<option value="${s.MaHocKy}">${s.TenHocKy}</option>`).join("");
}

async function loadReport() {
    const MaHocKy = document.getElementById("selHK").value;
    const TenNamHoc = document.getElementById("selNam").value;

    if (!MaHocKy || !TenNamHoc) {
        alert("Vui lòng chọn đầy đủ Năm học, Học kỳ và Môn học");
        return;
    }

    const btn = document.getElementById("reportFilterBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải...';

    try {
        const res = await fetch(`${API}/report-semester`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ TenNamHoc, MaHocKy })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Lỗi khi tạo báo cáo");
        }

        const response = await res.json();
        const data = response.data;
        const details = data.details || [];
        currentReportData = data;

        if (details.length === 0) {
            resetReport();
            document.getElementById("reportTableBody").innerHTML =
                '<tr><td colspan="5" class="empty-table">Không có lớp nào trong năm học này</td></tr>';
            return;
        }
        
        renderTable(details, data);
        renderSummary(data);
        renderBarChart(details);
        renderDoughnutChart(data.TongSoLuongDat, data.TongSiSo - data.TongSoLuongDat);

        document.getElementById("exportPdfBtn").dataset.maBCTKMon = data.MaBCTKMon;

    } catch (error) {
        console.error(error);
        alert("Lỗi khi tải báo cáo: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-filter"></i> Xem báo cáo';
    }
}

function renderTable(details, data) {
    const isDark = document.body.classList.contains("dark-mode");
    const tbody  = document.getElementById("reportTableBody");

    tbody.innerHTML = details.map((d, i) => {
        const tiLe     = d.TiLeDat;
        const tleColor = tiLe >= 50
            ? (isDark ? "#22c55e" : "#16a34a")
            : (isDark ? "#ef4444" : "#dc2626");

        return `<tr>
            <td style="text-align:center">${i + 1}</td>
            <td>${d.TenLop}</td>
            <td style="text-align:center">${d.SiSo}</td>
            <td style="text-align:center">${d.SoLuongDat}</td>
            <td style="text-align:center;font-weight:600;color:${tleColor}">${tiLe}%</td>
        </tr>`;
    }).join("");

    document.getElementById("totalSiSo").textContent = data.TongSiSo;
    document.getElementById("totalDat").textContent  = data.TongSoLuongDat;
    document.getElementById("totalTiLe").textContent = `${data.TongTiLeDat}%`;
    document.getElementById("reportTableFoot").style.display = "table-footer-group";
}

function renderSummary(data) {
    document.getElementById("summaryTotalSiSo").textContent = data.TongSiSo;
    document.getElementById("summaryTotalDat").textContent  = data.TongSoLuongDat;
    document.getElementById("summaryTiLe").textContent      = `${data.TongTiLeDat}%`;
}

function renderBarChart(details) {
    const ctx    = document.getElementById("chartBar").getContext("2d");
    const labels = details.map(d => d.TenLop);
    const values = details.map(d => d.TiLeDat);

    const backgroundColors = values.map(v =>
        v >= 80 ? "rgba(34,197,94,0.75)"
        : v >= 50 ? "rgba(59,130,246,0.75)"
        : "rgba(239,68,68,0.75)"
    );

    if (barChart) barChart.destroy();

    barChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Tỉ lệ đạt (%)",
                data: values,
                backgroundColor: backgroundColors,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: { label: ctx => ` ${ctx.parsed.y}%` }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: v => `${v}%` },
                    grid: { color: "rgba(0,0,0,0.06)" }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderDoughnutChart(soLuongDat, soLuongKhongDat) {
    const ctx = document.getElementById("chartDoughnut").getContext("2d");

    if (doughnutChart) doughnutChart.destroy();

    doughnutChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Đạt", "Không đạt"],
            datasets: [{
                data: [soLuongDat, soLuongKhongDat],
                backgroundColor: [
                    "rgba(34,197,94,0.85)",
                    "rgba(239,68,68,0.85)"
                ],
                hoverOffset: 10,
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { padding: 12, font: { size: 12 } }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.label}: ${ctx.parsed} SV`
                    }
                }
            },
            cutout: "60%"
        }
    });
}

function drawDoughnutChart(dat, khongDat) {
    renderDoughnutChart(dat, khongDat);
}

function resetReport() {
    document.getElementById("summaryTotalSiSo").textContent = "--";
    document.getElementById("summaryTotalDat").textContent  = "--";
    document.getElementById("summaryTiLe").textContent      = "--";
    document.getElementById("reportTableFoot").style.display = "none";

    if (barChart)      { barChart.destroy();      barChart      = null; }
    if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null; }

    drawDoughnutChart(0, 0);
}

async function exportPDF() {
    const btn = document.getElementById("exportPdfBtn");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xuất...';

    try {
        const TenNamHoc = document.getElementById("selNam").value;
        const MaHocKy = document.getElementById("selHK").value;
        const TenHocKy = document.getElementById("selHK").selectedOptions[0]?.text || "";
        
        const MaBaoCao = currentReportData?.MaBCTKMon || "---";

        const totalSiSo = document.getElementById("summaryTotalSiSo").textContent;
        const totalDat  = document.getElementById("summaryTotalDat").textContent;
        const tiLe      = document.getElementById("summaryTiLe").textContent;

        const tbody = document.getElementById("reportTableBody");
        const rows  = [...tbody.querySelectorAll("tr")]
            .filter(r => r.querySelectorAll("td").length === 5);

        if (rows.length === 0) {
            alert("Không có dữ liệu để xuất PDF");
            return;
        }

        const tongSoLop = rows.length;

        let tableRows = "";
        rows.forEach((tr) => {
            const tds = tr.querySelectorAll("td");
            tableRows += `
                <tr>
                    <td style="text-align:center;padding:6px;border:1px solid #000">${tds[0].textContent.trim()}</td>
                    <td style="padding:6px;border:1px solid #000">${tds[1].textContent.trim()}</td>
                    <td style="text-align:center;padding:6px;border:1px solid #000">${tds[2].textContent.trim()}</td>
                    <td style="text-align:center;padding:6px;border:1px solid #000">${tds[3].textContent.trim()}</td>
                    <td style="text-align:center;padding:6px;border:1px solid #000">${tds[4].textContent.trim()}</td>
                </tr>
            `;
        });

        const d     = new Date();
        const ngay  = String(d.getDate()).padStart(2, "0");
        const thang = String(d.getMonth() + 1).padStart(2, "0");
        const nam   = d.getFullYear();
        const todayStr = `Ngày ${ngay} tháng ${thang} năm ${nam}`;

        const pdfHtml = `
            <div style="
                width:794px;
                background:#fff;
                color:#000;
                padding:40px;
                font-family:'Times New Roman',serif;
                font-size:14px;
                line-height:1.5;
                box-sizing:border-box;
            ">

                <!-- HEADER -->
                <table style="width:100%;border:none;border-collapse:collapse;margin-bottom:24px">
                    <tr>
                        <td style="width:40%;text-align:center;border:none;vertical-align:top">
                            <div style="font-weight:bold">TRƯỜNG THPT VinSchool</div>
                            <div style="margin-top:6px">
                                Mã báo cáo: <b>${MaBaoCao}</b>
                            </div>
                        </td>
                        <td style="width:60%;text-align:center;border:none;vertical-align:top">
                            <div style="font-weight:bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                            <div style="
                                font-weight:bold;
                                border-bottom:1px solid #000;
                                display:inline-block;
                                padding-bottom:2px;
                                margin-top:4px;
                            ">
                                Độc lập - Tự do - Hạnh phúc
                            </div>
                            <div style="font-style:italic;margin-top:6px">${todayStr}</div>
                        </td>
                    </tr>
                </table>

                <!-- TITLE -->
                <div style="text-align:center;margin-top:20px;margin-bottom:24px">
                    <div style="font-size:24px;font-weight:bold;text-transform:uppercase">
                        BÁO CÁO TỔNG KẾT HỌC KỲ
                    </div>
                    <div style="margin-top:12px">Năm học: <b>${TenNamHoc}</b></div>
                    <div style="margin-top:4px">Học kỳ: <b>${TenHocKy}</b></div>
                </div>

                <!-- GENERAL INFO -->
                <div style="margin-bottom:18px">
                    <div style="font-weight:bold;margin-bottom:8px">I. THÔNG TIN CHUNG</div>
                    <div style="margin-left:20px">
                        <div>Tổng số lớp: <b>${tongSoLop}</b></div>
                        <div>Tổng sĩ số: <b>${totalSiSo}</b></div>
                        <div>Tổng số lượng đạt: <b>${totalDat}</b></div>
                        <div>Tỉ lệ đạt toàn học kỳ: <b>${tiLe}</b></div>
                    </div>
                </div>

                <!-- TABLE -->
                <div style="font-weight:bold;margin-bottom:10px">II. CHI TIẾT THEO LỚP</div>

                <table style="width:100%;border-collapse:collapse;font-size:14px">
                    <thead>
                        <tr style="background:#e8d5f5">
                            <th style="border:1px solid #000;padding:8px;text-align:center">STT</th>
                            <th style="border:1px solid #000;padding:8px;text-align:center">Lớp</th>
                            <th style="border:1px solid #000;padding:8px;text-align:center">Sĩ số</th>
                            <th style="border:1px solid #000;padding:8px;text-align:center">Số lượng đạt</th>
                            <th style="border:1px solid #000;padding:8px;text-align:center">Tỉ lệ</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                    <tfoot>
                        <tr style="font-weight:bold">
                            <td style="border:1px solid #000;padding:8px"></td>
                            <td style="border:1px solid #000;padding:8px">Tổng cộng</td>
                            <td style="border:1px solid #000;padding:8px;text-align:center">${totalSiSo}</td>
                            <td style="border:1px solid #000;padding:8px;text-align:center">${totalDat}</td>
                            <td style="border:1px solid #000;padding:8px;text-align:center">${tiLe}</td>
                        </tr>
                    </tfoot>
                </table>

                <!-- SIGN -->
                <div style="display:flex;justify-content:space-between;margin-top:60px">
                    <div style="width:40%;text-align:center">
                        <div style="font-weight:bold">Người lập báo cáo</div>
                        <div style="margin-top:50px;font-style:italic">(Ký, ghi rõ họ tên)</div>
                    </div>
                    <div style="width:40%;text-align:center">
                        <div style="font-weight:bold">Xác nhận của nhà trường</div>
                        <div style="margin-top:50px;font-style:italic">(Ký, đóng dấu)</div>
                    </div>
                </div>

            </div>
        `;

        const wrapper = document.createElement("div");
        wrapper.style.position = "absolute";
        wrapper.style.left = "-9999px";
        wrapper.style.top = "0";
        wrapper.innerHTML = pdfHtml;
        document.body.appendChild(wrapper);

        await new Promise(resolve => setTimeout(resolve, 200));

        const canvas = await html2canvas(wrapper, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff"
        });

        const imgData = canvas.toDataURL("image/jpeg", 1.0);

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "mm", "a4");

        const pdfWidth  = 190;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "JPEG", 10, 10, pdfWidth, pdfHeight);
        pdf.save(`BaoCaoHocKy_${TenNamHoc}_${TenHocKy}.pdf`);

        document.body.removeChild(wrapper);

    } catch (err) {
        console.error(err);
        alert("Lỗi xuất PDF: " + err.message);

    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-file-pdf"></i> Xuất PDF';
    }
}