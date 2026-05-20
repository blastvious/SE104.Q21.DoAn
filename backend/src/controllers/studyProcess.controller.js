import db from "../../libs/db.js"
import { Op } from "sequelize"

const throwHttp = (message, status) => {
    const err = new Error(message);
    err.statusCode = status;
    throw err;
};

const handleCatch = (res, error) => {
    if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Error from server" });
};

export const enrollStudent = async (req, res) => {
    try {
        const { MaHS, MaLop, MaHocKy } = req.body;

        const [student, semester] = await Promise.all([
            db.HOCSINH.findByPk(MaHS),
            db.HOCKY.findByPk(MaHocKy)
        ]);

        if (!student) return res.status(404).json({ message: "Student not found" });
        if (!semester) return res.status(404).json({ message: "Semester not found" });

        const enrollment = await db.sequelize.transaction(async (t) => {
            const classRecord = await db.LOP.findByPk(MaLop, { transaction: t, lock: t.LOCK.UPDATE });
            if (!classRecord) throwHttp("Class not found", 404);

            const enrolled = await db.QUATRINHHOC.findOne({ where: { MaHS, MaHocKy }, transaction: t, lock: t.LOCK.UPDATE });
            if (enrolled) {
                const sameClass = enrolled.MaLop === MaLop;
                throwHttp(
                    sameClass
                        ? "Student is already enrolled in this class for this semester"
                        : "Student is already enrolled in another class this semester",
                    sameClass ? 409 : 400
                );
            }

            const count = await db.QUATRINHHOC.count({ where: { MaLop }, transaction: t });

            await db.QUATRINHHOC.create({ MaHS, MaLop, MaHocKy, DiemTBHocKy: 0.00 }, { transaction: t });

            // cập nhật sĩ số thực tế
            await classRecord.update({ SiSo: count + 1 }, { transaction: t });
        });

        res.status(201).json({ message: "Enroll success" });
    } catch (error) {
        handleCatch(res, error);
    }
};

export const getClassList = async (req, res) => {
    try {
        const { MaLop, MaHocKy } = req.query;

        const list = await db.QUATRINHHOC.findAll({
            where: { MaLop, MaHocKy },
            include: [{ model: db.HOCSINH, attributes: ['MaHS', 'HoTen', 'GioiTinh', 'NgaySinh', 'DiaChi', 'Email', 'SoDienThoai'] }],
            order: [[db.sequelize.col('HOCSINH.MaHS'), 'ASC']]
        });

        res.json(list);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error from server" });
    }
};

export const transferClass = async (req, res) => {
    try {
        const { MaHS, MaHocKy, MaLopMoi } = req.body;

        const semester = await db.HOCKY.findByPk(MaHocKy);
        if (!semester) return res.status(404).json({ message: "Semester not found" });

        const updated = await db.sequelize.transaction(async (t) => {
            const current = await db.QUATRINHHOC.findOne({
                where: { MaHS, MaHocKy }, transaction: t, lock: t.LOCK.UPDATE
            });
            if (!current) throwHttp("Enrollment not found for this student and semester", 404);
            if (current.MaLop === MaLopMoi) throwHttp("Student is already in this class", 400);

            const newClass = await db.LOP.findByPk(MaLopMoi, { transaction: t, lock: t.LOCK.UPDATE });
            if (!newClass) throwHttp("New class not found", 404);

            const count = await db.QUATRINHHOC.count({ where: { MaLop: MaLopMoi }, transaction: t });

            const existing = await db.QUATRINHHOC.findOne({
                where: { MaHS, MaHocKy, MaLop: MaLopMoi }, transaction: t
            });
            if (existing) throwHttp("Student already has an enrollment record in the target class for this semester", 409);

            const { DiemTBHocKy } = current;

            // sĩ số lớp cũ trước khi xoá
            const oldClass = await db.LOP.findByPk(current.MaLop, { transaction: t, lock: t.LOCK.UPDATE });
            const oldCount = await db.QUATRINHHOC.count({ where: { MaLop: current.MaLop }, transaction: t });

            await db.QUATRINHHOC.destroy({ where: { MaHS, MaHocKy, MaLop: current.MaLop }, transaction: t });
            await oldClass.update({ SiSo: oldCount - 1 }, { transaction: t });

            await db.QUATRINHHOC.create({ MaHS, MaHocKy, MaLop: MaLopMoi, DiemTBHocKy }, { transaction: t });
            await newClass.update({ SiSo: count + 1 }, { transaction: t });
        });

        res.json({ message: "Transfer successful" });
    } catch (error) {
        handleCatch(res, error);
    }
};

export const semesterSummary = async (req, res) => {
    try {
        const { MaLop, MaHocKy } = req.body;

        const [records, bangDiemMonList] = await Promise.all([
            db.QUATRINHHOC.findAll({ where: { MaLop, MaHocKy } }),
            db.BANGDIEMMON.findAll({
                where: { MaLop, MaHocKy },
                include: [{ model: db.MONHOC, attributes: ['MaMonHoc', 'HeSo'] }]
            })
        ]);

        if (!records.length) throwHttp("No students found for this class and semester", 404);
        if (!bangDiemMonList.length) throwHttp("No score sheets found for this class and semester", 404);

        const maHSList = records.map(r => r.MaHS);
        const maBangDiemMonList = bangDiemMonList.map(b => b.MaBangDiemMon);

        const allScores = await db.CT_BANGDIEMMON_HS.findAll({
            where: { MaBangDiemMon: { [Op.in]: maBangDiemMonList }, MaHS: { [Op.in]: maHSList } }
        });

        const scoreMap = new Map(allScores.map(s => [`${s.MaBangDiemMon}_${s.MaHS}`, s]));
        const heSoMap = new Map(bangDiemMonList.map(b => [b.MaBangDiemMon, b.MONHOC.HeSo ?? 1]));

        const results = records.map(record => {
            let totalScore = 0;
            let totalWeight = 0;

            for (const bdm of bangDiemMonList) {
                const score = scoreMap.get(`${bdm.MaBangDiemMon}_${record.MaHS}`);
                if (score?.DiemTBMon != null) {
                    const weight = heSoMap.get(bdm.MaBangDiemMon);
                    totalScore += parseFloat(score.DiemTBMon) * weight;
                    totalWeight += weight;
                }
            }

            const diemTB = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0.00;
            return { MaHS: record.MaHS, MaLop, MaHocKy, DiemTBHocKy: diemTB };
        });

        await db.sequelize.transaction(async (t) => {
            await Promise.all(
                results.map(r =>
                    db.QUATRINHHOC.update(
                        { DiemTBHocKy: r.DiemTBHocKy },
                        { where: { MaHS: r.MaHS, MaLop, MaHocKy }, transaction: t }
                    )
                )
            );
        });

        res.json({ message: "Semester summary completed", data: results });
    } catch (error) {
        handleCatch(res, error);
    }
};

export const assignStudentsBatch = async (req, res) => {
    try {
        const { students, MaLop, MaHocKy } = req.body;

        if (!students || students.length === 0) {
            throwHttp("No students selected", 400);
        }

        const result = await db.sequelize.transaction(async (t) => {
            const classRecord = await db.LOP.findByPk(MaLop, { transaction: t, lock: t.LOCK.UPDATE });
            if (!classRecord) throwHttp("Class not found", 404);

            // kiểm tra sĩ số
            const currentCount = await db.QUATRINHHOC.count({
                where: { MaLop, MaHocKy },
                transaction: t
            });

            // check đã tồn tại
            const existed = await db.QUATRINHHOC.findAll({
                where: {
                    MaHS: { [Op.in]: students },
                    MaHocKy
                },
                transaction: t
            });

            if (existed.length > 0) {
                throwHttp("Some students already assigned", 409);
            }

            // insert hàng loạt
            const data = students.map(MaHS => ({
                MaHS,
                MaLop,
                MaHocKy,
                DiemTBHocKy: 0.00
            }));

            await db.QUATRINHHOC.bulkCreate(data, { transaction: t });

            // cập nhật sĩ số thực tế
            await classRecord.update({ SiSo: currentCount + students.length }, { transaction: t });
        });

        res.json({ message: "Assign success" });

    } catch (error) {
        handleCatch(res, error);
    }
};

export const getUnassignedStudents = async (req, res) => {
    try {
        const { MaHocKy } = req.query;

        const list = await db.HOCSINH.findAll({
            where: {
                MaHS: {
                    [Op.notIn]: db.sequelize.literal(`(
                        SELECT MaHS FROM QUATRINHHOC WHERE MaHocKy = '${MaHocKy}'
                    )`)
                }
            },
            order: [['MaHS', 'ASC']]
        });

        res.json(list);
    } catch (error) {
        handleCatch(res, error);
    }
};

export const getAssignedStudents = async (req, res) => {
    try {
        const { MaHocKy, MaLop } = req.query;

        if (!MaHocKy) {
            return res.status(400).json({
                message: "MaHocKy is required"
            });
        }

        const list = await db.QUATRINHHOC.findAll({
            where: {
                MaHocKy,
                ...(MaLop ? { MaLop } : {})
            },
            include: [{
                model: db.HOCSINH,
                attributes: ['MaHS', 'HoTen', 'GioiTinh']
            }]
        });

        res.json(list);

    } catch (error) {
        handleCatch(res, error);
    }
};