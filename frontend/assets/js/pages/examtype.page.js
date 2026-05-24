import {
  getAllExamTypes,
  createExamType,
  updateExamType,
  deleteExamType,
} from "../service/examtype.service.js";

let editingId = null;
let isSubmitting = false;

export async function init() {
  setupModal();
  setupForm();
  setupSearch();
  setupTableActions();
  await loadExamTypes();
}

async function loadExamTypes(keyword = "") {
  try {
    const types = await getAllExamTypes(keyword);
    const tbody = document.getElementById("examtypeTableBody");
    tbody.innerHTML = "";

    updateStats(types);

    if (types.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-table">Không có loại hình kiểm tra nào</td>
        </tr>`;
      return;
    }

    types.forEach((t) => {
      tbody.innerHTML += `
        <tr>
          <td>${t.MaLoaiHinhKT}</td>
          <td>${t.TenLoaiHinhKT}</td>
          <td>
            <span class="examtype-badge hs${Number(t.HeSo)}">Hệ số ${t.HeSo}</span>
          </td>
          <td>
            <div class="action-group">
              <button class="action-btn edit"
                data-id="${t.MaLoaiHinhKT}"
                data-name="${t.TenLoaiHinhKT}"
                data-heso="${t.HeSo}">
                <i class="fas fa-pen"></i>
              </button>
              <button class="action-btn delete" data-id="${t.MaLoaiHinhKT}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>`;
    });
  } catch (error) {
    console.error(error);
    Toast.error("Không thể tải danh sách loại hình kiểm tra");
  }
}

function updateStats(types) {
  document.getElementById("totalExamTypes").textContent = types.length;
  if (types.length > 0) {
    const highest = [...types].sort((a, b) => b.HeSo - a.HeSo)[0];
    document.getElementById("highestHeSo").textContent = `Hệ số ${highest.HeSo}`;
  } else {
    document.getElementById("highestHeSo").textContent = "--";
  }
}

function setupModal() {
  const modal = document.getElementById("examTypeModal");

  document.addEventListener("click", function (e) {
    if (e.target.id === "openExamTypeModal") {
      editingId = null;
      document.getElementById("examTypeForm").reset();
      document.getElementById("examTypeModalTitle").textContent = "Thêm Loại Hình Kiểm Tra";
      modal.style.display = "block";
    }
    if (e.target.id === "closeExamTypeModal" || e.target.id === "cancelExamTypeBtn") {
      modal.style.display = "none";
    }
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

function setupForm() {
  const form = document.getElementById("examTypeForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;

    try {
      const TenLoaiHinhKT = document.getElementById("examTypeName").value.trim();
      const HeSo = document.getElementById("examTypeHeSo").value;

      if (editingId) {
        await updateExamType(editingId, { TenLoaiHinhKT, HeSo });
        Toast.success("Cập nhật loại hình kiểm tra thành công");
      } else {
        await createExamType({ TenLoaiHinhKT, HeSo });
        Toast.success("Thêm loại hình kiểm tra thành công");
      }

      form.reset();
      editingId = null;
      document.getElementById("examTypeModal").style.display = "none";
      await loadExamTypes();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      isSubmitting = false;
    }
  });
}

function setupTableActions() {
  const tbody = document.getElementById("examtypeTableBody");

  tbody.addEventListener("click", async function (e) {
    const editBtn = e.target.closest(".action-btn.edit");
    if (editBtn) {
      editingId = editBtn.dataset.id;
      document.getElementById("examTypeName").value = editBtn.dataset.name;
      document.getElementById("examTypeHeSo").value = editBtn.dataset.heso;
      document.getElementById("examTypeModalTitle").textContent = "Cập Nhật Loại Hình Kiểm Tra";
      document.getElementById("examTypeModal").style.display = "block";
      return;
    }

    const deleteBtn = e.target.closest(".action-btn.delete");
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (!confirm("Bạn có chắc muốn xóa loại hình kiểm tra này?")) return;
      try {
        await deleteExamType(id);
        Toast.success("Xóa loại hình kiểm tra thành công");
        await loadExamTypes();
      } catch (error) {
        Toast.error(error.message);
      }
    }
  });
}

function setupSearch() {
  const input = document.getElementById("examtypeSearchInput");
  input.addEventListener("input", async function () {
    await loadExamTypes(this.value.trim());
  });
}
