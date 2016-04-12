iD.openroads.WayTasks = function(context) {
    var exp = {};
    var loadedTasks = [];

    exp.load = function(wayid, cb) {
        // Search to see 
        var waytask = exp.get(wayid);

        if (waytask) {
            return cb(null, waytask);
        }
        else {
            // Not found. Trigger load.
            // Create loading placeholder.
            var placeholder = {
                way_id: wayid,
                loadingState: 'loading',
                state: 'active'
            };
            loadedTasks.push(placeholder);

            console.log('network request initiated');
            qwest.get(context.connection().base() + '/way/' + wayid + '/waytasks')
                .then(function(response) {
                    return JSON.parse(response);
                })
                .then(function(json) {
                    // Set state as loaded.
                    json.loadingState = 'loaded';
                    var wayIndex = exp.getIndex(json.way_id);
                    if (wayIndex !== -1) {
                        loadedTasks[wayIndex] = json;
                    }
                    else {
                        loadedTasks.push(json);
                    }
                    return cb(null, json);
                })
                .catch(function(err) {
                    var wayIndex = exp.getIndex(wayid);
                    if (wayIndex !== -1) {
                        loadedTasks.splice(wayIndex, 1);
                    }
                    return cb(err);
                });

            return cb(null, placeholder);
        }
    };

    exp.getIndex = function(wayid) {
        for (var i = 0; i < loadedTasks.length; i++) {
            if (loadedTasks[i].way_id == wayid) {
                return i;
            }
        }
        return -1
    };

    exp.get = function(wayid) {
        return _.find(loadedTasks, {way_id: wayid});
    };

    exp.getModifiedWays = function() {
        var changedWays = [];
        _.forEach(context.history().difference().summary(), function(o) {
            if (o.changeType === 'modified' && o.entity.type === 'way') {
                var wid = parseInt(o.entity.id.replace('w', ''));
                changedWays.push(wid);
            }
        });
        return changedWays;
    };

    exp.submitModifiedWays = function(wayids) {
        // Mark the waytasks as "pending".
        // This is just client side, but since this data is removed when
        // the workers run, it's not a problem.
        _.forEach(wayids, function(wid) {
            exp.get(wid).state = 'pending';
        });

        qwest.put(context.connection().base() + '/admin/waytasks/state', {
            pending: wayids
        }, {
            dataType: 'json',
            responseType: 'json',
        }).then(function(response) {
            console.log('submitModifiedWays', response);
        }).catch(function(error) {
            console.error('submitModifiedWays', error);
        });
    };

    return exp;
};
