import Alloy from 'alloy';
import {_} from 'alloy/underscore';
import Backbone from 'alloy/backbone';
/* jshint ignore:end */

/**
 * Public functions
 */

function map(geofenceRegion) {
    const beaconRaw = geofenceRegion.identifier.split('|');

    return {
        UUID: beaconRaw[1].toUpperCase(),
        major: parseInt(beaconRaw[2], 10),
        minor: parseInt(beaconRaw[3], 10),
        rssi: -1,
        accuracy: -1,
        proximity: -1
    };
}

export {map};
