import Alloy from 'alloy';
import {_} from 'alloy/underscore';
import Backbone from 'alloy/backbone';
import businessRuleService from './../service/businessRule';
import knownBeaconService from './../service/knownBeacons';

// Found beacons is used to handle the moving towards and moving away from business rules
let foundBeacons;

const typeOfAvailableBusinessRules = { // Types of available Business rules
    far: 'far',
    close: 'close',
    immediate: 'immediate',
    movingTowards: 'moving_towards',
    movingAwayFrom: 'moving_away_from'
};

const proximities = {
    far: 'far',
    close: 'near',
    immediate: 'immediate'
};

/**
 * Public functions
 */

/*****
 * Initialize the handler and set the notify and knownbeaconservice
 */
function init() {
    foundBeacons = [];
}

/****
 * This function must be called when the beaconscanner founds a beacon. It checks beacon exists in the system and search for the appropiate business rule(s).
 * @param mappedBeacon Mapped beacon is a found beacon in the base scanner
 */
function handle(mappedBeacon) {
    const knownBeacon = knownBeaconService.findKnownBeacon(mappedBeacon.UUID, mappedBeacon.major, mappedBeacon.minor);
    // If beacon = unknown, do nothing
    if (_.isEmpty(knownBeacon)) {

    }

    // Trigger a 'beacon found' event
    handleBeacon(mappedBeacon, knownBeacon);

    // Find appropiate business rules
    const businessRules = businessRuleService.getBusinessRules(knownBeacon);

    // Handle every businessrule
    businessRules.forEach(businessRule => {
        handleBusinessRule(businessRule, mappedBeacon, knownBeacon);
    });

    // add found beacon with proximity and beacon_id
    addFoundBeacon(mappedBeacon.proximity, knownBeacon.get('beacon_id'));
}

export default { init, handle };


/**
 * Private functions
 */

/****
 * Handle and checks beaconproximity and businessrule are the same. If businessrule is active, trigger the dispatcher to use this businessrule in the app
 * @param businessRule
 * @param beacon found Beacon in basescanner
 * @param knownBeacon knownBeacon from local database
 */
function handleBusinessRule(businessRule, beacon, knownBeacon) {
    const businessRuleType = businessRule.get('type');
    const businessRuleTriggerItem = {
        beacon,
        businessRule: businessRule.toJSON(),
        knownBeacon: knownBeacon.toJSON()
    };

    if (businessRuleType === typeOfAvailableBusinessRules.far && beacon.proximity === proximities.far) {
        Alloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }

    if (businessRuleType === typeOfAvailableBusinessRules.close && beacon.proximity === proximities.close) {
        Alloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }

    if (businessRuleType === typeOfAvailableBusinessRules.immediate && beacon.proximity === proximities.immediate) {
        Alloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }

    if (businessRuleType === typeOfAvailableBusinessRules.movingTowards && checkMovingTowards(beacon.proximity, knownBeacon.get('beacon_id'))) {
        Alloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }

    if (businessRuleType === typeOfAvailableBusinessRules.movingAwayFrom && checkMovingAwayFrom(beacon.proximity, knownBeacon.get('beacon_id'))) {
        Alloy.Globals.sensimityEvent.trigger('sensimity:businessrule', businessRuleTriggerItem);
        Ti.App.fireEvent('sensimity:businessrule', businessRuleTriggerItem);
    }
}

/**
 * Handle a beacon if no businessrule is set for current
 * @param beacon
 * @param knownBeacon
 */
function handleBeacon(beacon, knownBeacon) {
    const eventItem = {
        beacon,
        knownBeacon: knownBeacon.toJSON()
    };
    Alloy.Globals.sensimityEvent.trigger('sensimity:beacon', eventItem);
    Ti.App.fireEvent('sensimity:beacon', eventItem);
}

/**
 * Add a found beacon to check moving towards or moving away from
 * @param proximity proximity value to check compare the distance
 * @param beaconId beacon identifier
 */
function addFoundBeacon(proximity, beaconId) {
    foundBeacons = _.without(foundBeacons, _.findWhere(foundBeacons, {
        beaconId
    }));
    foundBeacons.push({
        beaconId,
        proximity
    });
}

// Check the proximity of previous beacon has more distance than the new proximity
function checkMovingTowards(proximity, beaconId) {
    const lastFoundBeacon = _.findWhere(foundBeacons, {
        beaconId,
        proximity: proximities.close
    });
    return !_.isEmpty(lastFoundBeacon) && proximity === proximities.close || proximity === proximities.immediate;
}

// Check the proximity of previous beacon has less distance than the new proximity
function checkMovingAwayFrom(proximity, beaconId) {
    const lastFoundImmediateBeacon = _.findWhere(foundBeacons, {
        beaconId,
        proximity: proximities.close
    });
    const lastFoundNearBeacon = _.findWhere(foundBeacons, {
        beaconId,
        proximity: proximities.immediate
    });
    return (!_.isEmpty(lastFoundNearBeacon) || !_.isEmpty(lastFoundImmediateBeacon)) && proximity === proximities.far;
}
