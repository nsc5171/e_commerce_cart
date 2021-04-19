'use strict';
const baseEntityModel = require('oe-cloud/common/models/base-entity.json');
const utils = require('@nsaichandra/oe-common-utils/utils');
const log = require('oe-logger')('pre-boot-interceptor.js');
const refCodeBaseModel = require('oe-cloud/common/models/ref-code-base.json');
const appConfigModel = require('@nsaichandra/oe-common-utils/common/models/app-config.json');

module.exports = function intercept() {
    if (!baseEntityModel) {
        log.error(log.defaultContext(), "oe-cloud/common/models/base-entity.json not found!!!!");
        process.exit(1);
    }
    
    //Restrict API access to any unauthenticated user
    baseEntityModel.acls = utils.arrayify(baseEntityModel.acls);
    baseEntityModel.acls.push({
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$unauthenticated",
        "permission": "DENY"
    });

    enableCachingMixin();
}

function enableCachingMixin() {
    if (!refCodeBaseModel) {
        log.error(log.defaultContext(), "oe-cloud/common/models/ref-code-base.json not found!!!!");
        process.exit(1);
    }

    if (!appConfigModel) {
        log.error(log.defaultContext(), "@nsaichandra/oe-common-utils/common/models/app-config.json not found!!!!");
        process.exit(1);
    }
    if (typeof refCodeBaseModel.mixins !== 'object') refCodeBaseModel.mixins = {};
    if (typeof appConfigModel.mixins !== 'object') appConfigModel.mixins = {};
    appConfigModel.mixins.CachingMixinNSC = refCodeBaseModel.mixins.CachingMixinNSC = {
        "cacheModule": "node-cache",
        "stdTTL": 300,
        "checkperiod": 300,
        "useClones": false,
        "deleteOnExpire": true,
        "maxKeys": 100
    };
}
