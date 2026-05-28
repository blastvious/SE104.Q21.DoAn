import { DataTypes } from "sequelize";

const Yearmodel = (sequelize) =>{
    return sequelize.define("NAMHOC", {
        TenNamHoc: {
            type: DataTypes.STRING(10),
            allowNull: false,
            primaryKey: true,
        },
        NgayBatDau: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        NgayKetThuc: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        DaKetThuc: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
    }, {
        tableName: 'NAMHOC',
        timestamps: false
    });
};

export default Yearmodel;