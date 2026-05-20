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
  if (!dateStr) return "";

  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length !== 3) return dateStr;
    const [day, month, year] = parts;
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

  setupDatePicker();

  await renderTable();
}

function setupDatePicker() {
  flatpickr("#NgaySinh", {
    dateFormat: "d/m/Y",
    allowInput: true,
    locale: { firstDayOfWeek: 1 },
  });
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

        Toast.success("🎉 Cập nhật học sinh thành công!");
      } else {
        /* =========================================
               CREATE
            ========================================= */
        await createStudent(student);

        Toast.success("🎉 Tiếp nhận học sinh thành công!");
      }

      form.reset();

      editingStudentId = null;

      document.getElementById("studentModal").style.display = "none";

      await renderTable();
    } catch (error) {
      Toast.error("❌ Lỗi: " + error.message);
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

      const fp = document.getElementById("NgaySinh")._flatpickr;
      if (fp) fp.setDate(this.dataset.ngaysinh);

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

        Toast.success("Xóa học sinh thành công");

        await renderTable();
      } catch (error) {
        Toast.error(error.message);
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

function cleanPhoneNumber(val) {
  if (val == null) return "";
  let s = typeof val === "number" ? String(val) : String(val).trim();
  if (s === "" || s === "'") return "";
  if (s.startsWith("'")) s = s.slice(1);
  s = s.replace(/\D/g, "");
  if (s.startsWith("84") && s.length > 9) s = "0" + s.slice(2);
  return s;
}

function cleanDate(val) {
  if (val == null) return "";
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) {
      const y = d.y, m = String(d.m).padStart(2, "0"), day = String(d.d).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
    return "";
  }
  const s = String(val).trim();
  if (!s) return "";
  const m1 = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2,"0")}-${m1[1].padStart(2,"0")}`;
  const m2 = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m2) return `${m2[1]}-${m2[2].padStart(2,"0")}-${m2[3].padStart(2,"0")}`;
  return s;
}

const CHUNK_SIZE = 100;

function showImportProgress(total) {
  const modal = document.getElementById("importProgressModal");
  if (modal) modal.style.display = "block";
  document.getElementById("importProgressText").textContent = "Đang xử lý...";
  document.getElementById("importProgressDetail").textContent = `0 / ${total} học sinh`;
  document.getElementById("importProgressBar").style.width = "0%";
  document.getElementById("importProgressPercent").textContent = "0%";
}

function updateImportProgress(processed, total, detail) {
  const pct = total > 0 ? Math.min(Math.round((processed / total) * 100), 100) : 0;
  const bar = document.getElementById("importProgressBar");
  if (bar) bar.style.width = pct + "%";
  const pctEl = document.getElementById("importProgressPercent");
  if (pctEl) pctEl.textContent = pct + "%";
  const detailEl = document.getElementById("importProgressDetail");
  if (detailEl) detailEl.textContent = detail || `${processed} / ${total} học sinh`;
}

function hideImportProgress() {
  const modal = document.getElementById("importProgressModal");
  if (modal) modal.style.display = "none";
}

/* =========================================
   IMPORT EXCEL
========================================= */
function setupExcelImport() {
  const fileInput = document.getElementById("excelFile");

  if (!fileInput) {
    console.error("setupExcelImport: Không tìm thấy input file");
    return;
  }

  fileInput.onchange = async () => {
    const file = fileInput.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        let jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          throw new Error("File Excel rỗng");
        }

        jsonData = jsonData.map((row) => {
          const item = { ...row };

          item.NgaySinh = cleanDate(item.NgaySinh);
          item.SoDienThoai = cleanPhoneNumber(item.SoDienThoai);

          return item;
        });

        const chunks = [];
        for (let i = 0; i < jsonData.length; i += CHUNK_SIZE) {
          chunks.push(jsonData.slice(i, i + CHUNK_SIZE));
        }

        showImportProgress(jsonData.length);

        let totalInserted = 0;

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const processed = Math.min((i + 1) * CHUNK_SIZE, jsonData.length);
          updateImportProgress(processed, jsonData.length, `Đang xử lý lô ${i + 1}/${chunks.length} (${chunk.length} học sinh)...`);

          try {
            const result = await bulkCreateStudents(chunk);
            totalInserted += result.data?.length || 0;
          } catch (chunkError) {
            const msg = chunkError.message || "";
            if (msg.includes("đều đã tồn tại")) {
              // skip chunk — all duplicates
            } else {
              hideImportProgress();
              Toast.error("Lỗi Import (lô " + (i + 1) + "): " + msg);
              fileInput.value = "";
              await renderTable();
              return;
            }
          }
        }

        hideImportProgress();

        const skipped = jsonData.length - totalInserted;
        if (totalInserted > 0) {
          Toast.success(`✅ Import thành công: thêm ${totalInserted} học sinh, bỏ qua ${skipped} bản ghi trùng.`);
        } else {
          Toast.warning("⚠️ Tất cả học sinh trong file đều đã tồn tại.");
        }

        await renderTable();
        fileInput.value = "";
      } catch (error) {
        hideImportProgress();
        console.error("Import Error:", error);
        Toast.error("Lỗi Import: " + error.message);
      }
    };

    reader.onerror = () => {
      Toast.error("Không thể đọc file Excel");
    };

    reader.readAsArrayBuffer(file);
  };
}

/* =========================================
   RESET FORM
========================================= */
function resetForm() {
  document.getElementById("studentForm").reset();
  const fp = document.getElementById("NgaySinh")._flatpickr;
  if (fp) fp.clear();
}
