import db from "../../libs/db.js"
import { Op } from "sequelize"

// Thứ tự nên có là Nam học, học kỳ, khối lớp rồi mới đến lớp nha.

const parseDateOnly = (dateValue) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return null;
    }

    const [year, month, day] = dateValue.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return date;
}

const normalizeText = (value) => {
    return typeof value === "string" ? value.trim() : "";
}

// Năm học
export const createYear = async (req, res) => {
    try {
        const {
            TenNamHoc,
            NgayBatDau,
            NgayKetThuc
        } = req.body;

        if (!TenNamHoc || !NgayBatDau || !NgayKetThuc) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const yearMatch = TenNamHoc.match(/^(\d{4})-(\d{4})$/);

        if (!yearMatch) {
            return res.status(400).json({ message: "School year must use format YYYY-YYYY" });
        }

        const schoolStartYear = Number(yearMatch[1]);
        const schoolEndYear = Number(yearMatch[2]);

        if (schoolEndYear !== schoolStartYear + 1) {
            return res.status(400).json({ message: "School year must be consecutive years" });
        }

        const startDate = parseDateOnly(NgayBatDau);
        const endDate = parseDateOnly(NgayKetThuc);

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        if (startDate >= endDate) {
            return res.status(400).json({ message: "Start date must be before end date" });
        }

        if (
            startDate.getUTCFullYear() !== schoolStartYear ||
            endDate.getUTCFullYear() !== schoolEndYear
        ) {
            return res.status(400).json({ message: "Date range must match school year" });
        }

        const existingYear = await db.NAMHOC.findByPk(TenNamHoc);

        if (existingYear) {
            return res.status(409).json({ message: "Year already exists" });
        }

        const newYear = await db.NAMHOC.create({
            TenNamHoc,
            NgayBatDau,
            NgayKetThuc
        });

        res.status(201).json(newYear);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}

export const getAllYear = async (req, res) => {
    try {
        const year = await db.NAMHOC.findAll();
        res.json(year);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}

// Học Kỳ 
export const createSemester = async (req, res) => {
    try {
        const {
                    TenHocKy
                } = req.body;
        
                // ============== check trùng tên học kỳ ===============
                const existing = await db.HOCKY.findOne({
                    where: { TenHocKy }
                });
        
                if (existing) {
                    return res.status(400).json({
                        status: "Error",
                        message: "Học kỳ đã tồn tại"
                    });
                }
        
                // ============= tạo MaHocKy ==========================
                const lastSemester = await db.HOCKY.findOne({
                    where: {
                        MaHocKy: {[Op.like]: 'HK%'}
                    },
                    order: [["MaHocKy", "DESC"]]
                });
        
                let stt = 1;
                if(lastSemester){
                    const lastNumber = parseInt(lastSemester.MaHocKy.slice(2))
                    stt = lastNumber + 1
                }
        
                const MaHocKy = `HK${String(stt).padStart(3, '0')}`;
                const newSemester = await db.HOCKY.create({
                    MaHocKy,
                    TenHocKy
                });
                res.status(201).json(newSemester);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}

export const getAllSemester = async (req, res) => {
    try {
        const semester = await db.HOCKY.findAll();
        res.json(semester);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}

// Khối Lớp
export const createGrade = async (req, res) => {
    try {
        // Todo: từ db gọi đến KHOILOP và tạo các khối lớp.
        // Đọc từ req.body
        // Kiểm tra xem khối lớp đã tồn tại chưa
        // Tạo đối tượng 
        // Thêm vào database

        const {
            TenKhoiLop,
        } = req.body;

        if (!TenKhoiLop) {
            return res.status(400).json({message: "Missing required fields"});
        }    

        const existingGrade = await db.KHOILOP.findOne({
            where: {
                TenKhoiLop,
            }
        });

        if (existingGrade) {
            return res.status(409).json({message: "Grade already exists"});
        }

        const newGrade = await db.sequelize.transaction(async (t) => {
            const lastGrade = await db.KHOILOP.findOne({
                order: [["MaKhoiLop", "DESC"]],
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            let stt = 1;
            if (lastGrade) {
                const lastNumber = parseInt(lastGrade.MaKhoiLop.replace(/\D/g, ''));
                stt = lastNumber + 1;
            }

            const MaKhoiLop = `KL${String(stt).padStart(2, '0')}`;
            return await db.KHOILOP.create({
                MaKhoiLop,
                TenKhoiLop
            }, { transaction: t });
        });

        res.status(201).json(newGrade);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}

export const getAllGrade = async (req, res) => {
    try {
        const grade = await db.KHOILOP.findAll();
        res.json(grade);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}


// Lớp
export const createClass = async (req, res) => {
    try {
        // Todo: từ db gọi đến LOP và tạo các  lớp.

        // Đọc từ req.body
        const {
            TenLop,
            MaKhoiLop,
            TenNamHoc,
            SiSo
        } = req.body;

        const className = normalizeText(TenLop);
        const gradeId = normalizeText(MaKhoiLop);
        const schoolYear = normalizeText(TenNamHoc);

        if (!className || !gradeId || !schoolYear) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (className.length > 15) {
            return res.status(400).json({ message: "Class name must not exceed 15 characters" });
        }

        if (gradeId.length > 10) {
            return res.status(400).json({ message: "Grade id must not exceed 10 characters" });
        }

        if (schoolYear.length > 10) {
            return res.status(400).json({ message: "School year must not exceed 10 characters" });
        }

        const yearMatch = schoolYear.match(/^(\d{4})-(\d{4})$/);

        if (!yearMatch) {
            return res.status(400).json({ message: "School year must use format YYYY-YYYY" });
        }

        const parsedSiSo = SiSo === undefined ? 0 : Number(SiSo);

        if (!Number.isInteger(parsedSiSo) || parsedSiSo < 0) {
            return res.status(400).json({ message: "Invalid SiSo" });
        }

        const newClass = await db.sequelize.transaction(async (t) => {
            const existingYear = await db.NAMHOC.findByPk(schoolYear, { transaction: t, lock: t.LOCK.UPDATE });

            if (!existingYear) {
                const error = new Error("School year not found");
                error.statusCode = 404;
                throw error;
            }

            const grade = await db.KHOILOP.findByPk(gradeId, { transaction: t, lock: t.LOCK.UPDATE });

            if (!grade) {
                const error = new Error("Grade not found");
                error.statusCode = 404;
                throw error;
            }

            const duplicateClass = await db.LOP.findOne({
                where: {
                    TenLop: className,
                    MaKhoiLop: gradeId,
                    TenNamHoc: schoolYear
                },
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (duplicateClass) {
                const error = new Error("Class already exists for this grade and school year");
                error.statusCode = 409;
                throw error;
            }

            const khoiDigits = String(grade.MaKhoiLop).replace(/\D/g, "");
            const khoiCode = `K${khoiDigits.padStart(2, "0")}`;
            const [, startYear, endYear] = yearMatch;
            const yearCode = startYear.slice(2) + endYear.slice(2);

            const lastClass = await db.LOP.findOne({
                where: {
                    MaKhoiLop: gradeId,
                    TenNamHoc: schoolYear
                },
                order: [["MaLop", "DESC"]],
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            const nextSequence = lastClass ? Number(lastClass.MaLop.slice(-3)) + 1 : 1;
            const MaLop = `${yearCode}${khoiCode}${String(nextSequence).padStart(3, "0")}`;

            const existingByCode = await db.LOP.findByPk(MaLop, { transaction: t, lock: t.LOCK.UPDATE });

            if (existingByCode) {
                const error = new Error("Class code already exists");
                error.statusCode = 409;
                throw error;
            }

            return await db.LOP.create({
                MaLop,
                TenLop: className,
                MaKhoiLop: gradeId,
                TenNamHoc: schoolYear,
                SiSo: parsedSiSo
            }, { transaction: t });
        });

        res.status(201).json(newClass);
    } catch (error) {
        if (error?.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}

export const getAllClass = async (req, res) => {
    try {
        const classes = await db.LOP.findAll();
        res.json(classes);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error from server" });
    }
}
