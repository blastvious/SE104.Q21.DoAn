import { DataTypes } from "sequelize";

const Subjectmodel = (sequelize) => {
    return sequelize.define("MONHOC", {
        MaMonHoc: {
            type: DataTypes.STRING(10),
            allowNull:  false,
            primaryKey: true,
        },
        TenMonHoc: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        HeSo: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 1.0
        },
    }, {
        tableName: 'MONHOC',
        timestamps: false
    });
}

export default Subjectmodel;