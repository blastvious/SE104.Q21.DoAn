const mainContent = document.getElementById("main-content");

const routes = {
    
    "students.html": () => import("./pages/student.page.js"),
    
    "settings.html": () => import("./pages/settings.page.js"),
    
    // "dashboard.html": () => import("./pages/dashboard.page.js"), 
    "subjects.html": () => import("./pages/subjects.page.js"),
    "scores.html": () => import("./pages/scores.page.js"),
};

async function loadPage(page) {
    try {
        // Đường dẫn từ index.html đi vào thư mục pages/
        const res = await fetch(`pages/${page}`);
        if (!res.ok) throw new Error("Không tìm thấy file HTML");
        
        const html = await res.text();
        mainContent.innerHTML = html;

        if (routes[page]) {
            const module = await routes[page]();
            if (module.init) {
                await module.init();
                console.log(`Đã khởi tạo xong module cho: ${page}`);
            }
        }
    } catch (err) {
        console.error("Lỗi router:", err);
        mainContent.innerHTML = `<h2>Lỗi 404</h2><p>Trang không tồn tại hoặc lỗi đường dẫn script.</p>`;
    }
}

// Lắng nghe sự kiện click sidebar
document.querySelectorAll(".sidebar li").forEach(item => {
    item.addEventListener("click", () => {
        const page = item.dataset.page;
        if (page) loadPage(page);
    });
});

// Lấy tất cả các mục menu
const menuItems = document.querySelectorAll('.sidebar-menu li, .nav-links li');

menuItems.forEach(item => {
    item.addEventListener('click', function() {
        // 1. Xóa class 'active' khỏi tất cả các mục
        menuItems.forEach(el => el.classList.remove('active'));
        
        // 2. Thêm class 'active' vào mục vừa được click
        this.classList.add('active');

        // 3. Gọi hàm load trang của router (tùy theo logic router của bạn)
        const page = this.getAttribute('data-page');
        if (typeof loadPage === 'function') {
            loadPage(page); 
        }
    });
});

// Chạy trang mặc định
// Vì bạn chưa có dashboard.page.js, hãy tạm thời load students.html để test
loadPage("dashboard.html");