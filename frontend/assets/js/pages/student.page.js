import {
  createStudent,
  getAllStudents,
  bulkCreateStudents,
  updateStudent,
  deleteStudent,
} from "../service/student.service.js";

let editingStudentId = null;

/* =========================================
   FORMAT DATE
========================================= */
function formatToDateOnly(dateStr) {
  if (dateStr.includes("/")) {
    const [day, month, year] = dateStr.split("/");

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return dateStr;
}

/* =========================================
   FORMAT DATE DISPLAY
========================================= */
function formatDisplayDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleDateString("vi-VN");
}

/* =========================================
   INIT
========================================= */
export async function init() {
  setupModal();

  setupForm();

  setupExcelImport();

  setupSearch();

  await renderTable();
}

/* =========================================
   RENDER TABLE
========================================= */
async function renderTable(keyword = "") {
  try {
    const students = await getAllStudents(keyword);

    const tableBody = document.getElementById("studentTable");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    /* =========================================
           EMPTY TABLE
        ========================================= */
    if (students.length === 0) {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-table">
                        Không có học sinh nào
                    </td>
                </tr>
            `;

      return;
    }

    /* =========================================
           RENDER ROW
        ========================================= */
    students.forEach((s) => {
      const row = `
                <tr>

                    <td>
                        <b>${s.MaHS}</b>
                    </td>

                    <td>
                        ${s.HoTen}
                    </td>

                    <td>
                        ${formatDisplayDate(s.NgaySinh)}
                    </td>

                    <td>
                        ${s.GioiTinh}
                    </td>

                    <td>
                        ${s.DiaChi}
                    </td>

                    <td>
                        ${s.Email}
                    </td>

                    <td>
                        ${s.SoDienThoai}
                    </td>

                    <td style="text-align:center">

                        <div class="action-group">

                            <button
                                class="action-btn edit"
                                data-id="${s.MaHS}"
                                data-hoten="${s.HoTen}"
                                data-ngaysinh="${s.NgaySinh}"
                                data-gioitinh="${s.GioiTinh}"
                                data-diachi="${s.DiaChi}"
                                data-email="${s.Email}"
                                data-sdt="${s.SoDienThoai}"
                            >
                                <i class="fas fa-pen"></i>
                            </button>

                            <button
                                class="action-btn delete"
                                data-id="${s.MaHS}"
                            >
                                <i class="fas fa-trash"></i>
                            </button>

                        </div>

                    </td>

                </tr>
            `;

      tableBody.insertAdjacentHTML("beforeend", row);
    });

    bindActionButtons();
  } catch (error) {
    console.error("Lỗi tải bảng:", error);
  }
}

/* =========================================
   MODAL
========================================= */
function setupModal() {
  const modal = document.getElementById("studentModal");

  document.onclick = function (event) {
    /* =========================================
           OPEN MODAL
        ========================================= */
    if (event.target.id === "openModalBtn") {
      editingStudentId = null;

      resetForm();

      document.querySelector(".modal-header h3").textContent =
        "Thêm Học Sinh Mới";

      modal.style.display = "block";
    }

    /* =========================================
           CLOSE MODAL
        ========================================= */
    if (
      event.target.id === "closeModalBtn" ||
      event.target.id === "cancelBtn"
    ) {
      modal.style.display = "none";
    }

    /* =========================================
           CLICK OUTSIDE
        ========================================= */
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}

/* =========================================
   FORM SUBMIT
========================================= */
function setupForm() {
  const form = document.getElementById("studentForm");

  form.onsubmit = async function (e) {
    e.preventDefault();

    try {
      const rawDate = document.getElementById("NgaySinh").value;

      const formattedDate = formatToDateOnly(rawDate);

      const student = {
        HoTen: document.getElementById("HoTen").value,

        NgaySinh: formattedDate,

        GioiTinh: document.getElementById("GioiTinh").value,

        DiaChi: document.getElementById("DiaChi").value,

        Email: document.getElementById("Email").value,

        SoDienThoai: document.getElementById("SoDienThoai").value,
      };

      /* =========================================
               UPDATE
            ========================================= */
      if (editingStudentId) {
        await updateStudent(editingStudentId, student);

        alert("🎉 Cập nhật học sinh thành công!");
      } else {
        /* =========================================
               CREATE
            ========================================= */
        await createStudent(student);

        alert("🎉 Tiếp nhận học sinh thành công!");
      }

      form.reset();

      editingStudentId = null;

      document.getElementById("studentModal").style.display = "none";

      await renderTable();
    } catch (error) {
      alert("❌ Lỗi: " + error.message);
    }
  };
}

/* =========================================
   EDIT + DELETE
========================================= */
function bindActionButtons() {
  /* =========================================
       EDIT
    ========================================= */
  document.querySelectorAll(".action-btn.edit").forEach((btn) => {
    btn.onclick = function () {
      editingStudentId = this.dataset.id;

      document.getElementById("HoTen").value = this.dataset.hoten;

      document.getElementById("GioiTinh").value = this.dataset.gioitinh;

      document.getElementById("NgaySinh").value = formatDisplayDate(
        this.dataset.ngaysinh,
      );

      document.getElementById("DiaChi").value = this.dataset.diachi;

      document.getElementById("Email").value = this.dataset.email;

      document.getElementById("SoDienThoai").value = this.dataset.sdt;

      document.querySelector(".modal-header h3").textContent =
        "Cập Nhật Học Sinh";

      document.getElementById("studentModal").style.display = "block";
    };
  });

  /* =========================================
       DELETE
    ========================================= */
  document.querySelectorAll(".action-btn.delete").forEach((btn) => {
    btn.onclick = async function () {
      const id = this.dataset.id;

      const confirmDelete = confirm("Bạn có chắc muốn xóa học sinh này?");

      if (!confirmDelete) return;

      try {
        await deleteStudent(id);

        alert("Xóa học sinh thành công");

        await renderTable();
      } catch (error) {
        alert(error.message);
      }
    };
  });
}

/* =========================================
   SEARCH
========================================= */
function setupSearch() {
  const searchInput = document.getElementById("studentSearch");

  if (!searchInput) return;

  searchInput.oninput = async function () {
    const keyword = this.value.trim();

    await renderTable(keyword);
  };
}

/* =========================================
   IMPORT EXCEL
========================================= */
function setupExcelImport() {
  const btnUpload = document.getElementById("btnUploadExcel");

  const fileInput = document.getElementById("excelFile");

  btnUpload.onclick = async () => {
    const file = fileInput.files[0];

    if (!file) {
      alert("⚠️ Vui lòng chọn file Excel");

      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);

        const workbook = XLSX.read(data, {
          type: "array",
        });

        const firstSheetName = workbook.SheetNames[0];

        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          throw new Error("File Excel rỗng");
        }

        const result = await bulkCreateStudents(jsonData);

        alert("✅ " + result.message);

        await renderTable();

        fileInput.value = "";
      } catch (error) {
        console.error("Import Error:", error);

        alert("❌ Lỗi Import: " + error.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };
}

/* =========================================
   RESET FORM
========================================= */
function resetForm() {
  document.getElementById("studentForm").reset();
}
