import Alloy from 'alloy';
import {_} from 'alloy/underscore';
import Backbone from 'alloy/backbone';
/* jshint ignore:end */

/**
 * Public functions
 */

/**
 * Use an Model defined in the sensimity library
 * @param name The name of the model
 * @param args Arguments for creating a Backbone model
 */
function createSensimityModel(name, args) {
    switch (name) {
        case "BeaconLog":
            return new (require("./../models/BeaconLog").Model)(args);
        case "BeaconNotified":
            return new (require("./../models/BeaconNotified").Model)(args);
        case "BusinessRule":
            return new (require("./../models/BusinessRule").Model)(args);
        default:
            return new (require("./../models/KnownBeacon").Model)(args);
    }
}

/**
 * Use an Collection defined in the sensimity library
 * @param name The name of the model-collection
 * @param args Arguments for creating a Backbone collection
 */
function createSensimityCollection(name, args) {
    switch (name) {
        case "BeaconLog":
            return new (require("./../models/BeaconLog").Collection)(args);
        case "BeaconNotified":
            return new (require("./../models/BeaconNotified").Collection)(args);
        case "BusinessRule":
            return new (require("./../models/BusinessRule").Collection)(args);
        default:
            return new (require("./../models/KnownBeacon").Collection)(args);
    }
}

export default { createSensimityModel, createSensimityCollection };
