import {
  createStudent,
  getAllStudents,
  bulkCreateStudents,
  updateStudent,
  deleteStudent,
} from "../service/student.service.js";
import { can } from "../permission.js";

let editingStudentId = null;

const ADMISSION_MAP_KEY = "studentAdmissionMap";
const ADMISSION_MODE_KEY = "studentFilterMode";
const RECENT_DAYS = 7;

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
   ADMISSION DATE (localStorage)
========================================= */
function getAdmissionMap() {
  try {
    return JSON.parse(localStorage.getItem(ADMISSION_MAP_KEY) || "{}");
  } catch { return {}; }
}

function saveAdmissionMap(map) {
  localStorage.setItem(ADMISSION_MAP_KEY, JSON.stringify(map));
}

function getStudentAdmission(maHS) {
  return getAdmissionMap()[maHS] || null;
}

function setStudentAdmission(maHS, dateStr) {
  const map = getAdmissionMap();
  map[maHS] = dateStr;
  saveAdmissionMap(map);
}

function daysSinceAdmission(maHS) {
  const dateStr = getStudentAdmission(maHS);
  if (!dateStr) return Infinity;
  const then = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function isWithinRecentDays(maHS) {
  return daysSinceAdmission(maHS) < RECENT_DAYS;
}

function getFilterMode() {
  return localStorage.getItem(ADMISSION_MODE_KEY) || "recent";
}

function setFilterMode(mode) {
  localStorage.setItem(ADMISSION_MODE_KEY, mode);
}

function initAdmissionMap(students) {
  const map = getAdmissionMap();
  let changed = false;
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() - 8);
  const dateStr = defaultDate.toISOString().slice(0, 10);
  students.forEach(s => {
    if (!map[s.MaHS]) {
      map[s.MaHS] = dateStr;
      changed = true;
    }
  });
  if (changed) saveAdmissionMap(map);
}

function setupAdmissionFilter() {
  const toggle = document.getElementById("admissionFilterToggle");
  const text = document.getElementById("admissionFilterText");
  if (!toggle || !text) return;

  const mode = getFilterMode();
  if (mode === "all") {
    text.textContent = "Đang hiển thị tất cả học sinh";
    toggle.textContent = "Chỉ hiển thị 7 ngày";
  } else {
    text.textContent = "Đang hiển thị học sinh được tiếp nhận trong 7 ngày gần đây";
    toggle.textContent = "Hiển thị tất cả";
  }

  toggle.onclick = (e) => {
    e.preventDefault();
    const current = getFilterMode();
    if (current === "all") {
      setFilterMode("recent");
      text.textContent = "Đang hiển thị học sinh được tiếp nhận trong 7 ngày gần đây";
      toggle.textContent = "Hiển thị tất cả";
    } else {
      setFilterMode("all");
      text.textContent = "Đang hiển thị tất cả học sinh";
      toggle.textContent = "Chỉ hiển thị 7 ngày";
    }
    renderTable(document.getElementById("studentSearch")?.value.trim() || "");
  };
}

/* =========================================
   INIT
========================================= */
export async function init() {
  ["studentModal", "importExcelModal", "importProgressModal"].forEach(id => {
    const el = document.querySelector(`body > #${id}`);
    if (el) el.remove();
  });
  document.body.appendChild(document.getElementById("studentModal"));
  document.body.appendChild(document.getElementById("importExcelModal"));
  document.body.appendChild(document.getElementById("importProgressModal"));

  setupModal();

  setupForm();

  setupExcelImport();

  setupSearch();

  setupDatePicker();

  const students = await getAllStudents();
  initAdmissionMap(students);
  setupAdmissionFilter();

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
    let students = await getAllStudents(keyword);

    const tableBody = document.getElementById("studentTable");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    /* =========================================
           FILTER BY ADMISSION DATE
        ========================================= */
    if (getFilterMode() === "recent") {
      students = students.filter(s => isWithinRecentDays(s.MaHS));
    }

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

                            ${can(window.currentUser, "delete") ? `
                            <button
                                class="action-btn delete"
                                data-id="${s.MaHS}"
                            >
                                <i class="fas fa-trash"></i>
                            </button>` : ''}

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
        const result = await createStudent(student);
        const created = result?.data || result;
        const maHS = created?.MaHS;
        if (maHS) {
          const today = new Date().toISOString().slice(0, 10);
          setStudentAdmission(maHS, today);
        }
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
  if (s.length === 9 && /^[3|5|7|8|9]/.test(s)) s = "0" + s;
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
  const modal = document.getElementById("importExcelModal");
  const openBtn = document.getElementById("btnImportExcel");
  const closeBtn = document.getElementById("closeModalImport");
  const cancelBtn = document.getElementById("cancelModalImport");
  const confirmBtn = document.getElementById("confirmImportBtn");
  const fileInput = document.getElementById("excelFile");
  const fileDisplay = document.getElementById("fileDisplay");
  const fileNameText = document.getElementById("fileNameText");

  if (!modal || !fileInput) return;

  const openModal = () => { modal.style.display = "block"; };
  const closeModal = () => {
    modal.style.display = "none";
    fileInput.value = "";
    if (fileDisplay) fileDisplay.style.display = "none";
  };

  if (openBtn) openBtn.onclick = openModal;
  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;
  window.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  const downloadBtn = document.getElementById("btnDownloadTemplate");
  if (downloadBtn) downloadBtn.onclick = downloadStudentTemplate;

  document.addEventListener("change", (e) => {
    if (e.target === fileInput) {
      const file = fileInput.files?.[0];
      if (file && fileDisplay && fileNameText) {
        fileNameText.textContent = file.name;
        fileDisplay.style.display = "flex";
      }
    }
  });

  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      const file = fileInput.files?.[0];
      if (!file) {
        Toast.warning("Vui lòng chọn file Excel!");
        return;
      }
      closeModal();
      await processExcelFile(file);
    };
  }
}

async function processExcelFile(file) {
  const fileInput = document.getElementById("excelFile");
  const fileDisplay = document.getElementById("fileDisplay");

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

      const headerMap = {
        "Họ Tên": "HoTen",
        "Ngày Sinh": "NgaySinh",
        "Giới Tính": "GioiTinh",
        "Địa Chỉ": "DiaChi",
        "Số Điện Thoại": "SoDienThoai"
      };

      jsonData = jsonData.map(row => {
        const mapped = {};
        for (const [key, val] of Object.entries(row)) {
          const v = typeof val === "string" ? val.trim() : val;
          mapped[headerMap[key] || key] = v;
        }
        if (mapped.HoTen) mapped.HoTen = mapped.HoTen.trim();
        if (mapped.DiaChi) mapped.DiaChi = mapped.DiaChi.trim();
        return mapped;
      });

      jsonData = jsonData.map((row) => {
        const item = { ...row };
        item.NgaySinh = cleanDate(item.NgaySinh);
        item.SoDienThoai = cleanPhoneNumber(item.SoDienThoai);
        return item;
      });

      jsonData = jsonData.filter(row => row.HoTen && row.HoTen !== "");

      const chunks = [];
      for (let i = 0; i < jsonData.length; i += CHUNK_SIZE) {
        chunks.push(jsonData.slice(i, i + CHUNK_SIZE));
      }

      showImportProgress(jsonData.length);

      let totalInserted = 0;
      let lastErrorMsg = "";

      const today = new Date().toISOString().slice(0, 10);

      const allErrors = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const processed = Math.min((i + 1) * CHUNK_SIZE, jsonData.length);
        updateImportProgress(processed, jsonData.length, `Đang xử lý lô ${i + 1}/${chunks.length} (${chunk.length} học sinh)...`);

        try {
          const result = await bulkCreateStudents(chunk);
          const inserted = result?.data || [];
          totalInserted += inserted.length;
          inserted.forEach(s => {
            if (s.MaHS) setStudentAdmission(s.MaHS, today);
          });
          if (result?.errors?.length) {
            allErrors.push(...result.errors);
          }
        } catch (chunkError) {
          const msg = chunkError.message || "";
          if (!lastErrorMsg) lastErrorMsg = msg;
        }
      }

      hideImportProgress();

      await renderTable();
      fileInput.value = "";
      if (fileDisplay) fileDisplay.style.display = "none";

      if (totalInserted > 0) {
        let msg = `✅ Đã thêm ${totalInserted} học sinh.`;
        if (allErrors.length > 0) {
          msg += ` Bỏ qua ${allErrors.length} dòng lỗi.`;
          const detail = allErrors.slice(0, 5).map(e => `Dòng ${e.row}: ${e.reason}`).join("<br>");
          Toast.warning(msg + `<br><br>` + detail + (allErrors.length > 5 ? `<br>...và ${allErrors.length - 5} lỗi khác` : ""));
        } else {
          Toast.success(msg);
        }
      } else if (allErrors.length > 0) {
        const detail = allErrors.slice(0, 5).map(e => `Dòng ${e.row}: ${e.reason}`).join("<br>");
        const tail = allErrors.length > 5 ? `<br>...và ${allErrors.length - 5} lỗi khác` : "";
        Toast.warning(`⚠️ Không có học sinh nào được thêm.<br><br>${detail}${tail}`);
      } else {
        Toast.warning(lastErrorMsg || "⚠️ Không có học sinh nào được thêm.");
      }
    } catch (error) {
      hideImportProgress();
      fileInput.value = "";
      if (fileDisplay) fileDisplay.style.display = "none";
      console.error("Import Error:", error);
      Toast.error("Lỗi Import: " + error.message);
    }
  };

  reader.onerror = () => {
    fileInput.value = "";
    if (fileDisplay) fileDisplay.style.display = "none";
    Toast.error("Không thể đọc file Excel");
  };

  reader.readAsArrayBuffer(file);
}

/* =========================================
   RESET FORM
========================================= */
function resetForm() {
  document.getElementById("studentForm").reset();
  const fp = document.getElementById("NgaySinh")._flatpickr;
  if (fp) fp.clear();
}

/* =========================================
   DOWNLOAD EXCEL TEMPLATE
========================================= */
function downloadStudentTemplate() {
  if (typeof XLSX === "undefined") return;

  const headerRow = ["Họ Tên", "Ngày Sinh", "Giới Tính", "Địa Chỉ", "Email", "Số Điện Thoại"];
  const rows = [headerRow];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 28 }, { wch: 14 }, { wch: 10 },
    { wch: 24 }, { wch: 28 }, { wch: 14 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Học sinh");
  XLSX.writeFile(wb, "MauNhap_HocSinh.xlsx");
}
