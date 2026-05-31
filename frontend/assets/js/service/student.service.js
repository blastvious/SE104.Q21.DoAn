const API_URL = "http://localhost:5001/api/school/student";

/* =========================================
   GET ALL STUDENTS
========================================= */
export const getAllStudents = async (
    keyword = ""
) => {

    try {

        const response = await fetch(
            `${API_URL}?keyword=${encodeURIComponent(keyword)}`
        );

        if (!response.ok) {

            throw new Error(
                "Không thể tải danh sách học sinh"
            );

        }

        return await response.json();

    } catch (error) {

        console.error(
            "getAllStudents error:",
            error
        );

        throw error;

    }

};

/* =========================================
   GET STUDENT BY ID
========================================= */
export const getStudentById = async (
    id
) => {

    try {

        const response = await fetch(
            `${API_URL}/${id}`
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Không tìm thấy học sinh"
            );

        }

        return data;

    } catch (error) {

        console.error(
            "getStudentById error:",
            error
        );

        throw error;

    }

};

/* =========================================
   CREATE STUDENT
========================================= */
export const createStudent = async (
    studentData
) => {

    try {

        const response = await fetch(
            API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(
                    studentData
                )
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            let msg = data.message || "Lỗi khi thêm học sinh";
            if (data.details && data.details.length) {
                msg += "\n" + data.details.join("\n");
            }
            throw new Error(msg);
        }

        return data;

    } catch (error) {

        console.error(
            "createStudent error:",
            error
        );

        throw error;

    }

};

/* =========================================
   UPDATE STUDENT
========================================= */
export const updateStudent = async (
    id,
    studentData
) => {

    try {

        const response = await fetch(
            `${API_URL}/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(
                    studentData
                )
            }
        );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Lỗi khi cập nhật học sinh"
            );

        }

        return data;

    } catch (error) {

        console.error(
            "updateStudent error:",
            error
        );

        throw error;

    }

};

/* =========================================
   DELETE STUDENT
========================================= */
export const deleteStudent = async (
    id
) => {

    try {

        const response = await fetch(
            `${API_URL}/${id}`,
            {
                method: "DELETE"
            }
        );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Lỗi khi xóa học sinh"
            );

        }

        return data;

    } catch (error) {

        console.error(
            "deleteStudent error:",
            error
        );

        throw error;

    }

};

/* =========================================
   BULK CREATE STUDENTS
========================================= */
export const bulkCreateStudents =
    async (dataArray) => {

        try {

            const response =
                await fetch(
                    `${API_URL}/bulk`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify(
                            dataArray
                        )
                    }
                );

            const result =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Dữ liệu file Excel không hợp lệ!"
                );

            }

            return result;

        } catch (error) {

            console.error(
                "bulkCreateStudents error:",
                error
            );

            throw error;

        }

    };