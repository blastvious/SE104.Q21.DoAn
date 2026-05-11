const API_URL = "http://localhost:5001/api/school";

/* =========================
   GET ALL SUBJECTS
========================= */
export async function getAllSubjects(keyword = "") {

    try {

        let url = `${API_URL}/subject`;

        if(keyword){

            url += `?keyword=${encodeURIComponent(keyword)}`;

        }

        const response = await fetch(url);

        if (!response.ok) {

            throw new Error(
                "Không thể tải danh sách môn học"
            );

        }

        return await response.json();

    } catch (error) {

        console.error(
            "getAllSubjects error:",
            error
        );

        throw error;

    }

}

/* =========================
   GET SUBJECT BY ID
========================= */
export async function getSubjectById(id) {

    try {

        const response = await fetch(
            `${API_URL}/subject/${id}`
        );

        const data = await response.json();

        if(!response.ok){

            throw new Error(
                data.message ||
                "Không tìm thấy môn học"
            );

        }

        return data;

    } catch(error){

        console.error(
            "getSubjectById error:",
            error
        );

        throw error;

    }

}

/* =========================
   CREATE SUBJECT
========================= */
export async function createSubject(subjectData) {

    try {

        const response = await fetch(
            `${API_URL}/subject`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify(
                    subjectData
                ),
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Không thể thêm môn học"
            );

        }

        return data;

    } catch (error) {

        console.error(
            "createSubject error:",
            error
        );

        throw error;

    }

}

/* =========================
   UPDATE SUBJECT
========================= */
export async function updateSubject(
    id,
    subjectData
) {

    try {

        const response = await fetch(
            `${API_URL}/subject/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify(
                    subjectData
                ),
            }
        );

        const data = await response.json();

        if(!response.ok){

            throw new Error(
                data.message ||
                "Không thể cập nhật môn học"
            );

        }

        return data;

    } catch(error){

        console.error(
            "updateSubject error:",
            error
        );

        throw error;

    }

}

/* =========================
   DELETE SUBJECT
========================= */
export async function deleteSubject(id) {

    try {

        const response = await fetch(
            `${API_URL}/subject/${id}`,
            {
                method: "DELETE",
            }
        );

        const data = await response.json();

        if(!response.ok){

            throw new Error(
                data.message ||
                "Không thể xóa môn học"
            );

        }

        return data;

    } catch(error){

        console.error(
            "deleteSubject error:",
            error
        );

        throw error;

    }

}