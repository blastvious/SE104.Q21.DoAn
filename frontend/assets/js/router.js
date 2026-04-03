const mainContent = document.getElementById("main-content");

const routes = {
    "dashboard.html": () => import("./pages/dashboard.page.js"),
    "students.html": () => import("./pages/students.page.js"),
    "subjects.html": () => import("./pages/subjects.page.js"),
    "scores.html": () => import("./pages/scores.page.js")
};

async function loadPage(page)
{
    const res = await fetch(`pages/${page}`);
    const html = await res.text();

    mainContent.innerHTML = html;

    if (routes[page])
    {
        const module = await routes[page]();
        module.init();
    }
}

document.querySelectorAll(".sidebar li").forEach(item =>
{
    item.addEventListener("click", () =>
    {
        const page = item.dataset.page;
        loadPage(page);
    });
});

loadPage("dashboard.html");