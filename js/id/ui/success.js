iD.ui.Success = function(context) {
    var event = d3.dispatch('cancel'),
        changeset;

    function success(selection) {
        var message = (changeset.comment || t('success.edited_osm')).substring(0, 130) +
            ' ' + context.connection().changesetURL(changeset.id);

        var header = selection.append('div')
            .attr('class', 'header fillL');

        header.append('button')
            .attr('class', 'fr')
            .append('span')
            .attr('class', 'icon close')
            .on('click', function() { event.cancel(success); });

        header.append('h3')
            .text(t('success.just_edited'));
    }

    success.changeset = function(_) {
        if (!arguments.length) return changeset;
        changeset = _;
        return success;
    };

    return d3.rebind(success, event, 'on');
};
