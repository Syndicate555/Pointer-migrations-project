require("dotenv").config();
const Shopify = require("shopify-api-node");
const path = require("path");

const db = require("./models");
const { Product, Field } = db;
const { SHOPIFY_SOURCE_API, SHOPIFY_SOURCE_PASSWORD, SHOPIFY_SOURCE_DOMAIN } =
  process.env;

const shopify = new Shopify({
  shopName: SHOPIFY_SOURCE_DOMAIN,
  apiKey: SHOPIFY_SOURCE_API,
  password: SHOPIFY_SOURCE_PASSWORD,
  autoLimit: { calls: 2, interval: 1000, bucketSize: 35 },
});

const doStuff = async () => {
  const shop = await shopify.shop.get();
};

const pushMetafields = async () => {
  const fields = await Field.findAll({
    include: [
      {
        model: Product,
        required: true,
      },
    ],
  });

  const mapped = fields.map((product) => {
    return shopify.metafield
      .create({
        key: product.key,
        value: product.value,
        value_type: product.value_type,
        namespace: product.namespace,
        owner_resource: "product",
        owner_id: product.Product.source_id,
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.body &&
          error.response.body.errors
        ) {
          product.error = JSON.stringify(error.response.body.errors);
          product.save();
        } else {
          product.error = JSON.stringify([{ message: error.message }]);
          product.save();
        }
      });
  });
  return Promise.all(mapped);
};

(async () => {
  try {
    await db.sequelize.sync();
    await pushMetafields();
  } catch (error) {
    console.log(error);
  }
  return process.exit();
})();
