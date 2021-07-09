module.exports = (sequelize, { TEXT, BIGINT }) => {
  const schema = {
    source_id: {
      type: BIGINT,
      allowNull: true,
    },
    destination_id: {
      type: BIGINT,
      allowNull: true,
    },
    handle: {
      type: TEXT,
      allowNull: true,
    },
  };

  const Product = sequelize.define("Product", schema);

  Product.associate = ({ Field }) => {
    Product.hasMany(Field);
  };

  return Product;
};
