/* eslint-disable no-console */
const oecloud = require('oe-cloud');
const path = require('path');

const PRE_BOOT_INTERCEPTOR = require('./pre-boot-interceptor.js');

//Intercept before app boot and start to make customizations
PRE_BOOT_INTERCEPTOR()

process.env.ENABLE_COOKIE = process.env.ENABLE_COOKIE || true;
oecloud.boot(__dirname, function (err) {
  if (err) {
    console.error(err);
  }
  oecloud.start();
  oecloud.emit('loaded');
});

oecloud.get('/', function (req, res) {
  res.sendFile('index.html', { root: path.join(__dirname, '../client/') });
});