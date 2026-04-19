import { createStudent } from "../services/student.service.js";

export function initStudentsPage() {

    const form = document.getElementById("studentForm");

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const student = {
            
        };

        await createStudent(student);

        alert("Thêm thành công");
    });

}