import Alloy from 'alloy';
import {_} from 'alloy/underscore';
import Backbone from 'alloy/backbone';
/* jshint ignore:end */

let model, collection;

export const definition = {
    config: {
        columns: {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
            "UUID": "TEXT",
            "major": "INTEGER",
            "minor": "INTEGER",
            "rssi": "INTEGER",
            "accuracy": "INTEGER",
            "timestamp": "INTEGER"
        },
        adapter: {
            db_name: "sensimity",
            type: "sql",
            collection_name: "BeaconLog",
            idAttribute: "id"
        }
    },
    extendModel(Model) {
        _.extend(Model.prototype, {});

        return Model;
    },
    extendCollection(Collection) {
        _.extend(Collection.prototype, {
            // Extend, override or implement Backbone.Collection
            erase(args) {
                const self = this;

                const sql = `DELETE FROM ${self.config.adapter.collection_name}`, db = Ti.Database.open(self.config.adapter.db_name);
                db.execute(sql);
                db.close();

                self.fetch();
            }
        });

        return Collection;
    }
};

// Alloy compiles models automatically to this statement. In this case the models not exists in /app/models folder, so this must be fixed by set this statements manually.
model = Alloy.M("BeaconLog", exports.definition, []);
collection = Alloy.C("BeaconLog", exports.definition, model);
export {model as Model};
export {collection as Collection};
