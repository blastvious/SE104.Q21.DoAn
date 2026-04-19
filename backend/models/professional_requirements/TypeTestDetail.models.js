import { DataTypes } from "sequelize";

const TypeTestDetailmodels = (sequelize) =>{
    return sequelize.define("CT_BANGDIEMMON_LHKT", {
        MaCTBDMHS: {
            type: DataTypes.STRING(10),
            allowNull: false,
            primaryKey: true,
            references: {
                model: "CT_BANGDIEMMON_HS",
                key: "MaCTBDMHS",
            }
        },
        MaLoaiHinhKT: {
            type: DataTypes.STRING(15),
            allowNull: false,
            primaryKey: true,
            references: {
                model: "LOAIHINHKT",
                key: "MaLoaiHinhKT"
            }
        },
        Lan: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            defaultValue: 1
        },
        Diem: {
            type: DataTypes.DECIMAL(4,2),
            allowNull: false,
            defaultValue: 0.0,
            validate: { min: 0, max: 10, isDecimal: true }
        },
        
    }, {
        tableName: 'CT_BANGDIEMMON_LHKT',
        timestamps: false,
    });
};

export default  TypeTestDetailmodels