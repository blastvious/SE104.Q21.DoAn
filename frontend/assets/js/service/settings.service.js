const API_URL = "http://localhost:5001/api/school";

export const settingsService = {
    // Năm học
    async fetchYears() {
        const res = await fetch(`${API_URL}/year`);
        return await res.json();
    },
    async createYear(data) {
        const res = await fetch(`${API_URL}/year`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    // Học kỳ
    async fetchSemesters() {
        const res = await fetch(`${API_URL}/semester`);
        return await res.json();
    },
    async createSemester(TenHocKy) {
        const res = await fetch(`${API_URL}/semester`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ TenHocKy })
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    // Khối lớp
    async fetchGrades() {
        const res = await fetch(`${API_URL}/grades`);
        return await res.json();
    },
    async createGrade(TenKhoiLop) {
        const res = await fetch(`${API_URL}/grades`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ TenKhoiLop })
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    // Lớp học
    async fetchClasses() {
        const res = await fetch(`${API_URL}/class`);
        return await res.json();
    },
    async createClass(data) {
        const res = await fetch(`${API_URL}/class`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    }
};