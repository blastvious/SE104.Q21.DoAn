import {
  getUnassignedStudents,
  getAssignedStudents,
  assignStudentsBatch,
  transferClass,
} from "../service/studyProcess.service.js";

import { settingsService } from "../service/settings.service.js";

let selectedStudents = new Set();
let allClasses = [];
let currentStudentId = null;

/* ===============================
   INIT
================================ */
export const init = async () => {
  await loadFilters(); // 🔥 QUAN TRỌNG
  bindFilterEvents(); // 🔥 QUAN TRỌNG
  bindEvents();
  loadData();
};

/* ===============================
   LOAD FILTER DATA
================================ */
async function loadFilters() {
  try {
    const [years, grades, classes, semesters] = await Promise.all([
      settingsService.fetchYears(),
      settingsService.fetchGrades(),
      settingsService.fetchClasses(),
      settingsService.fetchSemesters(),
    ]);

    allClasses = classes;

    // ===== NĂM HỌC =====
    const yearSelect = document.getElementById("filterNamHoc");
    yearSelect.innerHTML =
      '<option value="">--Chọn--</option>' +
      years
        .map(
          (y) => `
                <option value="${y.TenNamHoc}">
                    ${y.TenNamHoc}
                </option>
            `,
        )
        .join("");

    // ===== HỌC KỲ =====
    const semesterSelect = document.getElementById("filterHocKy");
    if (semesterSelect) {
      semesterSelect.innerHTML =
        '<option value="">--Chọn--</option>' +
        semesters
          .map(
            (s) => `
                    <option value="${s.MaHocKy}">
                        ${s.TenHocKy}
                    </option>
                `,
          )
          .join("");
    }

    // ===== KHỐI =====
    const gradeSelect = document.getElementById("filterKhoi");
    gradeSelect.innerHTML =
      '<option value="">--Chọn--</option>' +
      grades
        .map(
          (g) => `
                <option value="${g.MaKhoiLop}">
                    ${g.TenKhoiLop}
                </option>
            `,
        )
        .join("");
  } catch (err) {
    console.error("loadFilters error:", err);
  }
}

/* ===============================
   FILTER EVENTS
================================ */
function bindFilterEvents() {
  const gradeSelect = document.getElementById("filterKhoi");
  const classSelect = document.getElementById("filterLop");

  // ===== CHỌN KHỐI → LOAD LỚP =====
  gradeSelect.addEventListener("change", () => {
    const grade = gradeSelect.value;

    if (!grade) {
      classSelect.innerHTML = "";
      classSelect.disabled = true;
      return;
    }

    const filtered = allClasses.filter((c) => c.MaKhoiLop === grade);

    classSelect.innerHTML =
      '<option value="">--Chọn lớp--</option>' +
      filtered
        .map(
          (c) => `
                <option value="${c.MaLop}">
                    ${c.TenLop}
                </option>
            `,
        )
        .join("");

    classSelect.disabled = false;
    selectedStudents.clear();
    updateAssignButton();
    loadData();
  });

  // ===== CHỌN LỚP → LOAD DATA =====
  classSelect.addEventListener("change", () => {
    selectedStudents.clear();
    updateAssignButton();
    loadData();
  });
}

/* ===============================
   EVENTS
================================ */
function bindEvents() {
  document
    .getElementById("checkAllUnassigned")
    .addEventListener("change", (e) => {
      const checked = e.target.checked;

      document.querySelectorAll(".student-checkbox").forEach((cb) => {
        cb.checked = checked;
        toggleStudent(cb.dataset.id, checked);
      });

      updateAssignButton();
    });

  document.getElementById("assignBtn").addEventListener("click", handleAssign);
  // đóng modal
  document
    .getElementById("closeTransferModal")
    .addEventListener("click", () => {
      document.getElementById("transferModal").style.display = "none";
    });

  document.getElementById("cancelTransferBtn").addEventListener("click", () => {
    document.getElementById("transferModal").style.display = "none";
  });
  document
  .getElementById("transferForm")
  .addEventListener("submit", handleTransfer);
}

/* ===============================
   LOAD DATA
================================ */
async function loadData() {
  try {
    const MaLop = document.getElementById("filterLop").value;
    const MaHocKy = document.getElementById("filterHocKy")?.value;

    // ❌ CHƯA CHỌN HỌC KỲ → KHÔNG GỌI API
    if (!MaHocKy) {
      document.getElementById("unassignedTable").innerHTML = `
        <tr><td colspan="5" class="empty-table">
            Vui lòng chọn học kỳ
        </td></tr>
      `;

      document.getElementById("assignedTable").innerHTML = `
        <tr><td colspan="5" class="empty-table">
            Vui lòng chọn học kỳ
        </td></tr>
      `;
      return;
    }

    const [unassigned, assigned] = await Promise.all([
      getUnassignedStudents(MaHocKy),
      MaLop ? getAssignedStudents(MaHocKy, MaLop) : Promise.resolve([]),
    ]);

    renderUnassigned(unassigned);
    renderAssigned(assigned);
  } catch (err) {
    console.error(err);
  }
}

/* ===============================
   RENDER UNASSIGNED
================================ */
function renderUnassigned(data) {
  const tbody = document.getElementById("unassignedTable");

  if (!data.length) {
    tbody.innerHTML = `
            <tr><td colspan="5" class="empty-table">
                Không có học sinh
            </td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (s) => `
        <tr>
            <td>
                <input type="checkbox"
                    class="student-checkbox"
                    data-id="${s.MaHS}"
                >
            </td>
            <td>${s.MaHS}</td>
            <td>${s.HoTen}</td>
            <td>${formatDate(s.NgaySinh)}</td>
            <td>${s.GioiTinh}</td>
        </tr>
    `,
    )
    .join("");

  document.querySelectorAll(".student-checkbox").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      toggleStudent(cb.dataset.id, e.target.checked);
      updateAssignButton();
    });
  });
}

/* ===============================
   RENDER ASSIGNED
================================ */
function renderAssigned(data) {
  const tbody = document.getElementById("assignedTable");

  if (!data.length) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="empty-table">
        Chưa có học sinh
      </td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (s) => `
    <tr>
        <td>${s.MaHS}</td>
        <td>${s.HOCSINH?.HoTen || ""}</td>
        <td><span class="class-badge">${s.MaLop}</span></td>
        <td>${s.MaHocKy}</td>
        <td class="actions">
            <button class="action-btn edit"
                data-id="${s.MaHS}">
                <i class="fas fa-exchange-alt"></i>
            </button>
        </td>
    </tr>
  `,
    )
    .join("");

  // 👉 mở popup
  document.querySelectorAll(".action-btn.edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      openTransferModal(btn.dataset.id);
    });
  });
}
function openTransferModal(studentId) {
  currentStudentId = studentId;

  const modal = document.getElementById("transferModal");
  const select = document.getElementById("newClassSelect");

  const currentClass = document.getElementById("filterLop").value;

  select.innerHTML =
    '<option value="">--Chọn lớp--</option>' +
    allClasses.map(c => `
      <option value="${c.MaLop}" ${c.MaLop === currentClass ? "disabled" : ""}>
        ${c.TenLop}
      </option>
    `).join("");

  modal.style.display = "block";
}

/* ===============================
   SELECT
================================ */
function toggleStudent(id, checked) {
  if (checked) selectedStudents.add(id);
  else selectedStudents.delete(id);
}

function updateAssignButton() {
  const btn = document.getElementById("assignBtn");
  const hasClass = document.getElementById("filterLop").value;

  btn.disabled = selectedStudents.size === 0 || !hasClass;
}

/* ===============================
   ASSIGN
================================ */
async function handleAssign() {
  const MaLop = document.getElementById("filterLop").value;
  const MaHocKy = document.getElementById("filterHocKy").value;

  if (!MaLop) {
    alert("Vui lòng chọn lớp");
    return;
  }
  if (!MaHocKy) {
    document.getElementById("unassignedTable").innerHTML = `
        <tr><td colspan="5" class="empty-table">
            Vui lòng chọn học kỳ
        </td></tr>
    `;

    document.getElementById("assignedTable").innerHTML = `
        <tr><td colspan="5" class="empty-table">
            Vui lòng chọn học kỳ
        </td></tr>
    `;

    return;
  }

  if (selectedStudents.size === 0) {
    alert("Chưa chọn học sinh");
    return;
  }

  if (!confirm(`Xếp ${selectedStudents.size} học sinh vào lớp này?`)) return;

  try {
    await assignStudentsBatch({
      MaHocKy,
      MaLop,
      students: Array.from(selectedStudents),
    });

    alert("Xếp lớp thành công!");

    selectedStudents.clear();
    loadData();
  } catch (err) {
    alert(err.message);
  }
}

/* ===============================
   UTIL
================================ */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}


async function handleTransfer(e) {
  e.preventDefault();
  if (!currentStudentId) {
    alert("Không xác định được học sinh");
    return;
  }
  const MaHocKy = document.getElementById("filterHocKy").value;
  const MaLopMoi = document.getElementById("newClassSelect").value;

  if (!MaHocKy) {
    alert("Vui lòng chọn học kỳ");
    return;
  }

  if (!MaLopMoi) {
    alert("Vui lòng chọn lớp mới");
    return;
  }

  try {
    await transferClass({
      MaHS: currentStudentId,
      MaHocKy,
      MaLopMoi,
    });

    alert("Chuyển lớp thành công!");

    // đóng modal
    document.getElementById("transferModal").style.display = "none";

    // reset form
    document.getElementById("transferForm").reset();

    // reload lại bảng
    loadData();
  } catch (err) {
    alert(err.message);
  }
}
