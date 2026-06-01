import { DataTypes } from "sequelize";

const TypeofTestmodel = (sequelize) => {
    return sequelize.define("LOAIHINHKT", {
        MaLoaiHinhKT: {
            type: DataTypes.STRING(15),
            allowNull: false,
            primaryKey: true,
        },
        TenLoaiHinhKT:{
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        HeSo: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        }
    },{
        tableName: 'LOAIHINHKT',
        timestamps: false,
    });
};

export default TypeofTestmodel;