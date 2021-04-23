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

    Cart.observe('before save', function calculateCartPricingAtWrite(ctx, next) {
        ctx.Model.calculateCartPricing(ctx.isNewInstance ? ctx.instance.toObject() : Object.assign(ctx.currentInstance.toObject(), ctx.data), ctx.options, (err, data) => {
            if (err) return next(err);
            if (ctx.isNewInstance) {
                let CartItemClass = utils.lb.findModel('CartItem');
                ctx.instance.setAttribute("items", utils.arrayify(data.items).map(i => new CartItemClass(i)));
                ["MRP", "itemsDiscount", "cartDiscount", "promotions"].forEach(f => ctx.instance.setAttribute(f, data[f]));
            } else {
                ctx.data = data;
            }
            next();
        }, true);
    })

    Cart.remoteMethod('calculateCartPricing', {
        accepts: [
            { arg: 'data', required: true, type: "object", http: { source: "body" } },
            utils.options_arg_defn
        ],
        http: { verb: 'PUT' },
        returns: { root: true, type: 'object' }
    });

    Cart.calculateCartPricing = function calculateCartPricing(data, options, next, atStorage = false) {
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
                        utils.lb.findModel('ItemMaster').find({ where: { code: { inq: fnCtx.itemTypes } } }, options, (err, itemMasterRecs) => {
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
                ], err => stepDone(err));
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
                ], err => stepDone(err));
            },
            function processItemPromotions(stepDone) {
                data.items.forEach(item => {
                    let itemMaster = fnCtx.itemMasters[item.itemType];
                    Object.assign(item, {
                        perItemMRP: itemMaster.MRP,
                        discount: 0,
                        promotions: [],
                        _promotionCodes: []
                    }),

                        utils.arrayify(itemMaster.promotionCodes).forEach(promotionCode => {
                            fnCtx.itemPromotionInsts[promotionCode].applyPromotion(item);
                        });
                    if (!atStorage) item._sellingPrice = Math.max(0, (item.quantity * item.perItemMRP) - item.discount);
                });
                process.nextTick(stepDone);
            },
            function processCartPromotions(stepDone) {
                Object.assign(data, {
                    _appliedPromotionGroups: new Set(),
                    itemsDiscount: 0,
                    cartDiscount: 0,
                    MRP: 0,
                    promotions: [],
                    _promotionCodes: []
                });
                data.items.forEach(item => {
                    data.itemsDiscount += item.discount;
                    data.MRP += (item.perItemMRP * item.quantity);
                    item._appliedPromotionGroups.forEach(val => {
                        data._appliedPromotionGroups.add(val);
                    });
                    if (!atStorage) item._appliedPromotionGroups = Array.from(item._appliedPromotionGroups);
                    else delete item._appliedPromotionGroups;
                })
                utils.arrayify(fnCtx.cartPromotionCodes).forEach(promotionCode => {
                    fnCtx.cartPromotionInsts[promotionCode].applyPromotion(data);
                })
                if (!atStorage) {
                    data._appliedPromotionGroups = Array.from(data._appliedPromotionGroups);
                    data._sellingPrice = Math.max(0, data.MRP - data.itemsDiscount - data.cartDiscount);
                }
                else {
                    delete data._appliedPromotionGroups
                };
                process.nextTick(stepDone);
            }
        ], err => {
            next(err, data)
        });
    }
}