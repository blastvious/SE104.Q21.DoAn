import {
  getUnassignedStudents,
  getAssignedStudents,
  assignStudentsBatch,
  transferClass,
  promoteStudents,
  unassignStudent,
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
  try {
    await loadFilters();
    togglePromoteButton();
    bindFilterEvents();
    bindEvents();
  } catch (err) {
    console.error("class-assignment init error:", err);
  }
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
  togglePromoteButton();

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
    togglePromoteButton();
    await reload();
  });

  // CLASS CHANGE
  classSelect.addEventListener("change", reloadAll);
}

/* =========================================
   EVENTS
========================================= */
function bindEvents() {
  document.addEventListener("change", (e) => {
    if (e.target.id === "checkAllUnassigned") {
      const checked = e.target.checked;
      document.querySelectorAll(".student-checkbox").forEach((cb) => {
        cb.checked = checked;
        toggleStudent(cb.dataset.id, checked);
      });
      updateAssignButton();
    }

    if (e.target.id === "checkAllAssigned") {
      const checked = e.target.checked;
      document.querySelectorAll(".assigned-checkbox").forEach((cb) => {
        cb.checked = checked;
        if (checked) selectedAssignedStudents.add(cb.dataset.id);
        else selectedAssignedStudents.delete(cb.dataset.id);
      });
      updatePromoteButton();
    }
  });

  document.getElementById("promoteBtn").onclick = handlePromote;
  document.getElementById("exportClassListBtn").onclick = exportClassListPDF;

  let guideCollapsed = true;
  document.getElementById("toggleGuideBtn").onclick = () => {
      guideCollapsed = !guideCollapsed;
      const body = document.querySelector(".guide-card-body");
      const card = document.querySelector(".guide-card");
      const btn = document.getElementById("toggleGuideBtn");
      if (guideCollapsed) {
          body.classList.add("collapsed");
          card.classList.add("is-collapsed");
          btn.textContent = "+";
      } else {
          body.classList.remove("collapsed");
          card.classList.remove("is-collapsed");
          btn.textContent = "\u2212";
      }
  };

  let assignedCollapsed = false;
  document.getElementById("toggleAssignedBtn").onclick = () => {
      assignedCollapsed = !assignedCollapsed;
      const content = document.getElementById("assignedContent");
      const btn = document.getElementById("toggleAssignedBtn");
      const grid = document.querySelector(".assignment-grid");
      const card = document.querySelector(".assignment-card:last-child");
      if (assignedCollapsed) {
          content.classList.add("collapsed");
          btn.textContent = "+";
          grid.classList.add("has-collapsed");
          if (card) card.classList.add("is-collapsed");
      } else {
          content.classList.remove("collapsed");
          btn.textContent = "\u2212";
          grid.classList.remove("has-collapsed");
          if (card) card.classList.remove("is-collapsed");
      }
  };

  document.getElementById("assignBtn").onclick = handleAssign;

  document.getElementById("closeTransferModal").onclick = closeModal;
  document.getElementById("cancelTransferBtn").onclick = closeModal;

  document.getElementById("closePromoteModal").onclick = closePromoteModal;
  document.getElementById("cancelPromoteBtn").onclick = closePromoteModal;
  document.getElementById("promoteForm").onsubmit = handlePromoteSubmit;

  document.getElementById("transferForm").onsubmit = handleTransfer;
  document
  .getElementById("searchUnassigned")
  .addEventListener("input", handleSearchUnassigned);
  
  let unassignedCollapsed = false;
  document.getElementById("toggleUnassignedBtn").onclick = () => {
      unassignedCollapsed = !unassignedCollapsed;
      const content = document.getElementById("unassignedContent");
      const btn = document.getElementById("toggleUnassignedBtn");
      const grid = document.querySelector(".assignment-grid");
      const searchRow = document.querySelector(".unassigned-search-row");
      const card = document.querySelector(".assignment-card:first-child");
      if (unassignedCollapsed) {
          content.classList.add("collapsed");
          btn.textContent = "+";
          grid.classList.add("has-collapsed");
          if (searchRow) searchRow.style.display = "none";
          if (card) card.classList.add("is-collapsed");
      } else {
          content.classList.remove("collapsed");
          btn.textContent = "\u2212";
          grid.classList.remove("has-collapsed");
          if (searchRow) searchRow.style.display = "";
          if (card) card.classList.remove("is-collapsed");
      }
      loadAssigned(); 
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
    tbody.innerHTML = `<tr><td colspan="3">Vui lòng chọn khối</td></tr>`;
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
    tbody.innerHTML = `<tr><td colspan="4">Vui lòng chọn học kỳ</td></tr>`;
    if (capacityEl) capacityEl.style.display = "none";
    return;
  }

  if (!MaLop) {
    tbody.innerHTML = `<tr><td colspan="4">Chọn lớp để xem học sinh</td></tr>`;
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
    tbody.innerHTML = `<tr><td colspan="3">Không có học sinh</td></tr>`;
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
    </tr>
  `,
    )
    .join("");

  document.querySelectorAll(".student-checkbox").forEach((cb) => {
    cb.checked = selectedStudents.has(cb.dataset.id);

    cb.onchange = (e) => {
      toggleStudent(cb.dataset.id, e.target.checked);
      updateAssignButton();
      syncCheckAllUnassigned();
    };
  });
}

/* =========================================
   RENDER ASSIGNED
========================================= */
function renderAssigned(data) {
  const tbody = document.getElementById("assignedTable");
  const isCollapsed = document.querySelector(".assignment-grid")?.classList.contains("has-collapsed");

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="${isCollapsed ? 9 : 4}">Chưa có học sinh</td></tr>`;
    return;
  }

  const thead = tbody.closest("table").querySelector("thead tr");
  thead.innerHTML = isCollapsed ? `
      <th><input type="checkbox" id="checkAllAssigned"></th>
      <th>Mã HS</th>
      <th>Họ Tên</th>
      <th>Ngày Sinh</th>
      <th>Giới Tính</th>
      <th>Địa Chỉ</th>
      <th>Email</th>
      <th>SĐT</th>
      <th style="text-align:center">Thao tác</th>
  ` : `
      <th><input type="checkbox" id="checkAllAssigned"></th>
      <th>Mã HS</th>
      <th>Họ Tên</th>
      <th style="text-align:center">Thao tác</th>
  `;

  tbody.innerHTML = data.map(s => {
    const base = `
      <td><input type="checkbox" class="assigned-checkbox" data-id="${s.MaHS}"></td>
      <td>${s.MaHS}</td>
      <td>${s.HOCSINH?.HoTen || ""}</td>
  `;
    const fullInfo = `
      <td>${formatDate(s.HOCSINH?.NgaySinh)}</td>
      <td>${s.HOCSINH?.GioiTinh || ""}</td>
  `;
    const extra = isCollapsed ? `
      ${fullInfo}
      <td>${s.HOCSINH?.DiaChi || "--"}</td>
      <td>${s.HOCSINH?.Email || "--"}</td>
      <td>${s.HOCSINH?.SoDienThoai || "--"}</td>
      <td>
        <button class="action-btn edit" data-id="${s.MaHS}" title="Chuyển lớp">
          <i class="fas fa-exchange-alt"></i>
        </button>
        <button class="action-btn delete" data-id="${s.MaHS}" title="Hủy xếp lớp" style="color:#ef4444;">
          <i class="fas fa-times"></i>
        </button>
      </td>
    ` : `
      <td>
        <button class="action-btn edit" data-id="${s.MaHS}" title="Chuyển lớp">
          <i class="fas fa-exchange-alt"></i>
        </button>
        <button class="action-btn delete" data-id="${s.MaHS}" title="Hủy xếp lớp" style="color:#ef4444;">
          <i class="fas fa-times"></i>
        </button>
      </td>
    `;
    return `<tr>${base}${extra}</tr>`;
    }).join("");

  document.querySelectorAll(".action-btn.edit").forEach((btn) => {
    btn.onclick = () => openTransferModal(btn.dataset.id);
  });
  document.querySelectorAll(".action-btn.delete").forEach((btn) => {
    btn.onclick = () => handleUnassign(btn.dataset.id);
  });
  document.querySelectorAll(".assigned-checkbox").forEach((cb) => {
    cb.checked = selectedAssignedStudents.has(cb.dataset.id);

    cb.onchange = (e) => {
      if (e.target.checked) selectedAssignedStudents.add(cb.dataset.id);
      else selectedAssignedStudents.delete(cb.dataset.id);

      updatePromoteButton();
      syncCheckAllAssigned();
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
  const yearSelected = document.getElementById("filterNamHoc").value;
  const classSelected = document.getElementById("assignClassSelect").value;

  btn.disabled = selectedAssignedStudents.size === 0 || !classSelected || !yearSelected;

  const el = document.getElementById("assignedSelectedCount");
  if (el) el.textContent = "Đã chọn: " + selectedAssignedStudents.size;
}

function togglePromoteButton() {
  const grade = document.getElementById("filterKhoi").value;
  const btn = document.getElementById("promoteBtn");
  btn.style.display = grade === "KL03" ? "none" : "";
}

function syncCheckAllUnassigned() {
  const checkboxes = document.querySelectorAll(".student-checkbox");
  const allChecked = checkboxes.length > 0 && [...checkboxes].every((cb) => cb.checked);
  document.getElementById("checkAllUnassigned").checked = allChecked;
}

function syncCheckAllAssigned() {
  const checkboxes = document.querySelectorAll(".assigned-checkbox");
  const allChecked = checkboxes.length > 0 && [...checkboxes].every((cb) => cb.checked);
  document.getElementById("checkAllAssigned").checked = allChecked;
}

function updateAssignButton() {
  const btn = document.getElementById("assignBtn");
  const classSelected = document.getElementById("assignClassSelect").value;

  btn.disabled = !classSelected;
  updateSelectedCount();
  updateExportButton();
}

function updateExportButton() {
  const btn = document.getElementById("exportClassListBtn");
  const classSelected = document.getElementById("assignClassSelect").value;
  btn.disabled = !classSelected;
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
  let tenLop = document.getElementById("assignClassSelect").selectedOptions[0].textContent;
  tenLop = tenLop.replace(/^Lớp\s*/i, "");

  if (!MaLop || !MaHocKy) return;

  let students;
  if (selectedStudents.size > 0) {
    students = [...selectedStudents];
  } else {
    const shuffled = [...unassignedStudents].sort(() => Math.random() - 0.5);
    students = shuffled.slice(0, 40).map(s => s.MaHS);
  }

  if (students.length === 0) return;

  const ok = await showConfirm(
    `Bạn có chắc chắn muốn thêm ${students.length} học sinh vào lớp <span style="white-space:nowrap">${tenLop}</span> không?`,
  );

  if (!ok) return;

  const btn = document.getElementById("assignBtn");

  try {
    btn.disabled = true;

    await assignStudentsBatch({
      MaHocKy,
      MaLop,
      students,
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

    msg.innerHTML = message;
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
   EXPORT CLASS LIST PDF
========================================= */
async function exportClassListPDF() {
  const MaLop = document.getElementById("assignClassSelect").value;
  const MaHocKy = document.getElementById("filterHocKy")?.value;
  if (!MaLop || !MaHocKy) return;

  const btn = document.getElementById("exportClassListBtn");
  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xuất...';

    const data = await getAssignedStudents(MaHocKy, MaLop);
    if (!data.length) {
      Toast.warning("Lớp chưa có học sinh");
      return;
    }

    const cls = allClasses.find(c => c.MaLop === MaLop);
    const tenLop = cls?.TenLop || MaLop;
    const tenNamHoc = cls?.TenNamHoc || "";

    const d = new Date();
    const today = `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;

    const rows = data.map((s, i) => {
      const hs = s.HOCSINH || {};
      return `<tr>
        <td style="text-align:center;border:1px solid #000;padding:5px">${i + 1}</td>
        <td style="text-align:center;border:1px solid #000;padding:5px">${s.MaHS}</td>
        <td style="border:1px solid #000;padding:5px">${hs.HoTen || ""}</td>
        <td style="text-align:center;border:1px solid #000;padding:5px">${formatDate(hs.NgaySinh)}</td>
        <td style="text-align:center;border:1px solid #000;padding:5px">${hs.GioiTinh || ""}</td>
        <td style="border:1px solid #000;padding:5px">${hs.DiaChi || "--"}</td>
        <td style="border:1px solid #000;padding:5px">${hs.Email || "--"}</td>
        <td style="text-align:center;border:1px solid #000;padding:5px">${hs.SoDienThoai || "--"}</td>
      </tr>`;
    }).join("");

    const pdfHtml = `
      <div style="width:794px;background:#fff;color:#000;padding:40px;font-family:'Times New Roman',serif;font-size:14px;line-height:1.6;box-sizing:border-box">
        <table style="width:100%;border:none;border-collapse:collapse;margin-bottom:20px">
          <tr>
            <td style="width:40%;text-align:center;border:none;vertical-align:top">
              <div style="font-weight:bold">TRƯỜNG THPT VinSchool</div>
            </td>
            <td style="width:60%;text-align:center;border:none;vertical-align:top">
              <div style="font-weight:bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div style="font-weight:bold;border-bottom:1px solid #000;display:inline-block;padding-bottom:2px;margin-top:4px">Độc lập - Tự do - Hạnh phúc</div>
              <div style="font-style:italic;margin-top:6px">${today}</div>
            </td>
          </tr>
        </table>
        <div style="text-align:center;margin:20px 0 24px">
          <div style="font-size:22px;font-weight:bold;text-transform:uppercase">DANH SÁCH LỚP</div>
          <div style="margin-top:8px">Lớp <b>${tenLop}</b> – Năm học <b>${tenNamHoc}</b></div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:#e8d5f5">
              <th style="border:1px solid #000;padding:6px;text-align:center">STT</th>
              <th style="border:1px solid #000;padding:6px;text-align:center">Mã HS</th>
              <th style="border:1px solid #000;padding:6px;text-align:center">Họ Tên</th>
              <th style="border:1px solid #000;padding:6px;text-align:center">Ngày Sinh</th>
              <th style="border:1px solid #000;padding:6px;text-align:center">Giới Tính</th>
              <th style="border:1px solid #000;padding:6px;text-align:center">Địa Chỉ</th>
              <th style="border:1px solid #000;padding:6px;text-align:center">Email</th>
              <th style="border:1px solid #000;padding:6px;text-align:center">SĐT</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <table style="width:100%;border:none;border-collapse:collapse;margin-top:40px">
          <tr>
            <td style="width:60%;border:none"></td>
            <td style="width:40%;text-align:center;border:none;vertical-align:top">
              <div style="font-weight:bold">Xác nhận của nhà trường</div>
              <div style="margin-top:50px;font-style:italic">(Ký, đóng dấu)</div>
            </td>
          </tr>
        </table>
      </div>`;

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:absolute;left:-9999px;top:0";
    wrapper.innerHTML = pdfHtml;
    document.body.appendChild(wrapper);

    await new Promise(r => setTimeout(r, 200));
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#fff",
      width: 794,
      windowWidth: 794,
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("portrait", "mm", "a4");
    const pdfW = 190;
    const pdfH = (canvas.height * pdfW) / canvas.width;

    let heightLeft = pdfH;
    let position = 8;

    pdf.addImage(imgData, "JPEG", 10, position, pdfW, pdfH);
    heightLeft -= 277;

    while (heightLeft > 0) {
      position = heightLeft - pdfH + 8;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 10, position, pdfW, pdfH);
      heightLeft -= 277;
    }

    pdf.save(`DanhSachLop_${tenLop}_${tenNamHoc}.pdf`);
    document.body.removeChild(wrapper);

    Toast.success("Xuất danh sách lớp thành công!");
  } catch (err) {
    console.error("exportClassListPDF error:", err);
    Toast.error("Lỗi xuất PDF: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-file-pdf"></i> Xuất danh sách lớp';
  }
}

/* =========================================
   HANDLE UNASSIGN
========================================= */
async function handleUnassign(maHS) {
  const MaLop = document.getElementById("assignClassSelect").value;
  const MaHocKy = document.getElementById("filterHocKy")?.value;
  if (!MaLop || !MaHocKy) return;

  const ok = await showConfirm(`Bạn có muốn hủy xếp lớp cho học sinh này?`);
  if (!ok) return;

  try {
    await unassignStudent({ MaHS: maHS, MaHocKy, MaLop });
    Toast.success("Hủy xếp lớp thành công");
    await loadAssigned();
    await loadUnassigned();
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

  const MaLopCu = document.getElementById("assignClassSelect").value;
  const MaHocKyCu = document.getElementById("filterHocKy").value;
  const currentClass = allClasses.find((c) => c.MaLop === MaLopCu);

  if (!currentClass) return;

  const available = getPromotableClasses(currentClass);

  if (available.length === 0) {
    Toast.error("Không có lớp kế tiếp trong năm học sau");
    return;
  }

  // kiểm tra học sinh đã được lên lớp chưa
  try {
    const allAssigned = await getAssignedStudents(MaHocKyCu);
    const nextYearClassIds = new Set(available.map((c) => c.MaLop));

    const alreadyPromoted = [];
    for (const maHS of selectedAssignedStudents) {
      const found = allAssigned.find(
        (s) => nextYearClassIds.has(s.MaLop) && s.MaHS === maHS,
      );
      if (found) {
        alreadyPromoted.push({ maHS: found.MaHS, hoTen: found.HOCSINH?.HoTen || found.MaHS });
      }
    }

    if (alreadyPromoted.length === selectedAssignedStudents.size) {
      Toast.error("Học sinh đã được lên lớp!");
      return;
    }

    if (alreadyPromoted.length > 0) {
      const nameList = alreadyPromoted.map((s) => `${s.hoTen} (${s.maHS})`).join("\n");
      const ok = await showConfirm(
        `Các học sinh sau đã được lên lớp:\n${nameList}\n\nBạn có muốn lên lớp cho các học sinh còn lại không?`,
      );
      if (!ok) return;
      // bỏ học sinh đã lên lớp khỏi danh sách chọn
      alreadyPromoted.forEach((s) => selectedAssignedStudents.delete(s.maHS));
      if (selectedAssignedStudents.size === 0) return;
    }
  } catch (_) {
    // bỏ qua lỗi
  }

  openPromoteModal(available, currentClass, MaHocKyCu);
}

function getPromotableClasses(currentClass) {
  let nextKhoi = null;
  if (currentClass.MaKhoiLop === "KL01") nextKhoi = "KL02";
  else if (currentClass.MaKhoiLop === "KL02") nextKhoi = "KL03";
  else return [];

  const [start, end] = currentClass.TenNamHoc.split("-");
  const nextYear = `${parseInt(start) + 1}-${parseInt(end) + 1}`;

  return allClasses.filter(
    (c) => c.MaKhoiLop === nextKhoi && c.TenNamHoc === nextYear,
  );
}

function openPromoteModal(available, currentClass, MaHocKyCu) {
  const modal = document.getElementById("promoteModal");
  const select = document.getElementById("promoteClassSelect");
  const info = document.getElementById("promoteInfo");

  info.textContent = `Lớp hiện tại: ${currentClass.TenLop} (${currentClass.TenNamHoc}) — Chọn lớp muốn lên cho ${selectedAssignedStudents.size} học sinh`;

  select.innerHTML =
    '<option value="">--Chọn lớp--</option>' +
    available
      .map(
        (c) => `
      <option value="${c.MaLop}">
        ${c.TenLop} (${c.TenNamHoc})
      </option>
    `,
      )
      .join("");

  modal.dataset.maHocKyCu = MaHocKyCu;
  modal.dataset.maLopCu = currentClass.MaLop;
  modal.style.display = "block";
}

function closePromoteModal() {
  document.getElementById("promoteModal").style.display = "none";
}

async function handlePromoteSubmit(e) {
  e.preventDefault();

  const modal = document.getElementById("promoteModal");
  const MaLopCu = modal.dataset.maLopCu;
  const MaHocKyCu = modal.dataset.maHocKyCu;
  const MaLopMoi = document.getElementById("promoteClassSelect").value;

  if (!MaLopMoi) {
    Toast.warning("Vui lòng chọn lớp muốn lên");
    return;
  }

  try {
    await promoteStudents({
      students: [...selectedAssignedStudents],
      MaLopCu,
      MaHocKyCu,
      MaLopMoi,
      MaHocKyMoi: MaHocKyCu,
    });

    Toast.success("Lên lớp thành công!");
    closePromoteModal();
    selectedAssignedStudents.clear();
    await reloadAll();
  } catch (err) {
    Toast.error(err.message);
  }
}
