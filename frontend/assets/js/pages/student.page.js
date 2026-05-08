import { createStudent, getAllStudents, bulkCreateStudents } from "../service/student.service.js";

function formatToDateOnly(dateStr) {
    if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
}

export async function init() {
    const form = document.getElementById("studentForm");
    const tableBody = document.getElementById("studentTable");
    const studentModal = document.getElementById("studentModal");
    
    const btnUpload = document.getElementById("btnUploadExcel");
    const fileInput = document.getElementById("excelFile");

    // --- XỬ LÝ IMPORT EXCEL ---
    btnUpload.onclick = async () => {
        const file = fileInput.files[0];
        if (!file) {
            alert("⚠️ Vui lòng chọn một file Excel trước khi tải lên!");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    throw new Error("File Excel rỗng hoặc không đúng định dạng!");
                }

                // Gọi API bulk create
                const result = await bulkCreateStudents(jsonData);
                alert("✅ " + result.message);
                
                await renderTable(); 
                fileInput.value = ""; 
            } catch (error) {
                // Hiển thị thông báo lỗi chi tiết từ Server (ví dụ lỗi Joi validation)
                console.error("Import Error:", error);
                alert("❌ Lỗi Import: " + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // --- XỬ LÝ RENDER BẢNG ---
    async function renderTable() {
        try {
            const students = await getAllStudents(); 
            if (!tableBody) return;
            tableBody.innerHTML = "";
            
            students.forEach(s => {
                const row = `
                    <tr>
                        <td><b>${s.MaHS}</b></td>
                        <td>${s.HoTen}</td>
                        <td>${s.NgaySinh}</td>
                        <td>${s.GioiTinh}</td>
                        <td>${s.DiaChi}</td>
                        <td>${s.Email}</td>
                        <td>${s.SoDienThoai}</td>
                        <td style="text-align:center">
                            <button class="btn-edit">✏️</button>
                        </td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML("beforeend", row);
            });
        } catch (error) {
            console.error("Lỗi tải bảng:", error);
        }
    }

    // --- XỬ LÝ FORM THÊM MỚI (MODAL) ---
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const rawDate = document.getElementById("NgaySinh").value;
            const formattedDate = formatToDateOnly(rawDate);

            const student = {
                HoTen: document.getElementById("HoTen").value,
                NgaySinh: formattedDate,
                GioiTinh: document.getElementById("GioiTinh").value,
                DiaChi: document.getElementById("DiaChi").value,
                Email: document.getElementById("Email").value,
                SoDienThoai: document.getElementById("SoDienThoai").value
            };

            try {
                const result = await createStudent(student);
                if (result) {
                    alert("🎉 Tiếp nhận học sinh thành công!");
                    
                    // 1. Reset form
                    form.reset();
                    
                    // 2. Đóng Modal
                    if (studentModal) {
                        studentModal.style.display = "none";
                    }
                    
                    // 3. Cập nhật lại bảng dữ liệu
                    await renderTable(); 
                }
            } catch (error) {
                alert("❌ Lỗi: " + error.message);
            }
        });
    }

    // Tải bảng lần đầu khi vào trang
    await renderTable();
}