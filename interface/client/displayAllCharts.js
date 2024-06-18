import { vegaConfig } from './config.js'
import vegaEmbed from 'vega-embed'
import { storeInteractionLogs } from './StoreLogs.js'

export function displayAllCharts(container, created = true) {
    $(container).empty();
    // console.log(app.sumview.charts)
    app.sumview.charts.forEach((ch) => {
        var vegachart = _.extend({}, ch.originalspec, {
            width: 470,
            height: 225,
            autosize: 'fit',
            datasets: { "data-2ad45d7d002e5134c7eb6f8a0ec71df4": app.data.chartdata.values}
        }, {
            config: vegaConfig
        });
        var $chartContainer = $('<div />', {
            class: 'chartdiv',
            id: 'chart' + ch.chid
        });
        // console.log(vegachart)
        // var $chartLabel = $('<span class="chartlabel"></span>').css('background-color', ch.created ? '#f1a340' : '#998ec3').html('#' + ch.chid);

        $(container).append($chartContainer);
        $chartContainer.append('<div class="chartcontainer"></div>');

        vegaEmbed('#chart' + ch.chid + ' .chartcontainer', vegachart, {
            actions: false
        });

        $chartContainer.hover((e) => {
            $chartContainer.css('border-color', 'crimson');
            app.sumview.highlight(ch.chid, true, false);
            storeInteractionLogs('hover on suggested chart', {encoding:ch.originalspec.encoding, mark:ch.originalspec.mark}, new Date())

        }, (e) => {
            $chartContainer.css('border-color', 'lightgray');
            app.sumview.highlight(ch.chid, false, false);
        }).click((e) => {
            app.sumview.selectedChartID = ch.chid;

            storeInteractionLogs('clicked on suggested chart', {encoding:ch.originalspec.encoding, mark:ch.originalspec.mark}, new Date())
        });

         // Create and append bookmark button
            var $bookmarkButton = $('<button>', {
                class: 'fas fa-bookmark'
            }).click(() => {

                console.log('Bookmarking chart ID:', ch.overallchid);
                storeInteractionLogs('bookmarked suggested chart', {encoding:ch.originalspec.encoding, mark:ch.originalspec.mark}, new Date())
                app.sumview._bookmarkedCharts.push(ch);
            });
            $chartContainer.append($bookmarkButton);

    });

}
