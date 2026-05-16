const API = "http://localhost:5001/api/school";

export async function init() {
    await Promise.all([
        loadTotalStudents(),
        loadTotalSubjects(),
        loadPassRate(),
    ]);
    setupFeatureNav();
}

function setupFeatureNav() {
    document.getElementById("featureGrid").addEventListener("click", (e) => {
        const item = e.target.closest(".feature-item");
        if (!item) return;
        const page = item.dataset.page;
        if (!page) return;

        const menuItem = document.querySelector(`.submenu li[data-page="${page}"]`);
        if (!menuItem) return;

        const hasSub = menuItem.closest(".has-submenu");
        if (hasSub) hasSub.classList.add("open");

        menuItem.click();
    });
}

async function loadTotalStudents() {
    try {
        const res = await fetch(`${API}/student`);
        const data = await res.json();
        const count = Array.isArray(data) ? data.length : (data.data ? data.data.length : 0);
        document.getElementById("totalStudents").textContent = count.toLocaleString("vi-VN");
    } catch {
        document.getElementById("totalStudents").textContent = "--";
    }
}

async function loadTotalSubjects() {
    try {
        const res = await fetch(`${API}/subject`);
        const data = await res.json();
        const count = Array.isArray(data) ? data.length : (data.data ? data.data.length : 0);
        document.getElementById("totalSubjects").textContent = count;
    } catch {
        document.getElementById("totalSubjects").textContent = "--";
    }
}

async function loadPassRate() {
    try {
        const res = await fetch(`${API}/report-subjects`);
        const reports = await res.json();
        
        if (reports.length === 0) {
            document.getElementById("passRate").textContent = "--";
            return;
        }
        const latest = reports[0];
        const { TongSiSo, TongSoLuongDat } = latest;
        if (!TongSiSo || TongSiSo === 0) {
            document.getElementById("passRate").textContent = "--";
            return;
        }
        const tiLe = ((TongSoLuongDat / TongSiSo) * 100).toFixed(1);
        document.getElementById("passRate").textContent = `${tiLe}%`;
    } catch {
        document.getElementById("passRate").textContent = "--";
    }
}
