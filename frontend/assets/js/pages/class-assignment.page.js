import {
  getUnassignedStudents,
  getAssignedStudents,
  assignStudentsBatch,
  transferClass,
  promoteStudents,
} from "../service/studyProcess.service.js";

import { settingsService } from "../service/settings.service.js";

/* =========================================
   STATE
========================================= */
let selectedStudents = new Set();
let selectedAssignedStudents = new Set();
let allClasses = [];
let currentStudentId = null;
let unassignedStudents = [];
let filteredUnassignedStudents = [];

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
  selectedAssignedStudents.clear();
  currentStudentId = null;

  // RESET CHECKBOX ALL
  const checkUnassigned = document.getElementById("checkAllUnassigned");
  const checkAssigned = document.getElementById("checkAllAssigned");

  if (checkUnassigned) checkUnassigned.checked = false;
  if (checkAssigned) checkAssigned.checked = false;

  updateAssignButton();
  updatePromoteButton();

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

function renderClassOptions() {
  const grade = document.getElementById("filterKhoi").value;
  const year = document.getElementById("filterNamHoc").value;
  const classSelect = document.getElementById("assignClassSelect");

  if (!grade || !year) {
    classSelect.innerHTML = "";
    classSelect.disabled = true;
    return;
  }

  // FILTER THEO KHỐI + NĂM HỌC
  const filtered = allClasses.filter(
    (c) => c.MaKhoiLop === grade && c.TenNamHoc === year,
  );

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
  selectedAssignedStudents.clear();

  // reset checkbox all
  const checkUnassigned =
    document.getElementById("checkAllUnassigned");

  const checkAssigned =
    document.getElementById("checkAllAssigned");

  if (checkUnassigned)
    checkUnassigned.checked = false;

  if (checkAssigned)
    checkAssigned.checked = false;

  updateAssignButton();
  updatePromoteButton();

  await loadUnassigned();
  await loadAssigned();
};

  // YEAR CHANGE
  yearSelect.addEventListener("change", async () => {
    renderClassOptions();
    await reload();
  });

  // SEMESTER CHANGE
  semesterSelect.addEventListener("change", reload);

  // GRADE CHANGE
  gradeSelect.addEventListener("change", async () => {
    renderClassOptions();
    await reload();
  });

  // CLASS CHANGE
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

  // NEW
  document.getElementById("checkAllAssigned").onchange = (e) => {
    const checked = e.target.checked;

    document.querySelectorAll(".assigned-checkbox").forEach((cb) => {
      cb.checked = checked;

      if (checked) selectedAssignedStudents.add(cb.dataset.id);
      else selectedAssignedStudents.delete(cb.dataset.id);
    });

    updatePromoteButton();
  };

  document.getElementById("promoteBtn").onclick = handlePromote;

  document.getElementById("assignBtn").onclick = handleAssign;

  document.getElementById("closeTransferModal").onclick = closeModal;
  document.getElementById("cancelTransferBtn").onclick = closeModal;

  document.getElementById("transferForm").onsubmit = handleTransfer;
  document
  .getElementById("searchUnassigned")
  .addEventListener("input", handleSearchUnassigned);
  
  let unassignedCollapsed = false;
  document.getElementById("toggleUnassignedBtn").onclick = () => {
      unassignedCollapsed = !unassignedCollapsed;
      const content = document.getElementById("unassignedContent");
      const icon = document.querySelector("#toggleUnassignedBtn i");
      const grid = document.querySelector(".assignment-grid");
      if (unassignedCollapsed) {
          content.classList.add("collapsed");
          icon.className = "fas fa-plus";
          grid.classList.add("has-collapsed");
      } else {
          content.classList.remove("collapsed");
          icon.className = "fas fa-minus";
          grid.classList.remove("has-collapsed");
      }
  };
}

function closeModal() {
  document.getElementById("transferModal").style.display = "none";
  currentStudentId = null;
}


function handleSearchUnassigned(e) {
  const keyword = e.target.value.toLowerCase().trim();

  if (!keyword) {
    filteredUnassignedStudents = unassignedStudents;
  } else {
    filteredUnassignedStudents = unassignedStudents.filter((s) => {
      return (
        s.MaHS?.toLowerCase().includes(keyword) ||
        s.HoTen?.toLowerCase().includes(keyword)
      );
    });
  }

  renderUnassigned(filteredUnassignedStudents);
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

unassignedStudents = data;
filteredUnassignedStudents = data;

selectedStudents.clear();
updateAssignButton();

renderUnassigned(filteredUnassignedStudents);
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
    tbody.innerHTML = `<tr><td colspan="4">Chưa có học sinh</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (s) => `
    <tr>
        <td><input type="checkbox" class="assigned-checkbox" data-id="${s.MaHS}"></td>
        <td>${s.MaHS}</td>
        <td>${s.HOCSINH?.HoTen || ""}</td>
        <td>${formatDate(s.HOCSINH?.NgaySinh)}</td>
        <td>${s.HOCSINH?.GioiTinh || ""}</td>
        <td>${s.HOCSINH?.DiaChi || "--"}</td>
        <td>${s.HOCSINH?.Email || "--"}</td>
        <td>${s.HOCSINH?.SoDienThoai || "--"}</td>
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
  document.querySelectorAll(".assigned-checkbox").forEach((cb) => {
    cb.checked = selectedAssignedStudents.has(cb.dataset.id);

    cb.onchange = (e) => {
      if (e.target.checked) selectedAssignedStudents.add(cb.dataset.id);
      else selectedAssignedStudents.delete(cb.dataset.id);

      updatePromoteButton();
    };
  });
}

/* =========================================
   TRANSFER MODAL
========================================= */


function openTransferModal(studentId) {
  currentStudentId = studentId;

  const modal = document.getElementById("transferModal");
  const select = document.getElementById("newClassSelect");

  const currentClassId =
    document.getElementById("assignClassSelect").value;

  const currentClass = allClasses.find(
    (c) => c.MaLop === currentClassId,
  );

  if (!currentClass) return;

  // chỉ lấy lớp cùng khối + cùng năm học
  const availableClasses = allClasses.filter(
    (c) =>
      c.MaKhoiLop === currentClass.MaKhoiLop &&
      c.TenNamHoc === currentClass.TenNamHoc,
  );

  select.innerHTML =
    '<option value="">--Chọn lớp--</option>' +
    availableClasses
      .map(
        (c) => `
      <option
        value="${c.MaLop}"
        ${c.MaLop === currentClassId ? "disabled" : ""}
      >
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

function updatePromoteButton() {
  const btn = document.getElementById("promoteBtn");

  btn.disabled = selectedAssignedStudents.size === 0;
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

    await reloadAll();
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
  const MaLopCu =
    document.getElementById("assignClassSelect").value;

  await transferClass({
    MaHS: currentStudentId,
    MaHocKy,
    MaLopCu,
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

async function handlePromote() {
  if (selectedAssignedStudents.size === 0) return;

  const ok = await showConfirm(
    `Bạn có muốn lên lớp ${selectedAssignedStudents.size} học sinh không?`,
  );

  if (!ok) return;

  const MaLopCu = document.getElementById("assignClassSelect").value;

  const MaHocKyCu = document.getElementById("filterHocKy").value;

  const nextClass = getNextClass(MaLopCu);

  if (!nextClass) {
    Toast.error("Không tìm thấy lớp kế tiếp");
    return;
  }

  const MaLopMoi = nextClass.MaLop;
  const MaHocKyMoi = MaHocKyCu;

  try {
    await promoteStudents({
      students: [...selectedAssignedStudents],
      MaLopCu,
      MaHocKyCu,
      MaLopMoi,
      MaHocKyMoi,
    });

    Toast.success("Lên lớp thành công!");

    selectedAssignedStudents.clear();

    await reloadAll();
  } catch (err) {
    Toast.error(err.message);
  }
}

function getNextClass(currentClassId) {
  const currentClass = allClasses.find((c) => c.MaLop === currentClassId);

  if (!currentClass) return null;

  // Ví dụ:
  // KL01 -> KL02
  // KL02 -> KL03

  let nextKhoi = null;

  if (currentClass.MaKhoiLop === "KL01") nextKhoi = "KL02";
  else if (currentClass.MaKhoiLop === "KL02") nextKhoi = "KL03";
  else return null; // lớp 12 không lên nữa

  // năm học tiếp theo
  const [start, end] = currentClass.TenNamHoc.split("-");

  const nextYear = `${parseInt(start) + 1}-${parseInt(end) + 1}`;

  // ví dụ:
  // 10A1 -> 11A1
  // 11A1 -> 12A1

  let nextTenLop = currentClass.TenLop;

  if (currentClass.MaKhoiLop === "KL01") {
    nextTenLop = currentClass.TenLop.replace(/^10/, "11");
  } else if (currentClass.MaKhoiLop === "KL02") {
    nextTenLop = currentClass.TenLop.replace(/^11/, "12");
  }

  return allClasses.find(
    (c) =>
      c.MaKhoiLop === nextKhoi &&
      c.TenNamHoc === nextYear &&
      c.TenLop === nextTenLop,
  );
}
