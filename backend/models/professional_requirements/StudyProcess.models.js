import { DataTypes, Model } from "sequelize";

const StudyProcessModel = (sequelize) => {
    return sequelize.define("QUATRINHHOC", {
        MaLop: {
            type: DataTypes.STRING(10),
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'LOP',
                key: 'MaLop',
            }
        },
        MaHS: {
            type: DataTypes.STRING(10),
            allowNull: false,
            primaryKey: true,
            references: {
                model: "HOCSINH",
                key: 'MaHS'
            },
        },
        MaHocKy: {
            type: DataTypes.STRING(10),
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'HOCKY',
                key: 'MaHocKy'
            },
        },
        DiemTBHocKy: {
            type: DataTypes.DECIMAL(4,2),
            allowNull: false,
            defaultValue: 0.0,
            validate: { min: 0, max: 10, isDecimal: true }
        }
    }, {
        tableName: 'QUATRINHHOC',
        timestamps: false
    });
};

export default StudyProcessModel;