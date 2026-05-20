const mainContent = document.getElementById("main-content");
import { logout, getMe } from "../js/service/auth.service.js";
import { canAccessPage } from "./permission.js";

let currentUser = null; // 🔥 cache user

const routes = {
    "dashboard.html": () => import("./pages/dashboard.page.js"),
    "students.html": () => import("./pages/student.page.js"),
    "settings.html": () => import("./pages/settings.page.js"),
    "subjects.html": () => import("./pages/subjects.page.js"),
    "scores.html": () => import("./pages/scores.page.js"),
    "report-subjects.html": () => import("./pages/report-subjects.page.js"),
    "regulations.html": () => import("./pages/parameter.page.js"),
    "account.html": () => import("./pages/account.page.js"),
    "report-semester.html": () => import("./pages/report-semester.page.js"),
    "class-assignment.html": () => import("./pages/class-assignment.page.js"),
    "search.html": () => import("./pages/search.page.js")
};

// 🔥 Ẩn menu theo quyền
async function applyMenuPermission() {
    document.querySelectorAll("[data-page]").forEach(el => {
        const page = el.dataset.page;

        if (!canAccessPage(currentUser, page)) {
            el.style.display = "none";
        }
    });

    // 🔥 Ẩn luôn menu cha nếu tất cả con bị ẩn
    document.querySelectorAll(".has-submenu").forEach(parent => {
        const children = parent.querySelectorAll("[data-page]");
        const allHidden = [...children].every(c => c.style.display === "none");

        if (allHidden) {
            parent.style.display = "none";
        }
    });
}

// 🔥 load page có check quyền
async function loadPage(page) {
    try {
        // 🔥 check quyền
        if (!canAccessPage(currentUser, page)) {
            Toast.warning("Bạn không có quyền truy cập trang này!");

            if (currentUser.role === "User") {
                return loadPage("search.html");
            }

            return loadPage("dashboard.html");
        }

        const res = await fetch(`pages/${page}`);
        if (!res.ok) throw new Error("Không tìm thấy file HTML");

        const html = await res.text();
        mainContent.innerHTML = html;

        if (routes[page]) {
            const module = await routes[page]();
            if (module.init) {
                await module.init();
            }
        }

    } catch (err) {
        console.error("Lỗi router:", err);
        window.location.href = "login.html";
    }
}

function activateMenuItem(el) {
    document.querySelectorAll('.sidebar-menu li, .submenu li')
        .forEach(li => li.classList.remove('active'));

    if (el) el.classList.add('active');
}

document.getElementById("logoutBtn").addEventListener("click", logout);

document.addEventListener('click', function (e) {
    const menuParent = e.target.closest('.menu-parent');
    if (menuParent) {
        e.stopPropagation();
        const hasSub = menuParent.closest('.has-submenu');
        if (hasSub) {
            hasSub.classList.toggle('open');
        }
        return;
    }

    const subItem = e.target.closest('.submenu li[data-page]');
    if (subItem) {
        const page = subItem.dataset.page;
        if (page) {
            activateMenuItem(subItem);
            loadPage(page);
        }
        return;
    }

    const menuItem = e.target.closest('.sidebar-menu > li[data-page]');
    if (menuItem) {
        const page = menuItem.dataset.page;
        if (page) {
            activateMenuItem(menuItem);
            loadPage(page);
        }
        return;
    }
});

// 🔥 INIT APP (QUAN TRỌNG NHẤT)
(async () => {
    try {
        currentUser = await getMe(); // chỉ gọi 1 lần

        await applyMenuPermission(); // ẩn menu

        // 🔥 redirect theo role
        if (currentUser.role === "User") {
            await loadPage("search.html");
        } else {
            await loadPage("dashboard.html");
        }

    } catch (err) {
        console.error("Lỗi khởi tạo app:", err);
        window.location.href = "login.html";
    }
})();