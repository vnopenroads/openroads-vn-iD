iD.openroads.ui.WayTasksList = function(context) {
    var state,
        preset,
        id;

    function wayTasksList(selection) {

        // ----------------------------
        // Dev notes. (to remove)
        // ----------------------------
        // An option was added to the preset (or-responsibility) indication
        // whether or not to fetch way tasks for this feature:
        // preset.wayTasks
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
        if (!preset.wayTasks || wayid < 0) {
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
            .text('Way tasks');

        // Trigger network request.
        context.waytasks().load(wayid, function(err, waytask) {
            if (!selection.empty()) {
                renderContent(selection, waytask);
            }
        });
    }

    function renderContent(selection, wayTask) {

        var $loading = selection.selectAll('.waytasks-loading')
            .data([0]);

        var $enter = $loading.enter();

        $enter.append('p')
            .attr('class', 'waytasks-loading')
            .style('display', 'none')
            .text('loading way tasks');

        $enter.append('p')
            .attr('class', 'waytasks-empty')
            .style('display', 'none')
            .text('All errors fixed!');


        if (wayTask.loadingState === 'loading') {
            selection.select('.waytasks-list').remove();
            selection.select('.waytasks-loading').style('display', null);
        }
        else {
            selection.select('.waytasks-loading').style('display', 'none');

            if (wayTask.tasks.length === 0) {
                selection.select('.waytasks-empty').style('display', null);
            }
            else {
                var $ul = selection.selectAll('.waytasks-list')
                    .data([0]);

                $ul.enter().append('ul')
                    .attr('class', 'waytasks-list');

                var $items = $ul.selectAll('li')
                    .data(wayTask.tasks);

                // Enter.
                $enter = $items.enter().append('li')
                    .attr('class', 'waytasks-item');

                // $enter.append('p')
                //     .attr('class', 'waytasks-type');
                $enter.append('p')
                    .attr('class', 'waytasks-description');

                // Update.
                // $items.select('.waytasks-type').text(function (d) { return d.type})
                $items.select('.waytasks-description').text(function (d) { return d.details})

                // Exit.
                $items.exit()
                    .remove();
            }
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
