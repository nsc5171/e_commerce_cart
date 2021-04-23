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
            { arg: 'data', required: true, type: "Cart", http: { source: "body" } },
            utils.options_arg_defn
        ],
        http: { verb: 'POST' },
        returns: { root: true, type: 'object' }
    });

    Cart.calculateCartPricing = function calculateCartPricing(data, options, next) {
        data.items = utils.arrayify(data.items);
        let fnCtx = { itemTypes: Array.from(utils.arrayify(data && data.items).reduce((fin, curr) => { fin.add(curr.itemType); return fin; }, new Set())), itemPromotionCodes: new Set(), itemMasters: {} };
        async.waterfall([
            function fetchPromotionCodes(stepDone) {
                async.parallel([
                    function fetchAppConfig(threadDone) {
                        utils.lb.findModel('AppConfig').findOne({ where: { key: 'settings' } }, options, (err, cfgInst) => {
                            fnCtx.cartPromotionCodes = utils.arrayify(utils.valueAt(cfgInst, ['value', 'cartPromotions']));
                            threadDone(err);
                        })
                    },
                    function fetchItemMasterRecs(threadDone) {
                        utils.lb.findModel('ItemMaster').find({ where: { inq: fnCtx.itemTypes } }, options, (err, itemMasterRecs) => {
                            if (err) return threadDone(err);
                            utils.arrayify(itemMasterRecs).forEach(im => {
                                fnCtx.itemMasters[im.code] = im;
                                utils.arrayify(im.promotionCodes).forEach(pc => {
                                    fnCtx.itemPromotionCodes.add(pc);
                                })
                            })
                            threadDone();
                        })
                    }
                ], stepDone);
            },
            function fetchPromotionDefns(stepDone) {
                async.parallel([
                    function fetchCartPromotionRecs(threadDone) {
                        utils.lb.findModel('CartPromotion').find({ where: { code: { inq: fnCtx.cartPromotionCodes } } }, options, (err, cartPromotionDefns) => {
                            fnCtx.cartPromotionInsts = utils.arrayify(cartPromotionDefns).reduce((fin, curr) => {
                                fin[curr.code] = curr;
                                return fin;
                            }, {});
                            threadDone(err);
                        })
                    },
                    function fetchItemPromotionRecs(threadDone) {
                        utils.lb.findModel('ItemPromotion').find({ where: { code: { inq: Array.from(fnCtx.itemPromotionCodes) } } }, options, (err, itemPromotionDefns) => {
                            fnCtx.itemPromotionInsts = utils.arrayify(itemPromotionDefns).reduce((fin, curr) => {
                                fin[curr.code] = curr;
                                return fin;
                            }, {});
                            threadDone(err);
                        })
                    }
                ], stepDone);
            },
            function processItemPromotions(stepDone) {
                data.items.forEach(item => {
                    let itemMaster = fnCtx.itemMasters[item.itemType];
                    item.perItemMRP = itemMaster.MRP;
                    utils.arrayify(itemMaster.promotionCodes).forEach(promotionCode => {
                        fnCtx.itemPromotionInsts[promotionCode].applyPromotion(item);
                    })
                });
                process.nextTick(stepDone);
            },
            function processCartPromotions(stepDone) {
                data.items.forEach(item => {
                    data.itemsDiscount += item.discount;
                    data.MRP += (item.perItemMRP * item.quantity);
                })
                utils.arrayify(fnCtx.cartPromotionCodes).forEach(promotionCode => {
                    fnCtx.cartPromotionInsts[promotionCode].applyPromotion(data);
                })
                process.nextTick(stepDone);
            }
        ], err => next(err, data));
    }
}