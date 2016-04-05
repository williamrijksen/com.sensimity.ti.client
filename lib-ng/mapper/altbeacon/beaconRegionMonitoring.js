import Alloy from 'alloy';
import {_} from 'alloy/underscore';
import Backbone from 'alloy/backbone';
/* jshint ignore:end */

/**
 * Create a beaconregion from a knownbeacon used by the altbeaconscanner
 * @param knownBeacon A knownbeacon
 * @returns {{uuid: String, identifier: String}}
 */
function map(knownBeacon) {
    return {
        uuid: knownBeacon.get('UUID'),
        identifier: knownBeacon.get('beacon_id')
    };
}

export {map};
