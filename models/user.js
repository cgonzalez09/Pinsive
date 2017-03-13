'use strict';
module.exports = function(sequelize, DataTypes) {
  var user = sequelize.define('user', {
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    email: DataTypes.STRING,
    pinterestId: DataTypes.STRING,
    pinterestToken: DataTypes.TEXT
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    },
    instanceMethods: {
      isValidPassword: function(passwordTyped){
        return bcrypt.compareSync(passwordTyped, this.password);
      },
      toJSON: function(){
        var data = this.get();
        delete data.password;
        return data;
      }
    }
  });
  return user;
};