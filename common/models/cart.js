'use strict';
const utils = require('@nsaichandra/oe-common-utils/utils');
const constants = require('../constants');

module.exports = function Cart(Model) {

    Model.customValidations = utils.arrayify(Model.customValidations);

    Model.customValidations.push(function validateItemsPresence(data, options, next) {
        if (utils.arrayify(data.items).length < 1) return utils.errorUtil.chainErrorOnCb(constants.ERROR_CODES.EMPTY_CART_ERR_01, {}, options, next);
    });
}