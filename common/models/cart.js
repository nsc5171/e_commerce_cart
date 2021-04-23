'use strict';
const utils = require('@nsaichandra/oe-common-utils/utils');
const constants = require('../constants');
const async = require('async');

module.exports = function cart(Cart) {

    Cart.customValidations = utils.arrayify(Cart.customValidations);

    Cart.customValidations.push(function validateItemsPresence(data, options, next) {
        if (utils.arrayify(data.items).length < 1) return utils.errorUtil.chainErrOnCb(constants.ERROR_CODES.EMPTY_CART_ERR_01, {}, options, err => {
            err.fieldName = 'items'
            next(err);
        });
        process.nextTick(next);
    });

    Match.remoteMethod('calculateCartPricing', {
        accepts: [
            utils.options_arg_defn
        ],
        http: { verb: 'POST' },
        returns: { root: true, type: 'object' }
    });

    Cart.calculateCartPricing = function calculateCartPricing(data, options, next) {
        let fnCtx = { itemTypes: Array.from(utils.arrayify(data && data.items).reduce((fin, curr) => { fin.add(curr.itemType); return fin; }, new Set())) };
        async.waterfall([
            function fetchAppConfig(stepDone) {
                utils.lb.findModel('AppConfig').findOne({ where: { key: 'settings' } }, options, (err, cfgInst) => {
                    fnCtx.cartPromotionCodes = utils.arrayify(utils.valueAt(cfgInst, ['value', 'cartPromotions']));
                    stepDone(err);
                })
            },
            function fetchItemMasterRecs(stepDone){
                utils.lb.findModel('ItemMaster').find({where:{inq:fnCtx.itemTypes}},options,(err , itemMasterRecs)=>{
                    
                })
            }
        ], err => next(err, data));
    }
}