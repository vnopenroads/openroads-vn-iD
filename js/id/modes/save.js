iD.modes.Save = function(context) {
    var ui = iD.ui.Commit(context)
        .on('cancel', cancel)
        .on('save', save);

    function cancel() {
        context.enter(iD.modes.Browse(context));
    }

    function save(e) {
        var loading = iD.ui.Loading(context)
            .message(t('save.uploading'))
            .blocking(true);

        context.container()
            .call(loading);

        // ---------------------------------------------------
        // What is going on here?
        //
        // To avoid continuously saving stuff the instruction was commented
        // out and replaced by a simulation with setTimeout.
        //
        // Left to do here is:
        // - get modified waysid -- context.waytasks().getModifiedWays()
        // - Save to the database using:
        // context.waytasks().submitModifiedWays() -> Not implemented.
        //
        // This save can be silent. If it works great, but if it fails it's
        // not a big deal, since when the worker runs task will be checked.
        // ---------------------------------------------------

        context.connection().putChangeset(
            context.history().changes(iD.actions.DiscardTags(context.history().difference())),
            e.comment,
            context.history().imageryUsed(),
            function(err, changeset_id) {
// setTimeout(function() {
// var err = false;
// var changeset_id = 1;
                var modifiedWays = context.waytasks().getModifiedWays();
                // This save is silent. If it works great, but if it fails it's
                // not a big deal, since when the worker runs task will be checked.
                context.waytasks().submitModifiedWays(modifiedWays);
                loading.close();
                if (err) {
                    var confirm = iD.ui.confirm(context.container());
                    confirm
                        .select('.modal-section.header')
                        .append('h3')
                        .text(t('save.error'));
                    confirm
                        .select('.modal-section.message-text')
                        .append('p')
                        .text(err.responseText || t('save.unknown_error_details'));
                } else {
                    context.flush();
                    success(e, changeset_id);
                }
 // }, 100);
            });
    }

    function success(e, changeset_id) {
        context.enter(iD.modes.Browse(context)
            .sidebar(iD.ui.Success(context)
                .changeset({
                    id: changeset_id,
                    comment: e.comment
                })
                .on('cancel', function(ui) {
                    context.ui().sidebar.hide(ui);
                })));
    }

    var mode = {
        id: 'save'
    };

    var behaviors = [
        iD.behavior.Hover(context),
        iD.behavior.Select(context),
        iD.behavior.Lasso(context),
        iD.modes.DragNode(context).behavior];

    mode.enter = function() {
        behaviors.forEach(function(behavior) {
            context.install(behavior);
        });

        context.connection().authenticate(function() {
            context.ui().sidebar.show(ui);
        });
    };

    mode.exit = function() {
        behaviors.forEach(function(behavior) {
            context.uninstall(behavior);
        });

        context.ui().sidebar.hide(ui);
    };

    return mode;
};
