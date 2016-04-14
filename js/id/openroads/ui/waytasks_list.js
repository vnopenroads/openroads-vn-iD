iD.openroads.ui.WayTasksList = function(context) {
    var state,
        preset,
        id;

    function wayTasksList(selection) {

        // ----------------------------
        // Dev notes. (to remove)
        // ----------------------------
        // Tasks are fetched for every feature with:
        // - field or_responsibility
        // or
        // - tag or_responsibility = '*'
        // _.find(preset.fields, {key: 'or_responsibility'})
        //
        // If there are way tasks, show a loading indication, fetch the tasks
        // and show the list.
        //
        // This component is also rendered when a feature is hovered. To speed
        // up things, also fetch the data when hovering and cache it.
        //
        // A way can be selected through the the url by using id=w[wayid]
        // ----------------------------
        // Should tasks be shown?
        var wayid = parseInt(id.replace('w', ''));
        if (!_.find(preset.fields, {key: 'or_responsibility'}) && !preset.tags.or_responsibility || wayid < 0) {
            // No tasks. Do nothing.
            selection.style('display', 'none');
            return;
        }
        selection.style('display', null);

        var $title = selection.selectAll('.waytasks-title')
            .data([0]);

        $title.enter()
            .append('h3')
            .attr('class', 'waytasks-title')
            .text(t('waytasks.title'));

        // Trigger network request.
        context.waytasks().load(wayid, function(err, waytask) {
            if (!selection.empty()) {
                if (err) {
                    return renderContent(selection, {loadingState: 'errored'});
                }
                renderContent(selection, waytask);
            }
        });
    }

    function renderContent(selection, wayTask) {

        wayTask.tasks = wayTask.tasks || [];

        function taskStatus (d) {
            if (d.loadingState === 'loading') {
                return t('waytasks.loading');
            }
            else if (d.loading === 'errored') {
                return t('waytasks.error');
            }
            else if (d.state === 'pending') {
                return t('waytasks.in_review');
            }
            else if (!d.tasks.length) {
                return t('waytasks.empty');
            }
            else {
                return ''
            }
        }

        function isPending (d) {
            return d.state === 'pending';
        }

        var status = selection.selectAll('.waytasks-status')
            .data([wayTask]);

        status.text(taskStatus)
            .classed('waytasks-review', isPending);

        status.enter().append('p')
            .attr('class', 'waytasks-status')
            .classed('waytasks-review', isPending)
            .text(taskStatus);

        status.exit().remove();

        var tasks = selection.selectAll('.waytasks-list');

        if (tasks.empty()) {
            tasks = selection.append('ul')
                .attr('class', 'waytasks-list');
        }

        var task = tasks.selectAll('.waytasks-item')
            .data(wayTask.tasks);

        task.text(function (d) { return d.details; });

        task.enter().append('li')
            .attr('class', 'waytasks-item')
            .text(function (d) { return d.details; });

        task.exit().remove();

        if (wayTask.tasks.length) {
            tasks.style('display', null);
        }
        else {
            tasks.style('display', 'none');
        }
    }

    wayTasksList.state = function(_) {
        if (!arguments.length) return state;
        state = _;
        return wayTasksList;
    };

    wayTasksList.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        return wayTasksList;
    };

    wayTasksList.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        return wayTasksList;
    };

    // return d3.rebind(wayTasksList, event, 'on');
    return wayTasksList;
};
