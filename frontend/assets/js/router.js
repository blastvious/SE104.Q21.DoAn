const mainContent = document.getElementById("main-content");

const routes = {
    
    "students.html": () => import("./pages/student.page.js"),
    
    
    // "dashboard.html": () => import("./pages/dashboard.page.js"), 
    "subjects.html": () => import("./pages/subjects.page.js"),
    "scores.html": () => import("./pages/scores.page.js")
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

// Chạy trang mặc định
// Vì bạn chưa có dashboard.page.js, hãy tạm thời load students.html để test
loadPage("students.html");