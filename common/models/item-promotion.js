'use strict';

const utils = require('@nsaichandra/oe-common-utils/utils');

module.exports = function itemPromotion(ItemPromotion) {

    ItemPromotion._pattern_handlers = {
        default: function (cartItem) {
            return false;
        },
        "MULTI_BUY": function (cartItem, itemCountEqOrMoreThan, discountPerItem) {
            if (cartItem.quantity >= utils.num(itemCountEqOrMoreThan)) {
                cartItem.discount += (utils.num(discountPerItem) * cartItem.quantity);
                return true;
            }
            return false;
        },
    };

    ItemPromotion._no_pattern_handlers = {
        default: function (cartItem) {
            return false;
        }
    };

    function getHandler(pattern, promotionCode) {
        return function () {
            return (pattern === 'NO_PATTERN') ? (ItemPromotion._no_pattern_handlers[promotionCode] || ItemPromotion._no_pattern_handlers.default).apply(null, arguments) : (ItemPromotion._pattern_handlers[pattern] || ItemPromotion._pattern_handlers.default).apply(null, arguments);
        };
    }

    ItemPromotion.prototype.applyPromotion = function applyPromotion(cartItem) {
        let self = this;
        if (!cartItem._appliedPromotionGroups) cartItem._appliedPromotionGroups = new Set();
        if (!cartItem.promotions) cartItem.promotions = [];
        if (!cartItem._promotionCodes) cartItem._promotionCodes = [];
        let grps = utils.arrayify(self.mutualExclusivityGroups);
        if (grps.some(g => cartItem._appliedPromotionGroups.has(g))) return false;
        if (getHandler(self.pattern, self.code).apply(null, [cartItem, ...(self.params || [])])) {
            cartItem.promotions.push(self.description || '');
            cartItem._promotionCodes.push(self.code);
            grps.forEach(g => {
                cartItem._appliedPromotionGroups.add(g);
            });
            return true;
        } else {
            return false;
        }
    }

}