import { DataTypes } from "sequelize";

const Semestermodel = (sequelize) =>{
    return sequelize.define("HOCKY",{
        MaHocKy:{
            type: DataTypes.STRING(10),
            allowNull: false,
            primaryKey: true,
        },
        TenHocKy: {
            type: DataTypes.STRING(20),
            allowNull: false,
        }
    },{
        tableName: 'HOCKY',
        timestamps: false
    });
};

export default Semestermodel;