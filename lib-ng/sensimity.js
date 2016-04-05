import Alloy from 'alloy';
import {_} from 'alloy/underscore';
import Backbone from 'alloy/backbone';
/* Compatibility for Ti standalone (without Alloy) */
if (typeof OS_ANDROID === "undefined") {
    var OS_ANDROID = Ti.Platform.name === "android";
    var OS_IOS = Ti.Platform.name === "iPhone OS";
}

import sensimityClient from './client/client';
import knownBeaconsService from './service/knownBeacons';

if (_.isUndefined(Alloy.Globals.sensimityEvent)) {
    const dispatcher = require('./dispatcher');
    Alloy.Globals.sensimityEvent = dispatcher;
}

/**
 * Initialize the scanner and start scanning on added network identifier
 * @param options {network_id: <network identifier to scan beacons>}
 * @param callback Callback to inform about the start of sensimity {success: <bool>, message: <string>}
 */
function start(options, callback) {
    // Only start Sensimity when bluetooth is enabled
    isBLEEnabled(value => {
        if (!value) {
            const message = 'Sensimity scan not started because BLE not enabled';
            Ti.API.warn(message);
            if (_.isFunction(callback)) {
                callback({
                    success: false,
                    message
                });
            }
            return;
        }

        if (_.isUndefined(Alloy.Globals.sensimityScanner) === false) {
            Ti.API.warn('Scanner already defined, please destruct first before start scanning');
        } else {
            Alloy.Globals.sensimityScanner = createScanner(options);
            initScannerAndStartScanning(options);
        }
        if (_.isFunction(callback)) {
            callback({
                success: true,
                message: 'Sensimity successfully started'
            });
        }
    });
}

/**
 * Stop scanning
 */
function stop() {
    Alloy.Globals.sensimityEvent["default"].off('sensimity:beaconsRefreshed', restartScanner);
    if (!_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Alloy.Globals.sensimityScanner.stopScanning();
    }
    Alloy.Globals.sensimityScanner = undefined;
}

function pause() {
    if (!OS_ANDROID) {
        Ti.API.warn('sensimity pause not needed on other platforms than Android');
        return;
    }

    if (_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Ti.API.warn('Scanner not initialized, please first initialize the sensimity library');
        return;
    }

    Alloy.Globals.sensimityScanner.setBackgroundMode(true);
}

function resume() {
    if (!OS_ANDROID) {
        Ti.API.warn('sensimity resume not needed on other platforms than Android');
        return;
    }

    if (_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Ti.API.warn('Scanner not initialized, please first initialize the sensimity library');
        return;
    }

    Alloy.Globals.sensimityScanner.setBackgroundMode(false);
}

/**
 * Start background intent for Android
 * @param callback Callback to inform about the start of sensimity {success: <bool>, message: <string>}
 */
function runService(options, callback) {
    // Only start Sensimity when bluetooth is enabled
    isBLEEnabled(value => {
        if (!value) {
            const message = 'Sensimity scan not started because BLE not enabled';
            Ti.API.warn(message);
            if (_.isFunction(callback)) {
                callback({
                    success: false,
                    message
                });
            }
            return;
        }

        if (!OS_ANDROID || _.isUndefined(Alloy.CFG.sensimity.backgroundService)) {
            return;
        }

        const intent = Ti.Android.createServiceIntent({
            url: Alloy.CFG.sensimity.backgroundService,
            startMode: Ti.Android.START_REDELIVER_INTENT
        });
        if (_.isNumber(options.networkId)) {
            intent.putExtra('networkId', options.networkId);
        }
        if (Ti.Android.isServiceRunning(intent)) {
            Ti.Android.stopService(intent);
        }
        Ti.Android.startService(intent);
        if (_.isFunction(callback)) {
            callback({
                success: true,
                message: 'Sensimity successfully started in a Android service'
            });
        }
    });
}

function isBLESupported() {
    let scanner;
    if (OS_ANDROID) {
        scanner = require('./scanners/altbeacon')();
    } else if (OS_IOS) {
        scanner = require('./scanners/beuckman')();
    }
    return scanner.isBLESupported();
}

function isBLEEnabled(callback) {
    let scanner;
    if (OS_ANDROID) {
        scanner = require('./scanners/altbeacon')();
    } else if (OS_IOS) {
        scanner = require('./scanners/beuckman')();
    }
    scanner.isBLEEnabled(callback);
}

const getKnownBeacons = () => knownBeaconsService.getKnownBeacons();
export { start, stop, pause, resume, runService, sensimityClient, isBLESupported, isBLEEnabled, getKnownBeacons };

// Create an scanner, specific for the running platform
function createScanner(options) {
    if (OS_ANDROID) {
        let runInService = false;
        if (_.isBoolean(options.runInService)) {
            runInService = options.runInService;
        }
        // Android, use the altbeaconscanner to scan iBeacons
        const altbeaconScanner = require('./scanners/altbeacon');
        return altbeaconScanner(runInService);
    } else if (OS_IOS) {
        // iOS, use the beuckmanscanner to scan iBeacons
        const beuckmanScanner = require('./scanners/beuckman');
        return beuckmanScanner();
    }
}

// Initialize the sensimityscanner and start scanning on added networkID
function initScannerAndStartScanning(options) {
    if (!_.has(options, 'networkId') || options.networkId === null) {
        Ti.API.warn('Please add a networkId, scanner not started');
        return;
    }
    Alloy.Globals.sensimityScanner.init(options.networkId);
    if (OS_ANDROID && _.has(options, 'behavior')) {
        Alloy.Globals.sensimityScanner.setBehavior(options.behavior);
    }
    Alloy.Globals.sensimityScanner.startScanning();
    Alloy.Globals.sensimityEvent["default"].on('sensimity:beaconsRefreshed', restartScanner);
}

// After refreshing beacons, restart the scanner
function restartScanner() {
    if (!_.isUndefined(Alloy.Globals.sensimityScanner)) {
        Alloy.Globals.sensimityScanner.stopScanning();
        Alloy.Globals.sensimityScanner.startScanning();
    }
}
