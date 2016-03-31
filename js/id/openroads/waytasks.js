iD.openroads.WayTasks = function(context) {
    var exp = {};
    var loadedTasks = [];

    exp.load = function(wayid, cb) {
        // Search to see 
        var waytask = exp.get(wayid);

        // Not found. Trigger load.
        if (!waytask) {
            console.log('network request initiated');
            setTimeout(function() {
                var temp = {
                    "way_id": wayid,
                    loadingState: 'loaded',
                    "tasks": [
                        {
                            "type": "missing-prop",
                            "details": "Some properties are missing: surface, or_condition"
                        },
                        {
                            "type": "some-other-type",
                            "details": "Details on this other issue with road 5"
                        }
                    ]
                };
                var wayIndex = exp.getIndex(temp.way_id);
                if (wayIndex !== -1) {
                    loadedTasks[wayIndex] = temp; 
                }
                else {
                    loadedTasks.push(temp); 
                }
                return cb(null, temp);
            }, 5000);
            // Create loading placeholder.
            var p = {
                way_id: wayid,
                loadingState: 'loading'
            };
            loadedTasks.push(p);
            return cb(null, p);
        }
        else {
            return cb(null, waytask);
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
