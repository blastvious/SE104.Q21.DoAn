import {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../service/subject.service.js";

let editingSubjectId = null;

let isSubmitting = false;

/* =========================
   INIT
========================= */
export async function init() {
  setupModal();

  setupForm();

  setupSearch();

  setupTableActions();

  await loadSubjects();
}

/* =========================
   LOAD SUBJECTS
========================= */
async function loadSubjects(keyword = "") {
  try {
    const subjects = await getAllSubjects(keyword);

    const tbody = document.getElementById("subjectTableBody");

    tbody.innerHTML = "";

    /* =========================
       UPDATE STATS
    ========================= */
    updateStats(subjects);

    /* =========================
       EMPTY TABLE
    ========================= */
    if (subjects.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-table">
            Không có môn học nào
          </td>
        </tr>
      `;

      return;
    }

    /* =========================
       RENDER TABLE
    ========================= */
    subjects.forEach((subject) => {
      tbody.innerHTML += `
        <tr>

          <td>
            ${subject.MaMonHoc}
          </td>

          <td>
            ${subject.TenMonHoc}
          </td>

          <td>
  <span class="subject-badge hs${Number(subject.HeSo)}">
    Hệ số ${subject.HeSo}
  </span>
</td>

          <td>

            <div class="action-group">

              <button
                class="action-btn edit"
                data-id="${subject.MaMonHoc}"
                data-name="${subject.TenMonHoc}"
                data-heso="${subject.HeSo}"
              >
                <i class="fas fa-pen"></i>
              </button>

              <button
                class="action-btn delete"
                data-id="${subject.MaMonHoc}"
              >
                <i class="fas fa-trash"></i>
              </button>

            </div>

          </td>

        </tr>
      `;
    });
  } catch (error) {
    console.error(error);

    Toast.error("Không thể tải danh sách môn học");
  }
}

/* =========================
   UPDATE STATS
========================= */
function updateStats(subjects) {
  document.getElementById("totalSubjects").textContent = subjects.length;

  /* =========================
     SUBJECT HIGHEST HESO
  ========================= */
  if (subjects.length > 0) {
    const highest = [...subjects].sort((a, b) => b.HeSo - a.HeSo)[0];

    document.getElementById("highestSubject").textContent = highest.TenMonHoc;

    /* =========================
       AVG HESO
    ========================= */
    const avg =
      subjects.reduce((sum, s) => sum + Number(s.HeSo), 0) / subjects.length;

    document.getElementById("avgHeSo").textContent = avg.toFixed(1);
  } else {
    document.getElementById("highestSubject").textContent = "--";

    document.getElementById("avgHeSo").textContent = "0";
  }
}

/* =========================
   MODAL
========================= */
function setupModal() {
  const modal = document.getElementById("subjectModal");

  document.addEventListener("click", function (event) {
    /* =========================
         OPEN MODAL
      ========================= */
    if (event.target.id === "openSubjectModal") {
      editingSubjectId = null;

      resetForm();

      document.getElementById("subjectModalTitle").textContent = "Thêm Môn Học";

      modal.style.display = "block";
    }

    /* =========================
         CLOSE MODAL
      ========================= */
    if (
      event.target.id === "closeSubjectModal" ||
      event.target.id === "cancelSubjectBtn"
    ) {
      modal.style.display = "none";
    }

    /* =========================
         CLICK OUTSIDE
      ========================= */
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
}

/* =========================
   FORM SUBMIT
========================= */
function setupForm() {
  const form = document.getElementById("subjectForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (isSubmitting) return;

    isSubmitting = true;

    try {
      const TenMonHoc = document.getElementById("subjectName").value.trim();

      const HeSo = document.getElementById("subjectHeSo").value;

      /* =========================
           UPDATE
        ========================= */
      if (editingSubjectId) {
        await updateSubject(editingSubjectId, {
          TenMonHoc,
          HeSo,
        });

        Toast.success("Cập nhật môn học thành công");
      } else {
        /* =========================
             CREATE
          ========================= */
        await createSubject({
          TenMonHoc,
          HeSo,
        });

        Toast.success("Thêm môn học thành công");
      }

      form.reset();

      editingSubjectId = null;

      document.getElementById("subjectModal").style.display = "none";

      await loadSubjects();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      isSubmitting = false;
    }
  });
}

/* =========================
   TABLE ACTIONS
========================= */
function setupTableActions() {
  const tbody = document.getElementById("subjectTableBody");

  tbody.addEventListener("click", async function (e) {
    /* =========================
         EDIT
      ========================= */
    const editBtn = e.target.closest(".action-btn.edit");

    if (editBtn) {
      editingSubjectId = editBtn.dataset.id;

      document.getElementById("subjectName").value = editBtn.dataset.name;

      document.getElementById("subjectHeSo").value = editBtn.dataset.heso;

      document.getElementById("subjectModalTitle").textContent =
        "Cập Nhật Môn Học";

      document.getElementById("subjectModal").style.display = "block";

      return;
    }

    /* =========================
         DELETE
      ========================= */
    const deleteBtn = e.target.closest(".action-btn.delete");

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;

      const confirmDelete = confirm("Bạn có chắc muốn xóa môn học này?");

      if (!confirmDelete) return;

      try {
        await deleteSubject(id);

        Toast.success("Xóa môn học thành công");

        await loadSubjects();
      } catch (error) {
        Toast.error(error.message);
      }
    }
  });
}

/* =========================
   SEARCH
========================= */
function setupSearch() {
  const input = document.getElementById("subjectSearchInput");

  input.addEventListener("input", async function () {
    const keyword = this.value.trim();

    await loadSubjects(keyword);
  });
}

/* =========================
   RESET FORM
========================= */
function resetForm() {
  document.getElementById("subjectForm").reset();
}
