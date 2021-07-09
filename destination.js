require("dotenv").config();
const Shopify = require("shopify-api-node");
const path = require("path");

const db = require("./models");
const { Field, Product } = db;
const {
  SHOPIFY_DESTINATION_API,
  SHOPIFY_DESTINATION_PASSWORD,
  SHOPIFY_DESTINATION_DOMAIN,
} = process.env;

const shopify = new Shopify({
  shopName: SHOPIFY_DESTINATION_DOMAIN,
  apiKey: SHOPIFY_DESTINATION_API,
  password: SHOPIFY_DESTINATION_PASSWORD,
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
  const records = await Product.findAll();
  const mapped = records.map((record) => {
    const found = products.find((product) => product.handle === record.handle);
    if (found) {
      record.destination_id = found.id;
      return record.save();
    }
    return Promise.resolve();
  });
  return Promise.all(mapped);
};

const getMetafields = async () => {
  const products = await Product.findAll();
  const mapped = products.map((product) => {
    return shopify.metafield
      .list({
        metafield: {
          owner_resource: "product",
          owner_id: product.destination_id,
        },
      })
      .then((metafields) => {
        return metafields.map((field) => {
          return {
            ...field,
            ProductId: product.id,
          };
        });
      });
  });
  let count = mapped.length;
  shopify.on("callLimits", () => console.log(--count));
  const results = await Promise.all(mapped);
  console.log(results);
  const counter = await Field.count();
  if (counter) {
    throw new Error("Field table has records.");
  }
  const inserts = results
    .filter((item) => item.length)
    .reduce((a, i) => a.concat(i))
    .map((field) =>
      Field.create({
        key: field.key,
        value: field.value,
        value_type: field.value_type,
        namespace: field.namespace,
        ProductId: field.ProductId,
      })
    );
  return Promise.all(inserts);
};
const deleteMetafields = async () => {
  const products = await Product.findAll();
  const mapped = products.map((product) => {
    return shopify.metafield.list({
      metafield: {
        owner_resource: "product",
        owner_id: product.destination_id,
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
    await deleteMetafields();
    // await addProducts();
  } catch (error) {
    console.log(error);
  }
  return process.exit();
})();
