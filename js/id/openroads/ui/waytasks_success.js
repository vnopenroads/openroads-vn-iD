iD.openroads.ui.WayTasksSuccess = function(context) {

    function wayTasksSuccess(selection) {
        selection.append('a')
            .attr('class', 'bttn bttn-dashboard')
            .text(t('waytasks.go_dashboards'));

        selection.append('button')
            .attr('class', 'bttn bttn-next')
            .text(t('waytasks.next_task'))
            .on('click', function() {
                // TODO:
                // - Figure out what's the next way.
                //
                var wayid = 13900
                context.connection().loadEntity('w' + wayid, function(err, entity) {
                    if (err) {
                        context.enter(iD.modes.Browse(context));
                        return;
                    }
                    context.map().zoomTo(entity);
                    context.enter(iD.modes.Select(context, [entity.id])
                        .suppressMenu(true));
                })
            });
    }

    return wayTasksSuccess;
};