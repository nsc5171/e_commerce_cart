'use strict';

const utils = require('@nsaichandra/oe-common-utils/utils');

module.exports = function cartPromotion(CartPromotion) {

    CartPromotion._pattern_handlers = {
        default: function (cart) {
            return false;
        },
        "CART_THRESHOLD": function (cart, cartValue, cartDiscount) {
            if ((cart.MRP - cart.itemsDiscount) >= utils.num(cartValue)) {
                cart.cartDiscount += utils.num(cartDiscount);
                return true;
            }
            return false;
        },
        "CART_ITEM_SPECIFICS": function (cart, flatRate, productsCSV) {
            if (productsCSV.split(',').every(pType => {
                return cart.items.some(item => item.itemType === pType);
            })) {
                cart.cartDiscount += utils.num(flatRate);
                return true;
            }
            return false;
        }
    };

    CartPromotion._no_pattern_handlers = {
        default: function (cart) {
            return cart;
        }
    };

    function getHandler(pattern, promotionCode) {
        return function () {
            return (pattern === 'NO_PATTERN') ? (CartPromotion._no_pattern_handlers[promotionCode] || CartPromotion._no_pattern_handlers.default).apply(null, arguments) : (CartPromotion._pattern_handlers[pattern] || CartPromotion._pattern_handlers.default).apply(null, arguments);
        };
    }

    CartPromotion.prototype.applyPromotion = function applyPromotion(cart) {
        let self = this;
        if (!cart._appliedPromotionGroups) cart._appliedPromotionGroups = new Set();
        if (!cart.promotions) cart.promotions = [];
        if (!cart._promotionCodes) cart._promotionCodes = [];
        let grps = utils.arrayify(self.mutualExclusivityGroups);
        if (grps.some(g => cart._appliedPromotionGroups.has(g))) return false;
        if (getHandler(self.pattern, self.code).apply(null, [cart, ...(self.params || [])])) {
            cart.promotions.push(self.description || '');
            cart._promotionCodes.push(self.code);
            grps.forEach(g => {
                cart._appliedPromotionGroups.add(g);
                cart._cartOnlyPromotionGroups.add(g);
            });
            return true;
        } else {
            return false;
        }
    }

}