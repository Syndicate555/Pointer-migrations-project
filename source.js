require("dotenv").config();
const Shopify = require("shopify-api-node");
const path = require("path");

const db = require("./models");
const { Product } = db;
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

const getProducts = async () => {
  let params = { limit: 250 };
  const results = [];
  do {
    const products = await shopify.product.list(params);
    products.forEach((a) => {
      results.push(a);
    });
    params = products.nextPageParameters;
  } while (params !== undefined);
  return results;
};

const addProducts = async () => {
  const products = await getProducts();
  const mapped = products.map((product) => ({
    source_id: product.id,
    handle: product.handle,
  }));
  const count = await Product.count();
  if (count) {
    throw new Error("Product table has records.");
  }
  return Product.bulkCreate(mapped);
};

const deleteMetafields = async () => {
  const products = await Product.findAll();
  const mapped = products.map((product) => {
    return shopify.metafield.list({
      metafield: {
        owner_resource: "product",
        owner_id: product.source_id,
      },
    });
  });
  let count = mapped.length;
  shopify.on("callLimits", () => console.log(--count));
  const results = await Promise.all(mapped);
  const mapped2 = results
    .filter((item) => item.length)
    .reduce((a, i) => a.concat(i))
    .map((field) => {
      return shopify.metafield.delete(field.id);
    });
  let count2 = mapped2.length;
  shopify.on("callLimits", () => console.log(--count2));
  return Promise.all(mapped2);
};

(async () => {
  try {
    await db.sequelize.sync();
    // await addProducts();
    await deleteMetafields();
  } catch (error) {
    console.log(error);
  }
  return process.exit();
})();
