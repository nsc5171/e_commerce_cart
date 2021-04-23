'use strict';

module.exports = function itemPromotion(ItemPromotion) {

    ItemPromotion._pattern_handlers = {
        default: function (cartItem) {
            return cartItem;
        },
        "MULTI_BUY": function (cartItem, itemCountEqOrMoreThan, discountPerItem) {
            if (cartItem.quantity >= 3) {

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
        return function () {
            if (!cartItem._appliedPromotionGroups) cartItem._appliedPromotionGroups = new Set();
            if (pattern === 'NO_PATTERN') {
                return (ItemPromotion._no_pattern_handlers[custHandlerName] || ItemPromotion._no_pattern_handlers.default).apply(null, arguments);
            } else {
                return (ItemPromotion._pattern_handlers[pattern] || ItemPromotion._pattern_handlers.default).apply(null, arguments);
            }
        };
    }

}