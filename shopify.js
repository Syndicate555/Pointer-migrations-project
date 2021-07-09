
const Shopify = require('shopify-api-node');
const valvelet = require('valvelet');
const {
    env: {
        SHOPIFY_API,
        SHOPIFY_SECRET,
        SHOP
    }
} = process;

const SHOPIFY_PAGE_LIMIT = 250;

const limits = (shopify, count, shopifyResource='No resource') => {
    return shopify.on('callLimits', () => console.log(`${shopifyResource} page: ${--count + 1}`));
};

module.exports = {
    getAllShopifyResource: (shopify, shopifyResource, fields=null) => new Promise(async (resolve, reject) => {
        let count = 0;
        try {
            count = await shopify[shopifyResource].count();
        } catch (error) { return reject(error); }

        if (!count) { return reject(new Error(`No Shopify ${shopifyResource}.`)); }

        const pages = Math.ceil(count / SHOPIFY_PAGE_LIMIT);

        if (!pages) { return reject(new Error('No Shopify resource.')); }

        const emptyArray = new Array(pages).fill(new Object(), 0, pages);
        const promises = emptyArray.map(
            (item, i) => shopify[shopifyResource].list({
                limit: SHOPIFY_PAGE_LIMIT,
                page: (i + 1),
                fields,
            }).catch(err => {
                console.log((i + 1));
                console.log(err);
                return null;
            })
        );

        if (!promises.length) { return reject(new Error('No Shopify requests.')); }

        try {
            limits(shopify, promises.length, shopifyResource);

            const results = await Promise.all(promises);

            if (!results) { return reject(new Error('No Shopify results.')); }

            const concatenatedResult = results.reduce((accum, paginatedResult) => accum.concat(paginatedResult));

            return resolve(concatenatedResult);
        } catch (error) { return reject(error); }
    }),

    getAllShopifyArticles: (shopify, blogId) => new Promise(async (resolve, reject) => {
        let count = 0;
        let requstCount = 0;
        try {
            count = await shopify.article.count(blogId);
            if (!count) {
                return resolve([]);
            }
        } catch (error) { return reject(error); }

        const pages = Math.ceil(count / SHOPIFY_PAGE_LIMIT);

        // if (!pages) { return reject(new Error('No Shopify resource.')); }

        const emptyArray = new Array(pages).fill(new Object(), 0, pages);
        const promises = emptyArray.map((item, i) => shopify.article.list(blogId, {
            limit: SHOPIFY_PAGE_LIMIT,
            page: (i + 1)
        }));

        // if (!promises.length) { return reject(new Error('No Shopify requests.')); }

        try {
            limits(shopify, promises.length, 'article');

            const results = await Promise.all(promises);

            if (!results) { return reject(new Error('No Shopify results.')); }

            const concatenatedResult = results.reduce((accum, paginatedResult) => accum.concat(paginatedResult));

            return resolve(concatenatedResult);
        } catch (error) { return reject(error); }
    })
}