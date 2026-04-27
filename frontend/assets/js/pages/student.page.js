// 1. Luôn để Import ở trên cùng
import { createStudent, getAllStudents } from "../service/student.service.js";

// 2. Để hàm helper ở ngoài hoặc ở đầu để init() có thể thấy nó
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

    if (!form) return;

    // Định nghĩa renderTable bên trong init để dùng được getAllStudents đã import
    async function renderTable() {
        try {
            console.log("Đang tải danh sách học sinh...");
            const students = await getAllStudents(); // Bây giờ sẽ không còn lỗi undefined
            
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
                    </tr>
                `;
                tableBody.insertAdjacentHTML("beforeend", row);
            });
        } catch (error) {
            console.error("Lỗi khi tải danh sách:", error);
        }
    }

    // Đăng ký sự kiện
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("Đã nhấn nút Lưu - Đang xử lý...");

        const rawDate = document.getElementById("NgaySinh").value;
        const formattedDate = formatToDateOnly(rawDate); // Đã định nghĩa ở trên nên sẽ chạy được

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
                alert("Tiếp nhận học sinh thành công!");
                form.reset();
                document.getElementById("HoTen").focus();
                await renderTable(); 
            }
        } catch (error) {
            alert("Lỗi: " + error.message);
        }
    });

    // Chạy tải bảng lần đầu
    await renderTable();
}