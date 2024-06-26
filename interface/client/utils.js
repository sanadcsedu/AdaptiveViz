/*************************************************************************
 * Copyright (c) 2018 Jian Zhao
 *
 *************************************************************************
 *
 * @author
 * Jian Zhao <zhao@fxpal.com>
 *
 *************************************************************************/

 // external libs'
 import vegaEmbed from 'vega-embed'
 import SumView from './sumview.js'
 import ChartView from './chartview.js'

 var logging = true
 var interactionLogs = [];
 var fieldsArray = [];
 var attributesHistory = [];
 var bookmarkedCharts = [];
 var user_session_id = 'user1';
 export var vegaConfig = {
     axis: {labelFontSize:9, titleFontSize:9, labelAngle:-45, labelLimit:50},
     legend: {gradientLength:20, labelFontSize:6, titleFontSize:6, clipHeight:20}
 }



 export function createDataTable(scrollH) {
     var columns = _.keys(app.data.chartdata.values[0]).map((d) => {return {title: d} })
     var tabledata = app.data.chartdata.values.map((d) => {
         var record = []
         for(var i = 0; i < columns.length; i++)
             record.push(d[columns[i].title])
         return record
     })

     if(app.datatable) {
         app.datatable.destroy()
         $('#dataview table').empty()
     }
     app.datatable = $('#dataview table').DataTable({
         columnDefs: [
             {
                 targets: '_all',
                 render: function(data, type, row, meta) {
                     return '<span style="color:'
                         + app.sumview._varclr(columns[meta.col].title) + '">' + data + '</span>'
                 }
             }
         ],
         data: tabledata,
         columns: columns,
         scrollY: scrollH,
         scrollX: true,
         paging: false,
         scrollCollapse: true,
         searching: false,
         info: false
     })

     columns.forEach((c) => {
         $('#legend').append('/<span class="legend-item" style="color:' + app.sumview._varclr(c.title) + '">' + c.title + '</span>')
     })

     // call backend to start session
        $.ajax({
            type: 'GET',
            crossDomain: true,
            url: 'http://localhost:5500/',
            contentType: 'application/json'
        }).done((data) => {
            user_session_id=data['session_id'];
            //log session id
            console.log("Session ID: ", user_session_id);
            storeInteractionLogs('study begins', user_session_id, new Date())
        }).fail((xhr, status, error) => {
            alert('Cannot start session.');
        });
 }

export function displayBookmarkCharts(container, created = true) {
    $(container).empty();

      if (app.sumview.bookmarkedCharts.length === 0) {
        // Append a message indicating that there are no charts to display
        $(container).append('<h2> No Bookmarked Charts </h2>');
        return;
    }

     app.sumview.bookmarkedCharts.forEach((ch) => {
        var vegachart = _.extend({}, ch.originalspec,
            {width: 470, height: 225, autosize: 'fit'},
            // { data: {values: app.data.chartdata.values} },
            {config: vegaConfig});
        var $chartContainer = $('<div />', {
            class: 'chartdiv',
            id: 'bookchart' + ch.overallchid
        });

        $(container).append($chartContainer);
        $chartContainer.append('<div class="chartcontainer"></div>');

        vegaEmbed('#bookchart' + ch.overallchid + ' .chartcontainer', vegachart, {
            actions: false
        });

        $chartContainer.hover((e) => {
            $chartContainer.css('border-color', 'crimson');
            app.sumview.highlight(ch.overallchid, true, true);
            if(logging) app.logger.push({time:Date.now(), action:'hoverbookmarkedchart', data:ch})
            storeInteractionLogs('hover over bookmarked chart', {encoding:ch.originalspec.encoding, mark:ch.originalspec.mark}, new Date())
        }, (e) => {
            $chartContainer.css('border-color', 'lightgray');
            app.sumview.highlight(ch.overallchid, false, true);
        }).click((e) => {
            app.sumview.bookmarkedselectedChartID = ch.overallchid;
            if(logging) app.logger.push({time:Date.now(), action:'clickbookmarkedchart', data:ch})
            storeInteractionLogs('clicked bookmarked charts', {encoding:ch.originalspec.encoding, mark:ch.originalspec.mark}, new Date())
        });
           // Create and append bookmark button
        var $removebookmarkButton = $('<button>', {
                class: 'fas fa-trash'
            }).click(() => {

            console.log('Removing bookmarked chart ID:', ch.overallchid);
            if(logging) app.logger.push({time:Date.now(), action:'removebookmarkedchart', data:ch})
            storeInteractionLogs('removed bookmarked charts', {encoding:ch.originalspec.encoding, mark:ch.originalspec.mark}, new Date())
            const index = app.sumview._bookmarkedCharts.indexOf(ch);
            if (index > -1) { // only splice array when item is found
              app.sumview._bookmarkedCharts.splice(index, 1); // 2nd parameter means remove one item only
            }
            displayBookmarkCharts('#bookmarkview', true)
        });
        $chartContainer.append($removebookmarkButton);

    });
}

 export function displayAllCharts(container, created = true) {
    $(container).empty();
    app.sumview.charts.forEach((ch) => {
        var vegachart = _.extend({}, ch.originalspec, {
            width: 470,
            height: 225,
            autosize: 'fit'
        }, {
            config: vegaConfig
        });
        var $chartContainer = $('<div />', {
            class: 'chartdiv',
            id: 'chart' + ch.chid
        });
        var $chartLabel = $('<span class="chartlabel"></span>').css('background-color', ch.created ? '#f1a340' : '#998ec3').html('#' + ch.chid);

        $(container).append($chartContainer);
        $chartContainer.append('<div class="chartcontainer"></div>', $chartLabel);

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


export function displayBaselineCharts(container, created = true) {
    $(container).empty();


     app.sumview.baselineCharts.forEach((ch) => {
        var vegachart = _.extend({}, ch.originalspec,
            {width: 470, height: 225, autosize: 'fit'},
            // { data: {values: app.data.chartdata.values} },
            {config: vegaConfig});
        var $chartContainer = $('<div />', {
            class: 'chartdiv',
            id: 'baseline' + ch.chid
        });

        $(container).append($chartContainer);
        $chartContainer.append('<div class="chartcontainer"></div>');

        vegaEmbed('#baseline' + ch.chid + ' .chartcontainer', vegachart, {
            actions: false
        });
    });
}



 export function handleEvents() {
     app.sumview.on('clickchart', (ch) => {
        //  console.log(ch.originalspec)
         app.chartview.update(ch.originalspec, 'outside')


         //logger


         // Parse JSON string into a JavaScript object
         var visualizationConfigClick = ch.originalspec.encoding;

        // Array to store extracted fields

         const shapeField = visualizationConfigClick.shape?.field !== undefined ? visualizationConfigClick.shape.field : null;
         const sizeField = visualizationConfigClick.size?.field !== undefined ? visualizationConfigClick.size.field : null;
         const xField = visualizationConfigClick.x?.field !== undefined ? visualizationConfigClick.x.field : null;
         const yField = visualizationConfigClick.y?.field !== undefined ? visualizationConfigClick.y.field : null;
         const colorField = visualizationConfigClick.color?.field !== undefined ? visualizationConfigClick.color.field : null;
        // Check if colorField, xField, and yField exist
        fieldsArray = [colorField, xField, yField, shapeField,sizeField].filter(field => field !== null && field !== undefined);
        attributesHistory.push(fieldsArray);

        // Log extracted fields array


         $('#chartview .chartlabel').css('background-color', ch.created ? '#f1a340' : '#998ec3')
         $('#chartview .chartlabel').html('#' + ch.chid)
         if(ch.created) {
             $('#update, #remove').attr('disabled', true)
         }
         else {
             $('#update, #remove').attr('disabled', false)
         }

         if(logging) app.logger.push({time:Date.now(), action:'clickchart', data:ch.originalspec})
     })
     .on('mouseoverchart', (ch) => {
         if(logging) app.logger.push({time:Date.now(), action:'mouseoverchart', data:ch})
         var vegachart = _.extend({}, ch.originalspec,
             { width: 390, height: 190, autosize: 'fit' },
             { data: {values: app.data.chartdata.values} },
             { config: vegaConfig})
         vegaEmbed('#tooltip .chartcontainer', vegachart, {actions: false})

         $('#tooltip .chartlabel').css('background-color', ch.created ? '#f1a340' : '#998ec3')
         $('#tooltip .chartlabel').html('#' + ch.chid)
     })
     .on('recommendchart', () => {
         displayAllCharts('#suggestionview', true)
         displayBaselineCharts('#suggestionview2', true)
         displayBookmarkCharts('#bookmarkview', true)
         if(logging) app.logger.push({time:Date.now(), action:'recommendchart'})

     })

     app.chartview.on('similar', (spec) => {
         if(logging) app.logger.push({time:Date.now(), action:'recommendchart', data:spec})
         storeInteractionLogs('requested chart recommendation', {encoding:spec.encoding, mark:spec.mark}, new Date())

         if(app.sumview.data.chartspecs.length > 0)
            spec._meta = {chid: app.sumview.data.chartspecs[app.sumview.data.chartspecs.length - 1]._meta.chid + 1, uid: 0}
        else
            spec._meta = {chid:0, uid:0}
        app.sumview.data.chartspecs.push(spec) //this holds all the charts that make it to the CenterView



        //displayAllCharts('#allchartsview', false)
        $('#suggestionview').empty()
        //displayAllCharts('#suggestionview', false)


      // Parse JSON string into a JavaScript object
         const visualizationConfig = spec.encoding;

         const shapeField = visualizationConfig.shape?.field !== undefined ? visualizationConfig.shape.field : null;
         const sizeField = visualizationConfig.size?.field !== undefined ? visualizationConfig.size.field : null;
         const xField = visualizationConfig.x?.field !== undefined ? visualizationConfig.x.field : null;
         const yField = visualizationConfig.y?.field !== undefined ? visualizationConfig.y.field : null;
         const colorField = visualizationConfig.color?.field !== undefined ? visualizationConfig.color.field : null;
        // Check if colorField, xField, and yField exist
        // Remove null or undefined values from fieldsArray
        fieldsArray = [colorField, xField, yField, shapeField,sizeField].filter(field => field !== null && field !== undefined);
        // attributesHistory.push(fieldsArray);



        // Log extracted fields array
        //  console.log("Fields array:", fieldsArray);
         app.sumview.update(() => {app.sumview.selectedChartID = spec._meta.chid }, attributesHistory)
         //app.sumview.update(()=> {app.sumview.selectedChartID = spec._meta.chid }, fieldsArray)

         //$('#suggestionview').empty()
         displayAllCharts('#suggestionview', true)
         displayBookmarkCharts('#bookmarkview', true)

         if(logging) app.logger.push({time:Date.now(), action:'addchart', data:spec})
     })

     app.chartview.on('update-chart', (spec) => {
         spec._meta = app.sumview.data.chartspecs[app.sumview.selectedChartID]._meta
         app.sumview.data.chartspecs[app.sumview.selectedChartID] = spec

         app.sumview.update(() => {app.sumview.selectedChartID = spec._meta.chid })
         displayAllCharts('#allchartsview', false)
         $('#suggestionview').empty()

         if(logging) app.logger.push({time:Date.now(), action:'updatechart', data:spec})
     })

    //  app.chartview.on('remove-chart', (spec) => {
    //      app.sumview.data.chartspecs = app.sumview.data.chartspecs.filter((d) => { return d._meta.chid != app.sumview.selectedChartID })
    //      app.sumview.update()
    //      displayAllCharts('#allchartsview', false)
    //      $('#suggestionview').empty()

    //      if(logging) app.logger.push({time:Date.now(), action:'removechart', data:spec})
    //  })

     $('#import').click(() => {
         $('#dialog').css('display', 'block')
     })

     $('.close').click(() => {
         $('#dialog').css('display', 'none')
     })


     // If the user has clicked on the previous charts from the past users then
     // we are getting the state of the clicked chart
     $('#allchartsview').click(() => {
         console.log("A chart has been clicked in Chart View")
         if(logging) app.logger.push({time:Date.now(), action:'clickchart', data:app.chartview._cheditor.session.getValue()})
         var specs = app.chartview._cheditor.session.getValue()
         //geting the vegalite encoding of the clicked chart
         //sending it to encode2 in modelserver.py to get the one-hot vector (state)
         $.ajax({
             type: 'POST',
             crossDomain: true,
             url: 'http://localhost:5500/encode2',
             data: JSON.stringify(specs),
             contentType: 'application/json'
         }).done((data) => {
             console.log(data)
         })
     })

     // If the user has clicked on a recommended chart
     $('#suggestionview').click(() => {
         console.log("A chart has been clicked in Suggestion")
         var specs = app.chartview._cheditor.session.getValue()
         if(logging) app.logger.push({time:Date.now(), action:'clickchart-suggestionview', data:specs})
         storeInteractionLogs('clicked on suggested chart', {encoding:JSON.parse(specs).encoding, mark:JSON.parse(specs).mark}, new Date())
         $.ajax({
             type: 'POST',
             crossDomain: true,
             url: 'http://localhost:5500/encode2',
             data: JSON.stringify(specs),
             contentType: 'application/json'
         }).done((data) => {

         })
     })



     $('#submit').click(() => {
         if($('#inputfile').val()) {
             var reader = new FileReader();
             reader.onload = function(e) {
                 var d = JSON.parse(reader.result);
                 updateData(d, $('#inputfile').val())
             };

             reader.readAsText(document.getElementById('inputfile').files[0]);
         }
         else if($('#inputurl').val()) {
             $.get($('#inputurl').val()).done((d) => {
                 updateData(d, $('#inputurl').val())
             })
         }

         $('.close').click()
         if(logging) app.logger.push({time:Date.now(), action:'submitdata'})
     })

     // ########################################################## SAVE INTERACTION DATA ########################################################
     // this is the End Session button
    $('#export').click(() => {
         let savepath='ShiftScopeLogs/'+user_session_id;
         let datacharts_name = savepath + '/datacharts.json';
            let interactionlogs_name = savepath + '/interactionlogs.json';

         download(JSON.stringify({
                 charts: app.sumview.data.chartspecs,
                 attributes: app.sumview.data.chartdata.attributes,
                 data: app.sumview.data.chartdata.values,
                 bookmarked_charts: app.sumview.bookmarkedCharts
             }, null, '  '), datacharts_name, 'text/json')
         if(logging) download(JSON.stringify(app.logger, null, '  '), interactionlogs_name, 'text/json')

        // Redirect to the post-task-survey.html page
        window.location.href = `${window.location.href}post-task-survey`;
     })

      function download(content, fileName, contentType) {
     //save to sepcific folder ShiftScopeLogs/session_id
     let savepath='ShiftScopeLogs/'+user_session_id;
     var a = document.createElement("a");
     var file = new Blob([content], {type: contentType});
     a.href = URL.createObjectURL(file);
     a.download = fileName;
     a.click();
 }

 // ########################################################## SAVE INTERACTION DATA ########################################################

     $('#performaceViewOpen').click(() => {
            console.log("User requested Performance View")

            openNav()


     })

     $('#performaceViewClose').click(() => {
            console.log("User requested Performance View to be closed")
            closeNav()
     })

     $('#bookmarkViewOpen').click(() => {
            console.log("User requested Bookmark View")
            openBookmark()

     })

     $('#bookmarkViewClose').click(() => {
            console.log("User requested Bookmark View to be closed")
            closeBookmark()
     })

     $('#baselineViewOpen').click(() => {
            console.log("User requested Baseline View")
         storeInteractionLogs('requested baseline charts', "", new Date())
            openBaseline()

     })

     $('#baselineViewClose').click(() => {
            storeInteractionLogs('closed baseline charts', "", new Date())
            closeBaseline()
     })




     $(window).resize(() => {
         app.sumview.svgsize = [$('#sumview').width(), $('#sumview').height()]
     })




 }

 export function parseurl() {
     var parameters = {}
     var urlquery = location.search.substring(1)
     if(urlquery) {
         urlquery.split("&").forEach(function(part) {
             var item = part.split("=")
             parameters[item[0]] = decodeURIComponent(item[1])
             if(parameters[item[0]].indexOf(",") != -1)
                 parameters[item[0]] = parameters[item[0]].split(",")
         })
     }

     return parameters
 }

 export function updateData(data, name) {
     $("#datafile").html(name)

     app.data = {}
     app.data.chartdata = {attributes: data.attributes, values: data.data}
     app.data.chartspecs = data.charts

     app.sumview = new SumView(d3.select('#sumview'), app.data, {
         backend: 'http://127.0.0.1:5500',
         size: [$('#sumview').width(), $('#sumview').height()],
         margin: 10,
         chartclr: ['#f1a340', '#998ec3']
     })
     app.sumview.update()

     app.chartview = new ChartView({}, {
         attributes: app.data.chartdata.attributes,
         datavalues: app.data.chartdata.values,
         vegaconfig: vegaConfig
     })

     createDataTable(280)
     displayAllCharts('#allchartsview', true)
     displayAllCharts('#suggestionview', true)
     displayBaselineCharts('#suggestionview2', true)
         displayBookmarkCharts('#bookmarkview', true)

     // events handling
     handleEvents()
 }



 export default {vegaConfig, handleEvents, parseurl, createDataTable, displayAllCharts, updateData}

export function storeInteractionLogs(interaction, value, time) {
     console.log({ Interaction: interaction, Value: value, Time: time.getTime() });
  interactionLogs.push({
    Interaction: interaction,
    Value: value,
    Time: time.getTime(),
  });
}

//###################################################### Performance View ########################################################



// Declare global variables for charts
var baselineCharts = {};
var accuracyCharts = {};


function openNav() {
    $.ajax({
        type: 'GET',
        crossDomain: true,
        url: 'http://localhost:5500' + '/get-performance-data',
        contentType: 'application/json'
    }).done((full_data) => {
        storeInteractionLogs('Open Performance View', full_data, new Date())
        var data = full_data['distribution_response'];

        // console.log(data)
        // Create baseline charts
        createBaselineChart("UserChart", data['distribution_map'], "Probability", "rgba(54, 160, 235, 0.2)", "rgba(42, 160, 235, 1)");
        createBaselineChart("RLChart", data['baselines_distribution_maps']['RL'], "Probability", "rgba(54, 160, 235, 0.2)", "rgba(42, 160, 235, 1)");
        createBaselineChart("RandombaselineChart", data['baselines_distribution_maps']['Random'], "Probability", "rgba(255, 99, 132, 0.2)", "rgba(255, 99, 132, 1)");
        createBaselineChart("MomentumbaselineChart", data['baselines_distribution_maps']['Momentum'], "Probability", "rgba(220, 90, 132, 0.2)", "rgba(220, 90, 132, 1)");
        // createAccuracyChart('accuracyChart', full_data, updateTimeSeriesChart);
        try {
            createShiftFocusChart(full_data);
        } catch (error) {
            console.warn('Failed to create accuracy chart:', error);
            alert('Not enough interactions to derive Performance View. Please try again later.');
        }
        document.getElementById("myNav").style.width = "100%";
    }).fail((xhr, status, error) => {
        alert('Cannot Derive Performance View. Please Try Again Later');
    });
}



function createBaselineChart(id, data, label, backgroundColor, borderColor) {
    var fieldNames = Object.keys(data);
    var probabilities = Object.values(data);


    var baselineChart = new Chart(id, {
        type: "bar",
        data: {
            labels: fieldNames,
            datasets: [{
                label: label,
                data: probabilities,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });

    baselineCharts[id] = baselineChart;
}



/* Close when someone clicks on the "x" symbol inside the overlay */
function closeNav() {
      // Loop through baselineCharts and destroy each chart
    Object.keys(baselineCharts).forEach(function(key) {
        baselineCharts[key].destroy();
    });
    // Loop through accuracyCharts and destroy each chart
    Object.keys(accuracyCharts).forEach(function(key) {
        accuracyCharts[key].destroy();
    });
    // Clear the chart objects
    baselineCharts = {};
    accuracyCharts = {};

  document.getElementById("myNav").style.width = "0%";
}

function openBaseline() {
      document.getElementById("mySidebar").style.width = "550px";
      displayBaselineCharts('#suggestionview2',true);
}

function closeBaseline() {
        document.getElementById("mySidebar").style.width = "0";
        storeInteractionLogs('Close Baseline View', "", new Date())

    }


function openBookmark() {
    document.getElementById("myBookmark").style.width = "75%";
    storeInteractionLogs('Open Task/Bookmark View', "", new Date())
    createTaskForm();
    displayBookmarkCharts('#bookmarkview', true)

    }
function closeBookmark() {
  document.getElementById("myBookmark").style.width = "0%";
   storeInteractionLogs('Close Task/Bookmark View', "", new Date())
}




// Function to parse CSV data into an array of arrays
function CSVToArray(text) {
  const rows = text.split('\n');
  return rows.map(row => row.split(','));
}

function createAccuracyChart(id, data, updateTimeSeriesChart, xsc, algorithm) {
    const fieldNames = [
        'airport_name', 'aircraft_make_model', 'effect_amount_of_damage', 'flight_date',
        'aircraft_airline_operator', 'origin_state', 'when_phase_of_flight', 'wildlife_size',
        'wildlife_species', 'when_time_of_day', 'cost_other', 'cost_repair', 'cost_total_a',
        'speed_ias_in_knots'
    ];

    var algorithmPredictions = data['algorithm_predictions'];
    //only select Random, RL, and Momentum from the algorithm predictions
    const selectedAlgorithms = ['Random', 'RL', 'Momentum'];
    const selectedAlgorithmPredictions = {};
    selectedAlgorithms.forEach(algorithm => {
        selectedAlgorithmPredictions[algorithm] = algorithmPredictions[algorithm];
    });
    algorithmPredictions = selectedAlgorithmPredictions;
    const fullHistory = data['full_history'];
    const recTimetoInteractionTime = data['recTimetoInteractionTime'];

    // Clear the existing SVG content
    d3.select(`#${id}`).selectAll("*").remove();

    const margin = { top: 0, right: 50, bottom: 60, left: 190 }; // increased bottom margin
    const width = Math.max(window.innerWidth * 0.8 - margin.left - margin.right, 300);
    const height = window.innerHeight * 0.3 - margin.top - margin.bottom;

    const svg = d3.select(`#${id}`).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(Object.keys(recTimetoInteractionTime)) // Use the length of predictions as the domain not the full history because # interactions can be larger than # predictions
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, 1.1])
        .range([height, 0]);

    const colors = d3.scaleOrdinal()
        .domain(Object.keys(algorithmPredictions))
        .range(d3.schemeCategory10);

    // Compute hit rates for each algorithm
    const hitRateHistory = {};
    Object.keys(algorithmPredictions).forEach(algorithm => {
        const predictions = algorithmPredictions[algorithm];
        const hitRates = [];
        Object.keys(recTimetoInteractionTime).forEach(time => {
            const timeSteps = recTimetoInteractionTime[time];

            let concatenatedHistory = [];
            timeSteps.forEach(step => {
                if (fullHistory[step] !== undefined) {
                    concatenatedHistory.push(fullHistory[step]);
                }
            });

            let total = 0;
            concatenatedHistory.forEach((historyItem, index) => {
                if (predictions[time] && predictions[time].length > 0) {
                    const accuracy = computeCTR(predictions[time], historyItem);
                    total += accuracy;
                } else {
                    total += 0;
                }
            });
            if (concatenatedHistory.length > 0) {
                hitRates.push(total / concatenatedHistory.length);
              } else {
                hitRates.push(0);
              }
        });
        hitRateHistory[algorithm] = hitRates;
    });
    // console.log(hitRateHistory)
    // Draw lines for each dataset
    Object.keys(hitRateHistory).forEach((algorithm, i) => {
        const line = d3.line()
            .x((_, j) => xScale(j.toString()) + xScale.bandwidth() / 2)
            .y(d => yScale(d))
            .curve(d3.curveCardinal.tension(0.5));

        svg.append("path")
            .datum(hitRateHistory[algorithm])
            .attr("fill", "none")
            .attr("stroke", colors(algorithm))
            .attr("stroke-width", 2)
            .attr("d", line)
            .on("click", (_, j) => {
                updateTimeSeriesChart(j, data, xsc, algorithm, colors(algorithm));
            });
    });

    // Add circles to represent data points
    Object.keys(hitRateHistory).forEach((algorithm, j) => {
        hitRateHistory[algorithm].forEach((hitRate, i) => {
            svg.append("circle")
                .attr("cx", xScale(i.toString()) + xScale.bandwidth() / 2)
                .attr("cy", yScale(hitRate))
                .attr("r", 5)
                .attr("fill", colors(algorithm))
                .on("click", () => {
                    updateTimeSeriesChart(i, data, xsc, algorithm, colors(algorithm));
                });
        });
    });

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    // Add y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(5));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)  // Adjusted position for more space
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Recommendation Cycle");

    // Add y-axis label
    svg.append("text")
        .attr("transform", `translate(-35, ${height / 2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Hit Rate");

    // Add labels for different algorithms colors
    Object.keys(hitRateHistory).forEach((algorithm, i) => {
        svg.append("text")
            .attr("x", (width / Object.keys(hitRateHistory).length) * i + 10)  // Distribute labels evenly
            .attr("y", height + margin.bottom - 5)  // Place below x-axis label
            .attr("fill", colors(algorithm))
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .text(algorithm);
    });
}


    function updateTimeSeriesChart(clickedTime, data, xScale, algorithm, fillColor) {
        // console.log("Circle clicked:", clickedTime, algorithm);

        const fieldNames = [
            'airport_name', 'aircraft_make_model', 'effect_amount_of_damage', 'flight_date',
            'aircraft_airline_operator', 'origin_state', 'when_phase_of_flight', 'wildlife_size',
            'wildlife_species', 'when_time_of_day', 'cost_other', 'cost_repair', 'cost_total_a',
            'speed_ias_in_knots'
        ];

        var localattributeHistory = data['full_history'];
        var mapping = data['recTimetoInteractionTime'];
        var Predictions = data['algorithm_predictions'][algorithm][clickedTime];

        // Remove previous highlighting
        d3.selectAll(".highlight").attr("fill", "rgba(54, 160, 235, 0.4)").classed("highlight", false);

        // Get the corresponding time steps from the mapping
        var allTimeSteps = mapping[clickedTime];

        if (allTimeSteps && allTimeSteps.length > 0) {
            // Iterate over the time steps to highlight the corresponding elements
            allTimeSteps.forEach(timeStep => {
                var userAttributes = localattributeHistory[timeStep];

                Predictions.forEach(predictionArray => {
                    predictionArray.forEach(prediction => {
                        if (userAttributes.includes(prediction)) {
                            const fieldIndex = fieldNames.indexOf(prediction);
                            if (fieldIndex !== -1) {
                                // Highlight the corresponding element in the time series chart
                                d3.selectAll(`#timeSeriesChart [data-index="${fieldIndex}"]`)
                                    .filter(function () {
                                        return +d3.select(this).attr("x") === xScale(timeStep);
                                    })
                                    .attr("fill", fillColor)
                                    .classed("highlight", true);
                            }
                        }
                    });
                });
            });
        }
    }


function createShiftFocusChart(full_data) {



    d3.select('#timeSeriesChart').selectAll('svg').remove()

    const localattributeHistory = full_data['full_history'];

    const fieldNames = ['airport_name', 'speed_ias_in_knots','aircraft_make_model', 'flight_date', 'aircraft_airline_operator', 'origin_state', 'effect_amount_of_damage', 'when_phase_of_flight', 'wildlife_size', 'wildlife_species', 'when_time_of_day', 'cost_other', 'cost_repair', 'cost_total_a'];

    const timeSeriesData = localattributeHistory.map((attributes, index) => {
        const dataPoint = { time: index};
        fieldNames.forEach((field, fieldIndex) => {
            dataPoint[field] = attributes.includes(field) ? fieldIndex : null;
        });
        return dataPoint;
    });

    // console.log(timeSeriesData)

    const margin = { top: 0, right: 50, bottom: 50, left: 190 };
    const width = Math.max(window.innerWidth * 0.8 - margin.left - margin.right, 300);
    const height = window.innerHeight * 0.6 - margin.top - margin.bottom;
    const svg = d3.select("#timeSeriesChart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    //create another grouping axis with the prediction time
    const xScale = d3.scaleBand()
        .domain(timeSeriesData.map(d => d.time))
        .range([0, width])
        .padding(0.1);



    const yScale = d3.scaleBand()
        .domain(fieldNames)
        .range([height, 0])
        .padding(0.1);


    svg.selectAll(".line")
        .data(timeSeriesData)
        .enter().append("g")
        .each(function (d) {
            const group = d3.select(this);
            fieldNames.forEach(field => {
                if (d[field] !== null) {
                    group.append("rect")
                        .attr("x", xScale(d.time))
                        .attr("y", yScale(field))
                        .attr("width", xScale.bandwidth())
                        .attr("height", yScale.bandwidth())
                        .attr("class", "bar")
                        .attr("data-index", d[field])
                        .attr("fill", "rgba(54, 160, 235, 0.4)"); // Adjust alpha value for a slightly darker shade

                }
            });
        });

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(timeSeriesData.length - 1).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-size", "14px")
        .style("font-weight", "bold");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Attribute");

    svg.append("text")
        .attr("transform", `translate(${width / 2},${height + margin.top + 20})`)
        .style("text-anchor", "middle")
        .text("Interactions Observed");
    createAccuracyChart('accuracyChart', full_data, updateTimeSeriesChart, xScale);

}

// ###################################################### Helper Functions ########################################################

function computeAccuracy(predictions, groundTruth) {
    // Filter out placeholders like 'none' from ground truth
    groundTruth = groundTruth.filter(attribute => attribute !== 'none');
    predictions = predictions.filter(attribute => attribute !== 'none');

    const predictionSet = new Set(predictions);
    const groundTruthSet = new Set(groundTruth);

    let matches = 0;
    predictionSet.forEach(prediction => {
        if (groundTruthSet.has(prediction)) {
            matches++;
        }
    });

    const unionSet = new Set([...predictionSet, ...groundTruthSet]);
    const checks = unionSet.size;

    return { matches, checks };
}

function computeCTR(predictions, groundTruth) {
    // Helper function to compare two arrays
    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        const sortedA = [...a].sort();
        const sortedB = [...b].sort();
        for (let i = 0; i < sortedA.length; i++) {
            if (sortedA[i] !== sortedB[i]) return false;
        }
        return true;
    }

    // Check if groundTruth exists in predictions
    for (let i = 0; i < predictions.length; i++) {
        if (arraysEqual(predictions[i], groundTruth)) {
            return 1;
        }
    }
    return 0;
}



// ######################################### Task Description #########################################################################################

// Function to clear localStorage
function clearLocalStorage() {
  localStorage.clear();
}
// Attach event listener to window's beforeunload event
window.addEventListener('beforeunload', clearLocalStorage);


// Function to create task form
function createTaskForm() {
  const taskview = document.getElementById('taskview');
  taskview.innerHTML = ''; // Clear any existing content

  const formTitle = document.createElement('h2');
  formTitle.classList.add('task-form-title');
  formTitle.innerText = 'Task Form';

  const questions = [
    "Username",
    "Task Question-\n What kinds of birdstrikes would usually cost the most to repair the airplane? \n Note that any dataset columns that are interesting to you can be included. \n Summarize the 2-3 factors that you believe would cause the highest repair cost\n",
  ];

  const form = document.createElement('form');
  form.id = 'taskForm';

  questions.forEach((question, index) => {
    const formGroup = document.createElement('div');
    formGroup.classList.add('form-group');

    const label = document.createElement('label');
    label.innerText = `${question}`;
    formGroup.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.name = `answer${index}`;
    input.classList.add('form-control');
    formGroup.appendChild(input);

    // Load saved value from local storage
    const savedValue = localStorage.getItem(`answer${index}`);
    if (savedValue) {
      input.value = savedValue;
    }

    input.addEventListener('input', function() {
      // Save value to local storage on input change
        storeInteractionLogs('Taking notes', input.value, new Date())
        console.log('task form input', input.value);
      localStorage.setItem(`answer${index}`, input.value);
    });

    form.appendChild(formGroup);
  });

  const submitButton = document.createElement('button');
  submitButton.type = 'button';
  submitButton.innerText = 'Submit';
  submitButton.classList.add('btn');
  submitButton.onclick = sendLogs;
  form.appendChild(submitButton);

  taskview.appendChild(formTitle);
  taskview.appendChild(form);

  // submit button click event
  submitButton.addEventListener('click', function() {
      storeInteractionLogs('Task Complete for User', {sessionid: user_session_id, algorithm:app.sumview._algorithm , baseline:app.sumview._baseline }, new Date())
    sendLogs();
  });
}

// ######################################### Send Logs to Backend #########################################################################################
function sendLogs() {
  const form = document.getElementById('taskForm');
  const formData = new FormData(form);
  const answers = {};

  formData.forEach((value, key) => {
    answers[key] = value;
  });

  const chartdata= {
                 allrecommendedcharts: app.sumview.allrecommendedCharts,
                 attributes_history: attributesHistory,
                 bookmarked_charts: app.sumview.bookmarkedCharts
             };
    const interactionlogs = interactionLogs;
    const finalData = {'chartdata': chartdata, 'interactionlogs': interactionlogs, 'taskanswers': answers};


  // call backend to store the answers
    $.ajax({
        type: 'POST',
        crossDomain: true,
        url: 'http://localhost:5500' + '/submit-form',
        data: JSON.stringify(finalData),
        contentType: 'application/json'
    }).done(() => {
        if(!alert('Safe to close the window. Your task answers have been stored successfully.')){window.location.reload();}
        // Restart the application using pm2
    // setTimeout(() => {
    //     process.exit(0); // Exit the application to allow pm2 to restart it
    // }, 1000); // Adding a delay to ensure the response is sent before restarting
    }).fail(() => {
        alert('Failed to store task answers. Please try again later.');
    });
  console.log(answers);

}



