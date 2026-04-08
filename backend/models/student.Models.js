
import { DataTypes } from "sequelize";
const Studentmodel = (sequelize) => {

     
     return sequelize.define("STUDENT", {
          Id: {
               type: DataTypes.INTEGER,
               allowNull: false,
               primaryKey: true,
               autoIncrement: true
          },
          Name: {
               type: DataTypes.STRING(100),
               allowNull: false
          },
          Email: {
               type: DataTypes.STRING(100),
               allowNull: false,
          },
          Phone: {
               type: DataTypes.STRING(20),
               allowNull: false
          }
     }, {
          freezeTableName: true,
          timestamps: false,
     });
};

export default Studentmodel;