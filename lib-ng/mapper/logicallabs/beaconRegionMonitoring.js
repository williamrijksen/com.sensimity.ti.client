import Alloy from 'alloy';
import {_} from 'alloy/underscore';
import Backbone from 'alloy/backbone';
import scanModule from 'com.logicallabs.beacons';

/**
 * Create a beaconregion from a knownbeacon used by the logicallabsscanner
 * @param knownBeacon A knownbeacon
 * @returns {{uuid: String, identifier: String}}
 */
function map(knownBeacon) {
    const beaconRegion = scanModule.createBeaconRegion({
        UUID: knownBeacon.get('UUID'),
        identifier: knownBeacon.get('beacon_id')
    });
    return {
        beaconRegion
    };
}

export {map};
