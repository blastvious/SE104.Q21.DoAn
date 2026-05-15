const mainContent = document.getElementById("main-content");
import { logout } from "../js/service/auth.service.js";

const routes = {
    "students.html": () => import("./pages/student.page.js"),
    "settings.html": () => import("./pages/settings.page.js"),
    "subjects.html": () => import("./pages/subjects.page.js"),
    "scores.html": () => import("./pages/scores.page.js"),
    "report-subjects.html": () => import("./pages/report-subjects.page.js"),
};

async function loadPage(page) {
    try {
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
        mainContent.innerHTML = `<h2>Đang phát triển</h2><p>Tính năng này hiện chưa hoàn thiện.</p>`;
    }
}

function activateMenuItem(el) {
    document.querySelectorAll('.sidebar-menu li, .submenu li').forEach(li => li.classList.remove('active'));
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

loadPage("dashboard.html");
