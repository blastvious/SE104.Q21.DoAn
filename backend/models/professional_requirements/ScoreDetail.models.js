import { DataTypes } from "sequelize";

const ScoreDetailmodel = (sequelize) => {
    return sequelize.define("CT_BANGDIEMMON_HS", {
        MaCTBDMHS: {
            type: DataTypes.STRING(10),
            allowNull: false,
            primaryKey: true,
        },
        MaBangDiemMon: {
            type: DataTypes.STRING(10),
            allowNull: false,
            references: {
                model: "BANGDIEMMON",
                key: "MaBangDiemMon"
            }
        },
        MaHS:{
            type: DataTypes.STRING(10),
            allowNull: false,
            references: {
                model: 'HOCSINH',
                key: 'MaHS'
            }
        },
        DiemTBMon: {
            type: DataTypes.DECIMAL(4,2),
            allowNull: false,
            defaultValue: 0.0,
            validate: { min: 0, max: 10, isDecimal: true }
        }
    }, {
        tableName: 'CT_BANGDIEMMON_HS',
        timestamps: false
    });
}

export default ScoreDetailmodel;