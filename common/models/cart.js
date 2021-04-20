'use strict';
const utils = require('@nsaichandra/oe-common-utils/utils');
const constants = require('../constants');

module.exports = function Cart(Model) {

    Model.customValidations = utils.arrayify(Model.customValidations);

    Model.customValidations.push(function validateItemsPresence(data, options, next) {
        if (utils.arrayify(data.items).length < 1) return utils.errorUtil.chainErrOnCb(constants.ERROR_CODES.EMPTY_CART_ERR_01, {}, options, next);
        process.nextTick(next);
    });

    Match.remoteMethod('calculateCartPricing', {
        accepts: [
            utils.options_arg_defn
        ],
        http: { verb: 'POST' },
        returns: { root: true, type: 'object' }
    });

    Model.calculateCartPricing= function calculateCartPricing(data,options,next){
        
    }
}