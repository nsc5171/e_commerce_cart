'use strict';

const utils = require('@nsaichandra/oe-common-utils/utils');

module.exports = function cartPromotion(CartPromotion) {

    CartPromotion._pattern_handlers = {
        default: function (cart) {
            return cart;
        },
        "CART_THRESHOLD": function (cart, cartValue, cartDiscount) {
            if ((cart.MRP - cart.itemsDiscount) >= utils.num(cartValue)) {
                cart.cartDiscount += utils.num(cartDiscount);
            }
            return cart;
        }
    };

    CartPromotion._no_pattern_handlers = {
        default: function (cart) {
            return cart;
        }
    };

    CartPromotion.getHandler = function getHandler(pattern, custHandlerName) {
        return function (cart) {
            if (!cart._appliedPromotionGroups) cart._appliedPromotionGroups = new Set();
            if (pattern === 'NO_PATTERN') {
                return (CartPromotion._no_pattern_handlers[custHandlerName] || CartPromotion._no_pattern_handlers.default).apply(null, arguments);
            } else {
                return (CartPromotion._pattern_handlers[pattern] || CartPromotion._pattern_handlers.default).apply(null, arguments);
            }
        };
    }

    CartPromotion.prototype.applyPromotion = function applyPromotion(cart) {
        let self = this;
        if (!cart._appliedPromotionGroups) cart._appliedPromotionGroups = new Set();
        let grps = utils.arrayify(self.mutualExclusivityGroups);
        if (grps.some(g => cart._appliedPromotionGroups.has(g))) return cart;
        grps.forEach(g => {
            cart._appliedPromotionGroups.add(g);
        });
        return self.constructor.getHandler(self.pattern, self.code).apply(null, [cart, ...(self.params || [])]);
    }

}