import Alloy from 'alloy';
import {_} from 'alloy/underscore';
import Backbone from 'alloy/backbone';
import sensimityClient from './../client/client';
import baseSensimityService from './../service/base';
import timerModule from 'ti.mely';

/**
 * Public functions
 */

/**
 * Initialize the beaconlogservice. At initialization the beaconlogs earlier retrieved will be send to Sensimity.
 */
function init() {
    // Send beaconlogs every 30 seconds
    const timer = timerModule.createTimer();
    timer.start({
        interval: 30000
    });
    timer.addEventListener('onIntervalChange', sendBeaconLogs);
    sendBeaconLogs();
}

/**
 * Create and save a new beaconlog to send in the future to sensimitys
 * @param beacon A beacon recieved by the beaconscanner
 */
function insertBeaconLog(beacon) {
    beacon.timestamp = Math.round(new Date().getTime() / 1000);
    const beaconLog = baseSensimityService.createSensimityModel('BeaconLog', beacon);
    beaconLog.save();
}

export default { init, insertBeaconLog };

/**
 * Send the beacons to Sensimity
 */
function sendBeaconLogs() {
    if (!Ti.Network.getOnline()) {
        return;
    }

    const library = baseSensimityService.createSensimityCollection('BeaconLog');
    // Send the beaconlogs to the SensimityAPI after fetching from the local database. Only send when beaconlogs are available.
    const success = (beaconLogs) => {
        // Send beaconlogs only if exists
        if (beaconLogs.length !== 0) {
            sensimityClient.sendScanResults(JSON.parse(JSON.stringify(createBeaconLogsCollection(beaconLogs))), destroyBeaconLogs);
        }   
    };
    library.fetch({
        success
    });
}

/**
 * Create an beaconlogs collection. A instanceref is required to send beaconlogs.
 * @param beaconLogs The beaconlogs which will be send to the SensimityAPI.
 * @returns {{instance_ref: (exports.sensimity.instanceRef|*), device: {device_id: String, model: String, operating_system: String, version: String}, beaconLogs: *}}
 */
function createBeaconLogsCollection(beaconLogs) {
    const instanceRef = Alloy.CFG.sensimity.instanceRef;
    return {
        instance_ref: instanceRef,
        device: {
            device_id: Ti.Platform.id,
            model: Ti.Platform.model,
            operating_system: Ti.Platform.osname,
            version: Ti.Platform.version
        },
        beaconLogs
    };
}

/**
 * Destroy the beaconlogs from local database
 */
function destroyBeaconLogs() {
    baseSensimityService.createSensimityCollection('BeaconLog').erase();
}

