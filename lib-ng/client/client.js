/* Compatibility for Ti standalone (without Alloy) */
if (typeof OS_ANDROID === "undefined") {
    const OS_ANDROID = Ti.Platform.name === "android";
    const OS_IOS = Ti.Platform.name === "iPhone OS";
}

import Alloy from 'alloy';
import {_} from 'alloy/underscore';
import Backbone from 'alloy/backbone';
import reste from "reste";
import oauth2 from './oauth2';

let token;
let expires;
let url = "https://api.sensimity.com/";
const api = new reste();

if (Alloy.CFG.sensimity.url) {
    url = Alloy.CFG.sensimity.url;
}

function setApiConfig() {
    const config = {
        debug: false, // allows logging to console of ::REST:: messages
        autoValidateParams: false, // set to true to throw errors if <param> url properties are not passed
        timeout: 10000,
        url,
        requestHeaders: {
            "Accept": "application/vnd.sensimity.v1+json",
            "Content-Type": "application/vnd.sensimity.v1+json",
            "Authorization": `Bearer ${oauth2.getAccess().token}`
        },
        methods: [
            {
                name: "getNetworks",
                get: "network"
            },
            {
                name: "getBeacons",
                get: "network/<networkId>/beacon"
            },
            {
                name: "getBusinessRules",
                get: "network/<networkId>/business-rule?beacon=<beaconId>"
            },
            {
                name: "getSingleBusinessRule",
                get: "network/<networkId>/business-rule/<businessRuleId>"
            },
            {
                name: "sendScanResults",
                post: "scan-results"
            }
        ],
        onError(e) {
            Ti.API.info(`There was an error accessing the API > ${JSON.stringify(e)}`);
        },
        onLoad(e, callback) {
            callback(e);
        }
    };

    api.config(config);
}

function getNetworks(callback) {
    oauth2.init(() => {
        setApiConfig();
        api.getNetworks(beacons => callback(beacons));
    });
}

function getBeacons(networkId, callback) {
    oauth2.init(() => {
        setApiConfig();
        api.getBeacons({
            networkId
        }, response => callback(response));
    });
}

function getBusinessRules(networkId, beaconId, callback) {
    oauth2.init(() => {
        setApiConfig();
        api.getBusinessRules({
            networkId,
            beaconId
        }, response => callback(response));
    });
}

function getSingleBusinessRule(networkId, businessRuleId, callback) {
    oauth2.init(() => {
        setApiConfig();
        api.getSingleBusinessRule({
            networkId,
            businessRuleId
        }, response => callback(response));
    });
}

function sendScanResults(body, callback) {
    oauth2.init(() => {
        setApiConfig();
        api.sendScanResults({
            body
        }, callback);
    });
}

export default {
    getNetworks,
    getBeacons,
    sendScanResults,
    getSingleBusinessRule,
    getBusinessRules
};
