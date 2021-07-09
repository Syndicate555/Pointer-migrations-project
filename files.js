
const Promise = require('bluebird');
const csv = require('csvtojson');
const fs = require('fs');

module.exports.getCsvFile = ({ path }) => csv().fromFile(path);

module.exports.writeIt = ({ path, data }) => new Promise((res, rej) => fs.writeFile(path, data, (err) => {
    if (err) { return rej(err); }
    console.log(`Saved to: ${path}`);
    return res();
}));

module.exports.readIt = ({ path }) => new Promise((res, rej) => fs.readFile(path, (err, data) => {
    return err ? rej(err) : res(JSON.parse(data));
}));

module.exports.readImage = ({ path }) => new Promise((res, rej) => fs.readFile(path, (err, data) => {
    return err ? rej(err) : res(data);
}));

module.exports.readXML = ({ path }) => new Promise((res, rej) => fs.readFile(path, (err, data) => {
    return err ? rej(err) : res(data);
}));