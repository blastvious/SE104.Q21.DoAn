import { DataTypes } from "sequelize";
const Usertmodel = (sequelize) => {
    

    return sequelize.define("PHANQUYEN", {
        Id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        Username: {
            type: DataTypes.STRING(50), 
            allowNull: false,
            unique: true 
        },
        Password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        RoleName: {
            type: DataTypes.STRING(20), 
            allowNull: false,
            defaultValue: 'User'
        }
    }, {
        freezeTableName: true,
        timestamps: false
    });
}

export default Usertmodel;