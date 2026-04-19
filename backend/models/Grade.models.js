import { DataTypes } from "sequelize";

const Grademodel = (sequelize) => {
    return sequelize.define("KHOILOP", {
        MaKhoiLop: {
            type: DataTypes.STRING(10),
            allowNull: false,
            primaryKey: true,
        },
        TenKhoiLop: {
            type: DataTypes.STRING(10),
            allowNull: false
        }
    }, {
        tableName: 'KHOILOP',
        timestamps: false
    });
};

export default Grademodel;