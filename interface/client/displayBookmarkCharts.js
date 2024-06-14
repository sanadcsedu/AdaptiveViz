import { vegaConfig } from './config.js'

var logging = true

export function displayBookmarkCharts(container, created = true) {
    $(container).empty();

      if (app.sumview.bookmarkedCharts.length === 0) {
        // Append a message indicating that there are no charts to display
        $(container).append('<h2> No Bookmarked Charts </h2>');
        return;
    }

     app.sumview.bookmarkedCharts.forEach((ch) => {
        var vegachart = _.extend({}, ch.originalspec,
            {width: 470, height: 225, autosize: 'fit', datasets: { "data-2ad45d7d002e5134c7eb6f8a0ec71df4": app.data.chartdata.values},
             },
            {config: vegaConfig});
        var $chartContainer = $('<div />', {
            class: 'chartdiv',
            id: 'bookchart' + ch.overallchid
        });

        $(container).append($chartContainer);
        $chartContainer.append('<div class="chartcontainer"></div>');
        
        import('vega-embed')
        .then(({ default: vegaEmbed }) => {
            vegaEmbed('#bookchart' + ch.overallchid + ' .chartcontainer', vegachart, {
                actions: false
            });
        })

        $chartContainer.hover((e) => {
            $chartContainer.css('border-color', 'crimson');
            app.sumview.highlight(ch.overallchid, true, true);
            if(logging) app.logger.push({time:Date.now(), action:'hoverbookmarkedchart', data:ch})
            import('./StoreLogs.js').then(module => {
                module.storeInteractionLogs('hover over bookmarked chart', {encoding:ch.originalspec.encoding, mark:ch.originalspec.mark}, new Date())
            })
        }, (e) => {
            $chartContainer.css('border-color', 'lightgray');
            app.sumview.highlight(ch.overallchid, false, true);
        }).click((e) => {
            app.sumview.bookmarkedselectedChartID = ch.overallchid;
            if(logging) app.logger.push({time:Date.now(), action:'clickbookmarkedchart', data:ch})
            import('./StoreLogs.js').then(module => {
                module.storeInteractionLogs('clicked bookmarked charts', {encoding:ch.originalspec.encoding, mark:ch.originalspec.mark}, new Date())
            })
        });
           // Create and append bookmark button
        var $removebookmarkButton = $('<button>', {
                class: 'fas fa-trash'
            }).click(() => {

            console.log('Removing bookmarked chart ID:', ch.overallchid);
            if(logging) app.logger.push({time:Date.now(), action:'removebookmarkedchart', data:ch})
            import('./StoreLogs.js').then(module => {
                module.storeInteractionLogs('removed bookmarked charts', {encoding:ch.originalspec.encoding, mark:ch.originalspec.mark}, new Date())
            })
            const index = app.sumview._bookmarkedCharts.indexOf(ch);
            if (index > -1) { // only splice array when item is found
              app.sumview._bookmarkedCharts.splice(index, 1); // 2nd parameter means remove one item only
            }
            displayBookmarkCharts('#bookmarkview', true)
        });
        $chartContainer.append($removebookmarkButton);

    });
}
