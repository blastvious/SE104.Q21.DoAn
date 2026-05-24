import {
  getUnassignedStudents,
  getAssignedStudents,
  assignStudentsBatch,
  transferClass,
} from "../service/studyProcess.service.js";

import { settingsService } from "../service/settings.service.js";

/* =========================================
   STATE
========================================= */
let selectedStudents = new Set();
let allClasses = [];
let currentStudentId = null;

/* =========================================
   INIT
========================================= */
export const init = async () => {
  await loadFilters();
  bindFilterEvents();
  bindEvents();
};

/* =========================================
   RELOAD ALL STATE SAFE
========================================= */
async function reloadAll() {
  selectedStudents.clear();
  currentStudentId = null;

  updateAssignButton();
  await loadUnassigned();
  await loadAssigned();
}

/* =========================================
   LOAD FILTERS
========================================= */
async function loadFilters() {
  try {
    const [years, grades, classes, semesters] = await Promise.all([
      settingsService.fetchYears(),
      settingsService.fetchGrades(),
      settingsService.fetchClasses(),
      settingsService.fetchSemesters(),
    ]);

    allClasses = classes;

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

    const semesterSelect = document.getElementById("filterHocKy");
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
    if (semesters.length > 0) semesterSelect.value = semesters[0].MaHocKy;

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

/* =========================================
   FILTER EVENTS (FIX STATE ROOT BUG)
========================================= */
function bindFilterEvents() {
  const gradeSelect = document.getElementById("filterKhoi");
  const classSelect = document.getElementById("assignClassSelect");
  const yearSelect = document.getElementById("filterNamHoc");
  const semesterSelect = document.getElementById("filterHocKy");

  const reload = async () => {
    selectedStudents.clear();
    updateAssignButton();

    await loadUnassigned();
    await loadAssigned();
  };

  yearSelect.addEventListener("change", reload);
  semesterSelect.addEventListener("change", reload);

  gradeSelect.addEventListener("change", () => {
    const grade = gradeSelect.value;

    if (!grade) {
      classSelect.innerHTML = "";
      classSelect.disabled = true;
      reloadAll();
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

    reloadAll(); // 🔥 quan trọng
  });

  classSelect.addEventListener("change", reloadAll);
}

/* =========================================
   EVENTS
========================================= */
function bindEvents() {
  document.getElementById("checkAllUnassigned").onchange = (e) => {
    const checked = e.target.checked;

    document.querySelectorAll(".student-checkbox").forEach((cb) => {
      cb.checked = checked;
      toggleStudent(cb.dataset.id, checked);
    });

    updateAssignButton();
  };

  document.getElementById("assignBtn").onclick = handleAssign;

  document.getElementById("closeTransferModal").onclick = closeModal;
  document.getElementById("cancelTransferBtn").onclick = closeModal;

  document.getElementById("transferForm").onsubmit = handleTransfer;
}

function closeModal() {
  document.getElementById("transferModal").style.display = "none";
  currentStudentId = null; // 🔥 FIX
}

/* =========================================
   LOAD UNASSIGNED
========================================= */
async function loadUnassigned() {
  const MaHocKy = document.getElementById("filterHocKy")?.value;
  const grade = document.getElementById("filterKhoi")?.value;

  const tbody = document.getElementById("unassignedTable");

  if (!MaHocKy || !grade) {
    tbody.innerHTML = `<tr><td colspan="5">Vui lòng chọn khối</td></tr>`;
    return;
  }

  const data = await getUnassignedStudents(MaHocKy);

  selectedStudents.clear(); // 🔥 FIX STATE
  updateAssignButton();

  renderUnassigned(data);
}

/* =========================================
   LOAD ASSIGNED
========================================= */
async function loadAssigned() {
  const MaLop = document.getElementById("assignClassSelect").value;
  const MaHocKy = document.getElementById("filterHocKy")?.value;

  const tbody = document.getElementById("assignedTable");
  const capacityEl = document.getElementById("classCapacity");

  if (!MaHocKy) {
    tbody.innerHTML = `<tr><td colspan="5">Vui lòng chọn học kỳ</td></tr>`;
    if (capacityEl) capacityEl.style.display = "none";
    return;
  }

  if (!MaLop) {
    tbody.innerHTML = `<tr><td colspan="5">Chọn lớp để xem học sinh</td></tr>`;
    if (capacityEl) capacityEl.style.display = "none";
    return;
  }

  const data = await getAssignedStudents(MaHocKy, MaLop);
  renderAssigned(data);

  const cls = allClasses.find((c) => c.MaLop === MaLop);
  if (cls && capacityEl) {
    document.getElementById("capacityCurrent").textContent = data.length;
    capacityEl.style.display = "block";
  }
}

/* =========================================
   RENDER UNASSIGNED (STATE SYNC FIX)
========================================= */
function renderUnassigned(data) {
  const tbody = document.getElementById("unassignedTable");

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5">Không có học sinh</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (s) => `
    <tr>
      <td>
        <input type="checkbox"
          class="student-checkbox"
          data-id="${s.MaHS}">
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
    // 🔥 sync UI với state
    cb.checked = selectedStudents.has(cb.dataset.id);

    cb.onchange = (e) => {
      toggleStudent(cb.dataset.id, e.target.checked);
      updateAssignButton();
    };
  });
}

/* =========================================
   RENDER ASSIGNED
========================================= */
function renderAssigned(data) {
  const tbody = document.getElementById("assignedTable");

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="3">Chưa có học sinh</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (s) => `
    <tr>
      <td>${s.MaHS}</td>
      <td>${s.HOCSINH?.HoTen || ""}</td>
      <td>
        <button class="action-btn edit" data-id="${s.MaHS}">
          <i class="fas fa-pen"></i>
        </button>
      </td>
    </tr>
  `,
    )
    .join("");

  document.querySelectorAll(".action-btn.edit").forEach((btn) => {
    btn.onclick = () => openTransferModal(btn.dataset.id);
  });
}

/* =========================================
   TRANSFER MODAL
========================================= */
function openTransferModal(studentId) {
  currentStudentId = studentId;

  const modal = document.getElementById("transferModal");
  const select = document.getElementById("newClassSelect");
  const currentClass = document.getElementById("assignClassSelect").value;

  select.innerHTML =
    '<option value="">--Chọn lớp--</option>' +
    allClasses
      .map(
        (c) => `
      <option value="${c.MaLop}" ${c.MaLop === currentClass ? "disabled" : ""}>
        ${c.TenLop}
      </option>
    `,
      )
      .join("");

  modal.style.display = "block";
}

/* =========================================
   STATE
========================================= */
function toggleStudent(id, checked) {
  if (checked) selectedStudents.add(id);
  else selectedStudents.delete(id);
}

function updateAssignButton() {
  const btn = document.getElementById("assignBtn");
  const classSelected = document.getElementById("assignClassSelect").value;

  btn.disabled = !(selectedStudents.size > 0 && classSelected);
  updateSelectedCount();
}

function updateSelectedCount() {
  const el = document.getElementById("selectedCount");
  if (el) el.textContent = "Đã chọn: " + selectedStudents.size;
}

/* =========================================
   HANDLE ASSIGN (ANTI BUG)
========================================= */
async function handleAssign() {
  const MaLop = document.getElementById("assignClassSelect").value;
  const MaHocKy = document.getElementById("filterHocKy").value;

  if (!MaLop || !MaHocKy || selectedStudents.size === 0) return;

  const ok = await showConfirm(
    `Bạn có muốn xếp ${selectedStudents.size} học sinh không?`,
  );

  if (!ok) return;

  const btn = document.getElementById("assignBtn");

  try {
    btn.disabled = true;

    await assignStudentsBatch({
      MaHocKy,
      MaLop,
      students: [...selectedStudents],
    });

    Toast.success("Xếp lớp thành công!");

    await reloadAll(); // 🔥 FIX CORE BUG
  } catch (err) {
    Toast.error(err.message);
  } finally {
    updateAssignButton();
  }
}

function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const msg = document.getElementById("confirmMessage");
    const ok = document.getElementById("confirmOk");
    const cancel = document.getElementById("confirmCancel");

    msg.innerText = message;
    modal.style.display = "flex";

    ok.onclick = () => {
      modal.style.display = "none";
      resolve(true);
    };

    cancel.onclick = () => {
      modal.style.display = "none";
      resolve(false);
    };
  });
}

/* =========================================
   TRANSFER
========================================= */
async function handleTransfer(e) {
  e.preventDefault();

  if (!currentStudentId) return;

  const MaHocKy = document.getElementById("filterHocKy").value;
  const MaLopMoi = document.getElementById("newClassSelect").value;

  if (!MaHocKy || !MaLopMoi) return;

  try {
    await transferClass({
      MaHS: currentStudentId,
      MaHocKy,
      MaLopMoi,
    });

    Toast.success("Chuyển lớp thành công!");

    closeModal();
    await loadAssigned();
  } catch (err) {
    Toast.error(err.message);
  }
}

/* =========================================
   UTIL
========================================= */
function formatDate(dateStr) {
  return dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : "";
}
