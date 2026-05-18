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

export const init = async () => {
  await loadFilters();
  bindFilterEvents();
  bindEvents();
  loadUnassigned();
};

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

function bindFilterEvents() {
  const gradeSelect = document.getElementById("filterKhoi");
  const assignClassSelect = document.getElementById("assignClassSelect");
  const yearSelect = document.getElementById("filterNamHoc");
  const semesterSelect = document.getElementById("filterHocKy");

  const reload = () => {
    selectedStudents.clear();
    updateAssignButton();
    loadUnassigned();
    loadAssigned();
  };

  yearSelect.addEventListener("change", reload);
  if (semesterSelect) semesterSelect.addEventListener("change", reload);

  gradeSelect.addEventListener("change", () => {
    const grade = gradeSelect.value;

    if (!grade) {
      assignClassSelect.innerHTML = "";
      assignClassSelect.disabled = true;
      return;
    }

    const filtered = allClasses.filter((c) => c.MaKhoiLop === grade);

    assignClassSelect.innerHTML =
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

    assignClassSelect.disabled = false;
    reload();
  });

  assignClassSelect.addEventListener("change", () => {
    selectedStudents.clear();
    updateAssignButton();
    loadAssigned();
  });
}

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

async function loadUnassigned() {
  try {
    const MaHocKy = document.getElementById("filterHocKy")?.value;

    if (!MaHocKy) {
      document.getElementById("unassignedTable").innerHTML = `
        <tr><td colspan="5" class="empty-table">
            Vui lòng chọn học kỳ
        </td></tr>
      `;
      return;
    }

    const unassigned = await getUnassignedStudents(MaHocKy);
    renderUnassigned(unassigned);
  } catch (err) {
    console.error(err);
  }
}

async function loadAssigned() {
  try {
    const MaLop = document.getElementById("assignClassSelect").value;
    const MaHocKy = document.getElementById("filterHocKy")?.value;

    if (!MaHocKy) {
      document.getElementById("assignedTable").innerHTML = `
        <tr><td colspan="5" class="empty-table">
            Vui lòng chọn học kỳ
        </td></tr>
      `;
      return;
    }

    if (!MaLop) {
      document.getElementById("assignedTable").innerHTML = `
        <tr><td colspan="5" class="empty-table">
            Chọn lớp để xem học sinh đã xếp
        </td></tr>
      `;
      return;
    }

    const assigned = await getAssignedStudents(MaHocKy, MaLop);
    renderAssigned(assigned);
  } catch (err) {
    console.error(err);
  }
}

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

function renderAssigned(data) {
  const tbody = document.getElementById("assignedTable");

  if (!data.length) {
    tbody.innerHTML = `
      <tr><td colspan="3" class="empty-table">
        Hiện chưa có học sinh nào ở lớp này
      </td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (s) => `
    <tr>
        <td>${s.MaHS}</td>
        <td>${s.HOCSINH?.HoTen || ""}</td>
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
  const currentClass = document.getElementById("assignClassSelect").value;

  select.innerHTML =
    '<option value="">--Chọn lớp--</option>' +
    allClasses.map(c => `
      <option value="${c.MaLop}" ${c.MaLop === currentClass ? "disabled" : ""}>
        ${c.TenLop}
      </option>
    `).join("");

  modal.style.display = "block";
}

function toggleStudent(id, checked) {
  if (checked) selectedStudents.add(id);
  else selectedStudents.delete(id);
}

function updateAssignButton() {
  const btn = document.getElementById("assignBtn");
  const hasClass = document.getElementById("assignClassSelect").value;

  btn.disabled = selectedStudents.size === 0 || !hasClass;
}

async function handleAssign() {
  const MaLop = document.getElementById("assignClassSelect").value;
  const MaHocKy = document.getElementById("filterHocKy").value;

  if (!MaLop) {
    alert("Vui lòng chọn lớp");
    return;
  }

  if (!MaHocKy) {
    alert("Vui lòng chọn học kỳ");
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
    document.getElementById("checkAllUnassigned").checked = false;
    loadUnassigned();
    loadAssigned();
  } catch (err) {
    alert(err.message);
  }
}

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

    document.getElementById("transferModal").style.display = "none";
    document.getElementById("transferForm").reset();
    loadAssigned();
  } catch (err) {
    alert(err.message);
  }
}
