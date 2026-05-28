import db from "../../libs/db.js";
import { Op } from "sequelize";
//bảng THAMSO 

const isSchoolYearActive = async () => {
    const today = new Date().toISOString().split('T')[0];
    const [years] = await db.sequelize.query(`
        SELECT COUNT(*) AS cnt FROM NAMHOC
        WHERE NgayBatDau <= :today
          AND NgayKetThuc >= :today
          AND (DaKetThuc IS NULL OR DaKetThuc = 0)
    `, { replacements: { today } });
    return parseInt(years[0]?.cnt) > 0;
};

export const createParameter = async (req, res) => {
    try {
        const { TenThamSo, GiaTri } = req.body;

        // check trùng
        const [existing] = await db.sequelize.query(
            `
            SELECT * 
            FROM THAMSO
            WHERE TenThamSo = :TenThamSo
            `,
            {
                replacements: { TenThamSo },
            }
        );

        if (existing.length > 0) {
            return res.status(400).json({
                message: "Tham số đã tồn tại",
            });
        }

        await db.sequelize.query(
            `
            INSERT INTO THAMSO (TenThamSo, GiaTri)
            VALUES (:TenThamSo, :GiaTri)
            `,
            {
                replacements: {
                    TenThamSo,
                    GiaTri,
                },
            }
        );

        res.status(201).json({
            message: "Tạo tham số thành công",
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Error from server",
        });
    }
};

//Xem tham số
export const getAllParameters = async (req, res) => {
    try {
        const { keyword } = req.query;

        let sql = `
            SELECT *
            FROM THAMSO
        `;

        const replacements = {};

        if (keyword) {
            sql += `
                WHERE TenThamSo LIKE :keyword
            `;

            replacements.keyword = `%${keyword}%`;
        }

        sql += `
            ORDER BY TenThamSo ASC
        `;

        const [parameters] = await db.sequelize.query(sql, {
            replacements,
        });

        res.json(parameters);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Error from server",
        });
    }
};

export const getParameterByName = async (req, res) => {
    try {
        const { name } = req.params;

        const [parameter] = await db.sequelize.query(
            `
            SELECT *
            FROM THAMSO
            WHERE TenThamSo = :name
            `,
            {
                replacements: { name },
            }
        );

        if (parameter.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy tham số",
            });
        }

        res.json(parameter[0]);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Error from server",
        });
    }
};


//===========Sua
export const updateParameter = async (req, res) => {
    try {
        if (await isSchoolYearActive()) {
            return res.status(403).json({
                message: "Không thể sửa quy định trong năm học đang diễn ra"
            });
        }

        const { name } = req.params;
        const { TenThamSo, GiaTri } = req.body;

        await db.sequelize.query(
            `
            UPDATE THAMSO
            SET TenThamSo = :TenThamSo,
                GiaTri = :GiaTri
            WHERE TenThamSo = :name
            `,
            {
                replacements: {
                    name,
                    TenThamSo,
                    GiaTri,
                },
            }
        );

        res.json({
            message: "Cập nhật thành công",
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Error from server",
        });
    }
};

//========= Xoa
export const deleteParameter = async (req, res) => {
    try {
        const { name } = req.params;

        await db.sequelize.query(
            `
            DELETE FROM THAMSO
            WHERE TenThamSo = :name
            `,
            {
                replacements: { name },
            }
        );

        res.json({
            message: "Xóa thành công",
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Error from server",
        });
    }
};