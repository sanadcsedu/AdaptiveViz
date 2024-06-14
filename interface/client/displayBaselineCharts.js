import { vegaConfig } from './config.js'

export function displayBaselineCharts(container, created = true) {
    $(container).empty();
     app.sumview.baselineCharts.forEach((ch) => {
        var vegachart = _.extend({}, ch.originalspec,
            {width: 470, height: 225, autosize: 'fit', datasets: { "data-2ad45d7d002e5134c7eb6f8a0ec71df4": app.data.chartdata.values}} 
        ,
            {config: vegaConfig});
        var $chartContainer = $('<div />', {
            class: 'chartdiv',
            id: 'baseline' + ch.chid
        });

        $(container).append($chartContainer);
        $chartContainer.append('<div class="chartcontainer"></div>');
        
        import('vega-embed')
        .then(({ default: vegaEmbed }) => {
            vegaEmbed('#baseline' + ch.chid + ' .chartcontainer', vegachart, {
                actions: false
            });
        })
    });
}