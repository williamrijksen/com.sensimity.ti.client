import Alloy from 'alloy';
import {_} from 'alloy/underscore';
import Backbone from 'alloy/backbone';
import sensimityClient from './../client/client';
import baseSensimityService from './../service/base';
import businessRuleService from './../service/businessRule';

/**
 * Function to refresh the beacons from Sensimity
 * @param networkIds The network identifiers which must be refreshed
 */
function refreshBeacons(networkIds) {
    if (!Ti.Network.getOnline()) {
        return;
    }

    const uniqNetworkIds = [...new Set(networkIds)];
    uniqNetworkIds.forEach(id => {
        const library = baseSensimityService.createSensimityCollection('KnownBeacon');
        library.erase();
        sensimityClient.getBeacons(id, handleSuccessfullFetchingBeacons);
    });
}

/*****
 * Find a beacon based on UUID, major and minor identifier
 * @param String UUID Beacon UUID
 * @param int major Beacon major id
 * @param int minor Beacon minor id
 */
function findKnownBeacon(UUID, major, minor) {
    const library = baseSensimityService.createSensimityCollection('KnownBeacon');
    library.fetch();
    const knownBeacons = library.where({
        UUID,
        major,
        minor
    });
    if (_.isEmpty(knownBeacons)) {
        return knownBeacons;
    } else {
        return _.first(knownBeacons);
    }
}

/*****
 * Retrieve knownbeacons of a network
 * @param networkId The network identifier of the beacons who searching for
 */
function getKnownBeacons(networkId) {
    const library = baseSensimityService.createSensimityCollection('KnownBeacon');
    library.reset();
    library.fetch();
    const knownBeaconsOfNetworkId = library.where({ network_id : networkId });
    return knownBeaconsOfNetworkId;
}

export default { refreshBeacons, findKnownBeacon, getKnownBeacons };

// When the beacons successfull received from Sensimity, save local and trigger the whole system to let the system know the beacons refreshed
function handleSuccessfullFetchingBeacons(data) {
    // Handle only fetching if data contains beacons.
    if (_.isUndefined(data._embedded) || _.isEmpty(data._embedded)) {
        return;
    }

    const rawData = data._embedded.beacon;
    saveNewBeacons(rawData);

    // Let the whole applicatie know that the beacons are refreshed
    Alloy.Globals.sensimityEvent.trigger('sensimity:beaconsRefreshed');
}

// Save all new beacons
function saveNewBeacons(beaconArray) {
    const library = getEarlierSavedKnownBeacons();
    beaconArray.forEach(beacon => {
        const checkBeaconAlreadySaved = library.where({
            beacon_id: beacon.beacon_id,
        });
        if (!_.isEmpty(checkBeaconAlreadySaved)) {
            return;
        }

        beacon.UUID = beacon.uuid_beacon.toUpperCase();
        beacon.is_geofence = !_.isUndefined(beacon.is_geofence) ? beacon.is_geofence : false;
        const sensimityKnownBeacon = baseSensimityService.createSensimityModel('KnownBeacon', beacon);
        sensimityKnownBeacon.save();

        // Geofences don't contain business rules, so don't fetch them
        if (!sensimityKnownBeacon.get('is_geofence')) {
            return;
        }
        // Also refetch all existing business rules
        businessRuleService.fetchBusinessRules(sensimityKnownBeacon);
    });
}

// Get the beacons earlier retrieved from Sensimity
function getEarlierSavedKnownBeacons() {
    const library = baseSensimityService.createSensimityCollection('KnownBeacon');
    library.reset();
    library.fetch();
    return library;
}
