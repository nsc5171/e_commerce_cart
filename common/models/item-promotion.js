'use strict';

const utils = require('@nsaichandra/oe-common-utils/utils');

module.exports = function itemPromotion(ItemPromotion) {

    ItemPromotion._pattern_handlers = {
        default: function (cartItem) {
            return cartItem;
        },
        "MULTI_BUY": function (cartItem, itemCountEqOrMoreThan, discountPerItem) {
            if (cartItem.quantity >= utils.num(itemCountEqOrMoreThan)) {
                cartItem.discount += (utils.num(discountPerItem) * cartItem.quantity);
            }
            return cartItem;
        }
    };

    ItemPromotion._no_pattern_handlers = {
        default: function (cartItem) {
            return cartItem;
        }
    };

    ItemPromotion.getHandler = function getHandler(pattern, custHandlerName) {
        return function (cartItem) {
            if (!cartItem._appliedPromotionGroups) cartItem._appliedPromotionGroups = new Set();
            if (pattern === 'NO_PATTERN') {
                return (ItemPromotion._no_pattern_handlers[custHandlerName] || ItemPromotion._no_pattern_handlers.default).apply(null, arguments);
            } else {
                return (ItemPromotion._pattern_handlers[pattern] || ItemPromotion._pattern_handlers.default).apply(null, arguments);
            }
        };
    }

    ItemPromotion.prototype.applyPromotion = function applyPromotion(cartItem) {
        let self = this;
        if (!cartItem._appliedPromotionGroups) cartItem._appliedPromotionGroups = new Set();
        let grps = utils.arrayify(self.mutualExclusivityGroups);
        if (grps.some(g => cartItem._appliedPromotionGroups.has(g))) return cartItem;
        grps.forEach(g => {
            cartItem._appliedPromotionGroups.add(g);
        });
        return self.constructor.getHandler(self.pattern, self.code).apply(null, [cartItem, ...(self.params || [])]);
    }

}