import Alloy from 'alloy';
import {_} from 'alloy/underscore';
import Backbone from 'alloy/backbone';
import BaseScanner from './../scanners/base';
import beaconMapper from './../mapper/logicallabs/beacon';
import beaconRegionMapper from './../mapper/logicallabs/beaconRegion';
import beaconRegionMonitoringMapper from './../mapper/logicallabs/beaconRegionMonitoring';

/**
 * Logicallabs scanner to scan iBeacons on iOS devices
 * @param boolean backgroundMode - Parameter to handle beacons when the application is running in backgroundmode
 * @returns {BaseScanner}
 */
export default function() {
    const self = new BaseScanner(beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper);
    self.Beacons = require('com.logicallabs.beacons');

    self.checkBluetooth = () => {};

    // Bind the beaconservice
    self.bindService = () => {
        // Check if the device is running iOS 8 or later, before registering for local notifications
        if (parseInt(Ti.Platform.version.split(".")[0], 10) >= 8) {
            self.Beacons.requestAlwaysAuthorization();
        }
    };

    self.regionStateUpdated = e => {
        switch(e.state) {
            case self.Beacons.REGION_STATE_INSIDE:
                self.Beacons.startRangingBeacons({
                    beaconRegion: e.region
                });
                break;
            case self.Beacons.REGION_STATE_OUTSIDE:
                self.Beacons.stopRangingBeacons({
                    beaconRegion: e.region
                });
                break;
        }
    };

    self.beaconsFound = beacons => {
        beacons.beacons.forEach(beacon => {
            if (_.isUndefined(beacon) || _.isUndefined(beacon.RSSI)) {
                return;
            }
            beacon.rssi = beacon.RSSI;
            self.beaconFound(beacon);
        });
    };

    // Stop scanning
    self.stopScanning = () => {
        self.Beacons.stopRegionMonitoring();
        self.removeAllEventListeners();
        self.destruct();
    };

    // Add eventlisteners for scanning beacons
    self.addAllEventListeners = () => {
        self.Beacons.addEventListener('regionStateUpdated', self.regionStateUpdated);
        self.Beacons.addEventListener('rangedBeacons', self.beaconsFound);
    };

    // Remove eventlisteners when the scanning is stopped
    self.removeAllEventListeners = () => {
        self.Beacons.removeEventListener('regionStateUpdated', self.regionStateUpdated);
        self.Beacons.removeEventListener('rangedBeacons', self.beaconsFound);
    };

    return self;
}