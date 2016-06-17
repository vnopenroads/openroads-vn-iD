iD.ui.MapOverlay = function(context) {
    var key = 'F',
        admin = ['province', 'municipality', 'barangay'],
        destination = ['mpa'],
        roadNetwork = ['openroads'],
        layerControls = context.container().select('.layer-controls'),
        mapControls = context.container().select('.map-controls');

    var background = context.background()
        .sources(context.map().extent());

    var gridSource = background.find(function (d) {
        return d.id === 'grid';
    });

    var roadSource = background.filter(function (d) {
        return d.id === 'ornetwork';
    });

    var municipalSource = background.find(function (d) {
        return d.id === 'municipality';
    });

    var projectSources = background.filter(function (d) {
        return d.type === 'wmts';
    });

    function map_overlay(selection) {

        function toggleOverlay(d) {
            d3.event.preventDefault();
            context.background().toggleOverlayLayer(d);
        }

        function getToggleSource(source) {
            return function () {
                return toggleOverlay(source);
            };
        }

        function activeOverlay(d) {
            return context.background().showsLayer(d);
        }

        function getActiveSource(source) {
            return function () {
                return activeOverlay(source);
            };
        }

        function drawList(selection, data, type, name, change, active, text) {
            var items = selection.selectAll('li')
                .data(data);

            //enter
            var enter = items.enter()
                .append('li')
                .attr('class', 'overlay')

            var label = enter.append('label');

            label.append('input')
                .attr('type', type)
                .attr('name', name)
                .on('change', change);

            label.append('span')
            .text(text);

            //update
            items
                .classed('active', active)
                .selectAll('input')
                .property('checked', active);

            //exit
            items.exit()
                .remove();
        }

        function description (name) {
            return function (d) {
                return t(name + '.' + d + '.description');
            }
        }

        function update() {
            networkList.call(drawList,
                roadSource,
                'checkbox',
                'road_network',
                toggleOverlay,
                activeOverlay,
                function (d) { return d.description; });

            projectList.call(drawList,
                projectSources,
                'checkbox',
                'project',
                toggleOverlay,
                activeOverlay,
                function (d) { return d.description; });

            governmentList.call(drawList,
                admin.slice(1, 2),
                'checkbox',
                'admin_level',
                getToggleSource(municipalSource),
                getActiveSource(municipalSource),
                description('admin_level'));

            destinationList.call(drawList,
                destination,
                'checkbox',
                'destination',
                function () {},
                function () {},
                description('destination'));

            content.select('.toggle-switch input')
                .property('checked', context.background().showsLayer(gridSource));
        }

        function hidePanel() { setVisible(false); }

        function togglePanel() {
            if (d3.event) d3.event.preventDefault();
            tooltip.hide(button);
            setVisible(!button.classed('active'));
        }

        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                shown = show;

                if (show) {
                    selection.on('mousedown.map_data-inside', function() {
                        return d3.event.stopPropagation();
                    });
                    layerControls.style('right', '0px')
                        .transition()
                        .duration(200)
                        .style('right', '250px');
                    mapControls.style('right', '48px')
                        .transition()
                        .duration(200)
                        .style('right', '298px');
                    content.style('display', 'block')
                        .style('right', '-250px')
                        .transition()
                        .duration(200)
                        .style('right', '0px');
                } else {
                    layerControls.style('right', '250px')
                        .transition()
                        .duration(200)
                        .style('right', '0');
                    mapControls.style('right', '298px')
                        .transition()
                        .duration(200)
                        .style('right', '48px');
                    content.style('display', 'block')
                        .style('right', '0px')
                        .transition()
                        .duration(200)
                        .style('right', '-250px')
                        .each('end', function() {
                            d3.select(this).style('display', 'none');
                        });
                    selection.on('mousedown.map_data-inside', null);
                }
            }
        }

        function toggleDropdown(container) {
            return function () {
                var exp = d3.select(this).classed('expanded');
                container.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
            }
        }

        var content = selection.append('div')
                .attr('class', 'fillOR2 map-overlay content hide')
                .style('width', '250px'),
            tooltip = bootstrap.tooltip()
                .placement('left')
                .html(true)
                .title(iD.ui.tooltipHtml(t('map_overlay.description'), key)),
            button = selection.append('button')
                .attr('tabindex', -1)
                .on('click', togglePanel)
                .call(tooltip),
            shown = false;

        button.append('span')
            .attr('class', 'mapicon');

        content.append('h3')
            .text(t('map_overlay.title'));

        // road networks
        var roadToggle = content.append('a')
            .text(t('map_overlay.road_network'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', true);

        var roadNetworkContainer = content.append('div')
            .attr('class', 'filters')
            .style('display', 'block');

        var networkList = roadNetworkContainer.append('ul')
            .attr('class', 'overlay-list');

        roadToggle.on('click', toggleDropdown(roadNetworkContainer));

        // projects
        var projectToggle = content.append('a')
            .text(t('map_overlay.projects'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', true);

        var projectContainer = content.append('div')
            .attr('class', 'filters');

        var projectList = projectContainer.append('ul')
            .attr('class', 'overlay-list');

        projectToggle.on('click', toggleDropdown(projectContainer));

        // government layers
        var governmentToggle = content.append('a')
            .text(t('map_overlay.government'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', true);

        var governmentFeatures = content.append('div')
            .attr('class', 'filters');

        var governmentList = governmentFeatures.append('ul')
            .attr('class', 'overlay-list');

        governmentToggle.on('click', toggleDropdown(governmentFeatures));

        var destinationToggle = content.append('a')
            .text(t('map_overlay.destination'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', true);

        var destinationContainer = content.append('div')
            .attr('class', 'filters');

        var destinationList = destinationContainer.append('ul')
            .attr('class', 'overlay-list');

        destinationToggle.on('click', toggleDropdown(destinationContainer));

        if (gridSource) {
            content.append('span')
                .text(t('map_overlay.grid'));

            var toggleSwitch = content.append('div')
                .attr('class', 'toggle-switch')
                .datum(gridSource)

            toggleSwitch.append('input')
                .attr('id', 'grid-toggle')
                .attr('type', 'checkbox')
                .on('change', toggleOverlay);

            toggleSwitch.append('label')
                .attr('for', 'grid-toggle');

            context.features()
                .on('change.map_overlays-update', update);
        }

        update();

        var keybinding = d3.keybinding('features')
            .on(key, togglePanel)
            .on('B', hidePanel)
            .on('H', hidePanel);

        d3.select(document)
            .call(keybinding);

        context.surface().on('mousedown.map_data-outside', hidePanel);
        context.container().on('mousedown.map_data-outside', hidePanel);
    }

    return map_overlay;
};
