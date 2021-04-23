'use strict';

const utils = require('@nsaichandra/oe-common-utils/utils');

module.exports = function itemMaster(ItemMaster) {

  ItemMaster.prototype.promotionHandlers = function promotionHandlers() {
    let ItemPromotionClass = utils.lb.findModel('ItemPromotion');
    this._promotionHandlers = utils.arrayify(this.promotionCodes).map(code => ItemPromotionClass.getHandler(code));
    return this._promotionHandlers;
  }

}