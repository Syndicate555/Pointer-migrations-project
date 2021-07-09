const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(module.filename);

let db = {};
let sequelize = {};

const { DB_HOST, DB_NAME, DB_PORT, DB_PASSWORD, DB_USER_NAME } = process.env;

const options = {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "postgres",
  logging: false,
};

sequelize = new Sequelize(DB_NAME, DB_USER_NAME, DB_PASSWORD, options);

fs.readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
  )
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
