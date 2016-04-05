import Alloy from 'alloy';
import {_} from 'alloy/underscore';
import Backbone from 'alloy/backbone';
import BaseScanner from './../scanners/base';
import beaconMapper from './../mapper/altbeacon/beacon';
import beaconRegionMapper from './../mapper/altbeacon/beaconRegion';
import beaconRegionMonitoringMapper from './../mapper/altbeacon/beaconRegionMonitoring';

/**
 * Altbeacon scanner to scan iBeacons on Android devices
 * @param boolean backgroundMode - Parameter to handle beacons when the application is running in backgroundmode
 * @returns {BaseScanner}
 */
export default function(runInService) {
    const self = new BaseScanner(beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper);
    self.Beacons = require('com.drtech.altbeacon');
    self.scanPeriods = {
        'proactive': {
            foregroundScanPeriod: 1101,
            foregroundBetweenScanPeriod: 0,
            backgroundScanPeriod: 5001,
            backgroundBetweenScanPeriod: 60001
        },
        'aggressive': {
            foregroundScanPeriod: 1001,
            foregroundBetweenScanPeriod: 0,
            backgroundScanPeriod: 2001,
            backgroundBetweenScanPeriod: 5001
        }
    };

    self.isBLESupported = () => self.Beacons.isBLESupported();

    self.isBLEEnabled = callback => {
        if (!_.isFunction(callback)) {
            Ti.API.warn('please define a function callback, ble status cannot be retrieved');
            return;
        }
        callback(self.Beacons.checkAvailability());
    };

    // Bind the beaconservice
    self.bindService = bindCallback => {
        const handleServiceBind = () => {
            self.Beacons.removeEventListener("serviceBound", handleServiceBind);
            bindCallback();
        };
        self.Beacons.setAutoRange(true);
        self.Beacons.setRunInService(runInService);
        self.Beacons.addBeaconLayout('m:2-3=0215,i:4-19,i:20-21,i:22-23,p:24-24');
        // Start scanning after binding beaconservice
        self.Beacons.addEventListener("serviceBound", handleServiceBind);
        self.Beacons.bindBeaconService();
    };

    // Stop scanning
    self.stopScanning = () => {
        if (self.Beacons.beaconServiceIsBound()) {
            self.Beacons.stopMonitoringAllRegions();
            self.Beacons.unbindBeaconService();
        }
        self.removeAllEventListeners();
        self.destruct();
    };

    // Add eventlisteners for scanning beacons
    self.addAllEventListeners = () => {
        self.Beacons.addEventListener('beaconProximity', self.beaconFound);
    };

    // Remove eventlisteners when the scanning is stopped
    self.removeAllEventListeners = () => {
        self.Beacons.removeEventListener('beaconProximity', self.beaconFound);
    };

    // Set backgroundmode to save power in background
    self.setBackgroundMode = value => {
        self.Beacons.setBackgroundMode(value);
    };

    self.setBehavior = period => {
        if (!_.has(self.scanPeriods, period)) {
            Ti.API.warn('behavior cannot be set. Only values \'proactive\' or \'aggressive\' are applicable');
            return;
        }
        self.Beacons.setScanPeriods(self.scanPeriods[period]);
    };

    return self;
}