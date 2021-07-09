module.exports = (sequelize, { TEXT, BIGINT }) => {
  const schema = {
    key: {
      type: TEXT,
      allowNull: true,
    },
    value: {
      type: TEXT,
      allowNull: true,
    },
    value_type: {
      type: TEXT,
      allowNull: true,
    },
    namespace: {
      type: TEXT,
      allowNull: true,
    },
    error: {
      type: TEXT,
      allowNull: true,
    },
  };

  const Field = sequelize.define("Field", schema);

  Field.associate = ({ Product }) => {
    Field.belongsTo(Product);
  };

  return Field;
};
