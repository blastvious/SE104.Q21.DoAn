import { DataTypes } from "sequelize";

const  Classmodel = (sequelize) =>{
    return sequelize.define("LOP", {
        MaLop: {
            type: DataTypes.STRING(10),
            allowNull: false,
            primaryKey: true,
        },
        TenLop: {
            type: DataTypes.STRING(15),
            allowNull: false,
        },
        MaKhoiLop: {
            type: DataTypes.STRING(10),
            allowNull: false,
            references: {
                model: 'KHOILOP',
                key: 'MaKhoiLop'
            }
        },
        TenNamHoc: {
            type: DataTypes.STRING(10),
            allowNull: false,
            references: {
                model: 'NAMHOC',
                key: 'TenNamHoc'
            }
        },
        SiSo: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }

    },{
        tableName: 'LOP',
        timestamps: false
    });
};

export default Classmodel;