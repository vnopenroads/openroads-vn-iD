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
                loadingState: 'loading'
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
        // Connect
    };

    // exp.store = function() {
    //     context.storage('openroads.Tasks', JSON.stringify(loadedTasks));
    // };

    // exp.restore = function() {
    //     try {
    //         var storedData = JSON.parse(context.storage('openroads.Tasks'));
    //         _.forEach(loadedTasks, function(l) {
    //             var exist = _.find(storedData, { id: l.id });
    //             if (!exist) {
    //                 storedData.push(l);
    //             }
    //         });
    //         loadedTasks = storedData;
    //     } catch(e) {
    //         // Leave empty as default.
    //     }
    // };

    // exp.reset = function() {
    //     loadedTasks = [];
    //     context.storage('openroads.Tasks', null);
    // };

    // exp.complete = function(id, status) {
    //     console.log('complete', id, status);
    //     // Without arguments return all the completed tasks.
    //     if (arguments.length === 0) {
    //         return _.where(loadedTasks, {complete: true});
    //     }
    //     // With only the id return the completeness of the given task.
    //     var task = _.find(loadedTasks, { id: id });
    //     if (arguments.length === 1) {
    //         return task ? task.complete : null;
    //     }
    //     // With both arguments, set the status.
    //     if (task) {
    //         task.complete = status;
    //         return status;
    //     }

    //     return null;
    // };

    // exp.completeToggle = function(id) {
    //     return exp.complete(id, !exp.complete(id));
    // };

    // exp.get = function(id) {
    //     if (id) {
    //         var task = _.find(loadedTasks, { id: id });
    //         return task ? task : null;
    //     }
    //     return loadedTasks;
    // };


    return exp;
};
