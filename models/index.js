const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('my_database', 'postgres', 'qwert@123', {
    host: 'localhost',
    dialect: 'postgres'
});

const User = require('./user')(sequelize, DataTypes);
const Task = require('./task')(sequelize, DataTypes);


User.hasMany(Task, { foreignKey: 'userId' });
Task.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Task };