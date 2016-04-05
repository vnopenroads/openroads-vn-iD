iD.ui.Notice = function(context) {
    return function(selection) {
        var div = selection.append('div')
            .attr('class', 'notice');

        var button = div.append('button')
            .attr('class', 'zoom-to notice')
            .on('click', function() { context.map().zoom(context.minEditableZoom()); });

        button.append('span')
            .attr('class', 'icon zoom-in-invert');

        button.append('span')
            .attr('class', 'label')
            .text(t('zoom_in_edit'));

        function disableTooHigh() {
            div.style('display', context.editable() ? 'none' : 'block');
        }

        context.map()
            .on('move.notice', _.debounce(disableTooHigh, 500));

        disableTooHigh();
    };
};

iD.ui.NoticeSelect = function(context) {
    var container;

    function noticeSelect(selection) {
        container = selection.append('div')
            .attr('class', 'notice');

        container.append('p')
            .attr('class', 'notice notice--select-feature')
            .text(t('select_feature_edit'));

        function disableTooHigh() {
            container.style('display', context.editable() ? 'block' : 'none');
        }

        context.map()
            .on('move.notice-select', _.debounce(disableTooHigh, 500));

        disableTooHigh();
    };

    noticeSelect.show = function() {
        container.style('display', context.editable() ? 'block' : 'none');
    }

    noticeSelect.hide = function() {
        container.style('display', 'none');
    }

    return noticeSelect;
};
