import Alloy from 'alloy';
import {_} from 'alloy/underscore';
import Backbone from 'alloy/backbone';
import BaseScanner from './../scanners/base';
import beaconMapper from './../mapper/beuckman/beacon';
import beaconRegionMapper from './../mapper/beuckman/beaconRegion';
import beaconRegionMonitoringMapper from './../mapper/beuckman/beaconRegionMonitoring';

/**
 * Beuckman scanner to scan iBeacons on iOS
 * @returns {BaseScanner}
 * @constructor
 */
export default function() {
    // set self = basescanner to use this function as an abstract function for the beuckmanfunction
    const self = new BaseScanner(beaconMapper, beaconRegionMapper, beaconRegionMonitoringMapper);
    self.Beacons = require('org.beuckman.tibeacons');

    self.isBLESupported = () => self.Beacons.isBLESupported();

    self.isBLEEnabled = callback => {
        if (!_.isFunction(callback)) {
            Ti.API.warn('please define a function callback, ble status cannot be retrieved');
            return;
        }
        const handleBleStatus = e => {
            // Useless status See https://github.com/jbeuckm/TiBeacons/issues/24
            if (e.status === 'unknown') {
                return;
            }
            self.Beacons.removeEventListener('bluetoothStatus', handleBleStatus);
            if (e.status === 'on') {
                callback(true);
            } else {
                callback(false);
            }
        };
        self.Beacons.addEventListener('bluetoothStatus', handleBleStatus);

        self.Beacons.requestBluetoothStatus();
    };

    // Bindservice function is required in from the Basescanner, but Beuckman contains no bindoption
    self.bindService = bindCallback => bindCallback();

    // Start ranging beacons when a beaconregion is detected
    self.enterRegion = param => self.Beacons.startRangingForBeacons(param);

    // Stop ranging beacons for a region when a beaconregion is exited
    self.exitRegion = param => self.Beacons.stopRangingForBeacons(param);

    // Call beaconfound for every found beacon and handle the found beacons
    self.beaconRangerHandler = param => {
        param.beacons.forEach(beacon => {
            self.beaconFound(beacon);
        });
    };

    self.regionState = e => {
        if (e.regionState === 'inside') {
            self.Beacons.startRangingForBeacons({
                uuid: e.uuid,
                identifier: e.identifier
            });
        } else if (e.regionState === 'outside') {
            self.Beacons.stopRangingForBeacons({
                uuid: e.uuid,
                identifier: e.identifier
            });
        }
    };

    // override stopscanning
    self.stopScanning = () => {
        self.removeAllEventListeners();
        self.Beacons.stopMonitoringAllRegions();
        self.Beacons.stopRangingForAllBeacons();
        self.destruct();
    };

    // Add eventlisteners, called by startingscan in Basescanner
    self.addAllEventListeners = () => {
        self.Beacons.addEventListener('beaconRanges', self.beaconRangerHandler);
        self.Beacons.addEventListener('determinedRegionState', self.regionState);
    };

    // Remove eventlisteners on stop scanning
    self.removeAllEventListeners = () => {
        self.Beacons.removeEventListener('beaconRanges', self.beaconRangerHandler);
        self.Beacons.removeEventListener('determinedRegionState', self.regionState);
    };

    return self;
}
