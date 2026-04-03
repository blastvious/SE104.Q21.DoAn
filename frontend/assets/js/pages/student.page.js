import { createStudent } from "../services/student.service.js";

export function initStudentsPage() {

    const form = document.getElementById("studentForm");

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const student = {
            name: document.getElementById("name").value,
            birth: document.getElementById("birth").value,
            gender: document.getElementById("gender").value
        };

        await createStudent(student);

        alert("Thêm thành công");
    });

}