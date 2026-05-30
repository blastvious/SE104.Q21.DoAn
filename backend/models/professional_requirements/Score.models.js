import { DataTypes } from "sequelize";

const Scoremodel = (sequelize) => {
    return sequelize.define("BANGDIEMMON",{
        MaBangDiemMon: {
            type: DataTypes.STRING(10),
            allowNull: false,
            primaryKey: true,
        },
        MaLop: {
            type: DataTypes.STRING(10),
            allowNull: false,
            references: {
                model: "LOP",
                key: "MaLop",
            }
        },
        MaMonHoc: {
            type: DataTypes.STRING(10),
            allowNull: false,
            references: {
                model: 'MONHOC',
                key: 'MaMonHoc'
            }
        },
        MaHocKy: {
            type: DataTypes.STRING(10),
            allowNull: false,
            references: {
                model: 'HOCKY',
                key: 'MaHocKy'
            }
        }
    }, {
        tableName: 'BANGDIEMMON',
        timestamps: false,
        indexes: [{
            unique: true,
            fields: ['MaLop', 'MaMonHoc', 'MaHocKy']
        }]
    }); 
};

export default Scoremodel;