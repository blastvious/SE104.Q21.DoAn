const API_URL = "http://localhost:5001/api/school/study-process";

/* =========================================
   GET UNASSIGNED STUDENTS (Lấy HS chưa xếp lớp)
   Endpoint: GET /study-process/unassigned
========================================= */
export const getUnassignedStudents = async (MaHocKy) => {
    if (!MaHocKy) throw new Error("Thiếu MaHocKy");

    try {
        const res = await fetch(
            `${API_URL}/unassigned?MaHocKy=${encodeURIComponent(MaHocKy)}`
        );
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Không tải được danh sách chưa xếp lớp");
        }
        return data;
    } catch (err) {
        console.error("getUnassignedStudents error:", err);
        throw err;
    }
};

/* =========================================
   GET ASSIGNED STUDENTS (Lấy HS đã xếp lớp)
   Endpoint: GET /study-process/assigned
========================================= */
export const getAssignedStudents = async (MaHocKy, MaLop = "") => {
    if (!MaHocKy) throw new Error("Thiếu MaHocKy");

    try {
        const query = new URLSearchParams({
            MaHocKy,
            ...(MaLop && { MaLop })
        });

        const res = await fetch(`${API_URL}/assigned?${query}`);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Không tải được danh sách đã xếp lớp");
        }
        return data;
    } catch (err) {
        console.error("getAssignedStudents error:", err);
        throw err;
    }
};

/* =========================================
   GET CLASS LIST (Lấy danh sách học sinh theo lớp)
   Endpoint: GET /study-process/class-list
========================================= */
export const getClassList = async (MaLop, MaHocKy) => {
    if (!MaLop || !MaHocKy) throw new Error("Thiếu MaLop hoặc MaHocKy");

    try {
        const query = new URLSearchParams({ MaLop, MaHocKy });
        const res = await fetch(`${API_URL}/class-list?${query}`);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Không tải được danh sách lớp học");
        }
        return data;
    } catch (err) {
        console.error("getClassList error:", err);
        throw err;
    }
};

/* =========================================
   ENROLL STUDENT (Xếp lớp đơn lẻ)
   Endpoint: POST /study-process/enroll
========================================= */
export const enrollStudent = async (payload) => {
    // payload: { MaHS, MaLop, MaHocKy }
    try {
        const res = await fetch(`${API_URL}/enroll`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Lỗi khi xếp lớp học sinh");
        }
        return data;
    } catch (err) {
        console.error("enrollStudent error:", err);
        throw err;
    }
};

/* =========================================
   ASSIGN BATCH (Xếp lớp hàng loạt)
   Endpoint: POST /study-process/assign-batch
========================================= */
export const assignStudentsBatch = async (payload) => {
    // payload: { students: [MaHS1, MaHS2,...], MaLop, MaHocKy }
    try {
        const res = await fetch(`${API_URL}/assign-batch`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Lỗi khi xếp lớp hàng loạt");
        }
        return data;
    } catch (err) {
        console.error("assignStudentsBatch error:", err);
        throw err;
    }
};

/* =========================================
   TRANSFER CLASS (Chuyển lớp học)
   Endpoint: PUT /study-process/transfer
========================================= */
export const transferClass = async (payload) => {
    // payload: { MaHS, MaHocKy, MaLopMoi }
    try {
        const res = await fetch(`${API_URL}/transfer`, {
            method: "PUT", // Đã sửa từ POST thành PUT theo chuẩn Router Backend
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Lỗi khi chuyển lớp học sinh");
        }
        return data;
    } catch (err) {
        console.error("transferClass error:", err);
        throw err;
    }
};

/* =========================================
   SEMESTER SUMMARY (Tính điểm TB & Tổng kết học kỳ)
   Endpoint: POST /study-process/summary
========================================= */
export const semesterSummary = async (payload) => {
    // payload: { MaLop, MaHocKy }
    try {
        const res = await fetch(`${API_URL}/summary`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Lỗi khi tổng kết điểm học kỳ");
        }
        return data;
    } catch (err) {
        console.error("semesterSummary error:", err);
        throw err;
    }
};