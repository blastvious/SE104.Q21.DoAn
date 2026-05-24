export const roles = {
    Admin: {
        pages: ["*"],
        permissions: ["read", "write", "delete"]
    },
    Manager: {
        pages: [
            "dashboard.html",
            "students.html",
            "settings.html",
            "subjects.html",
            "scores.html",
            "report-subjects.html",
            "regulations.html",
            "report-semester.html",
            "class-assignment.html",
            "examtype.html",
            "search.html"
        ],
        permissions: ["read", "write"] // ❌ delete
    },
    User: {
        pages: ["search.html"],
        permissions: ["read"]
    }
};