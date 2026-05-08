
import { DataTypes } from "sequelize";
const Studentmodel = (sequelize) => {

     
     return sequelize.define("HOCSINH", {
          MaHS: {
               type: DataTypes.STRING(10),
               allowNull: false,
               primaryKey: true,
          },
          HoTen: {
               type: DataTypes.STRING(50),
               allowNull: false
          },
          GioiTinh: {
               type: DataTypes.STRING(5),
               allowNull: false,
          },

          NgaySinh: {
               type: DataTypes.DATEONLY,
               allowNull: false,
               validate: {isDate: true}
          },
          DiaChi: {
               type: DataTypes.STRING(200),
               allowNull: false,
          },
          Email: {
               type: DataTypes.STRING(100),
               allowNull: false,
          },
          SoDienThoai: {
               type: DataTypes.STRING(20),
               allowNull: false,
          }
     }, {
          freezeTableName: true,
          timestamps: false,
     });
};

export default Studentmodel;