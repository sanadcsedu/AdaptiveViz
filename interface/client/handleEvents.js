// import { storeInteractionLogs } from './StoreLogs.js'
var logging = true
var attributesHistory = [];
var fieldsArray = [];

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
        import('./displayAllCharts.js').then(module => {
            module.displayAllCharts('#suggestionview', true);
          })
        // import('./displayBookmarkCharts.js').then(module => {
        //     module.displayBookmarkCharts('#bookmarkview', true)
        // }) 

         if(logging) app.logger.push({time:Date.now(), action:'recommendchart'})

     })

       app.chartview.on('similar', (spec, fieldsArray = []) => {
        if (logging) app.logger.push({ time: Date.now(), action: 'recommendchart', data: spec });
        import('./StoreLogs.js').then(module => {
            module.storeInteractionLogs('requested chart recommendation', { encoding: spec.encoding, mark: spec.mark }, new Date());
        })

        // console.log(spec)
        // console.log(fieldsArray)

        if (app.sumview.data.chartspecs.length > 0) {
            spec._meta = { chid: app.sumview.data.chartspecs[app.sumview.data.chartspecs.length - 1]._meta.chid + 1, uid: 0 };
        } else {
            spec._meta = { chid: 0, uid: 0 };
        }
        app.sumview.data.chartspecs.push(spec); // This holds all the charts that make it to the CenterView

        $('#suggestionview').empty();

        //###################### This only comes if the call is made from Manual Chart editing ########################################################################
        if (fieldsArray.length > 0) {
            attributesHistory.push(fieldsArray);
        }
        //#######################################################################################################################

        // Log extracted fields array
        //  console.log("Fields array:", fieldsArray);
         app.sumview.update(() => {app.sumview.selectedChartID = spec._meta.chid }, attributesHistory)
         
         import('./displayAllCharts.js').then(module => {
            module.displayAllCharts('#suggestionview', true);
          })
         
        if(logging) app.logger.push({time:Date.now(), action:'addchart', data:spec})
     })

     app.chartview.on('update-chart', (spec) => {
         spec._meta = app.sumview.data.chartspecs[app.sumview.selectedChartID]._meta
         app.sumview.data.chartspecs[app.sumview.selectedChartID] = spec

         app.sumview.update(() => {app.sumview.selectedChartID = spec._meta.chid })
         import('./displayAllCharts.js').then(module => {
            module.displayAllCharts('#allchartsview', true);
          })
         
         $('#suggestionview').empty()

         if(logging) app.logger.push({time:Date.now(), action:'updatechart', data:spec})
     })


     $('#import').click(() => {
         $('#dialog').css('display', 'block')
     })

     $('.close').click(() => {
         $('#dialog').css('display', 'none')
     })



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
            //  console.log(data)
         })
     })

     // If the user has clicked on a recommended chart
     $('#suggestionview').click(() => {
         console.log("A chart has been clicked in Suggestion")
         var specs = app.chartview._cheditor.session.getValue()
         if(logging) app.logger.push({time:Date.now(), action:'clickchart-suggestionview', data:specs})
            import('./StoreLogs.js').then(module => {
                module.storeInteractionLogs('clicked on suggested chart', {encoding:JSON.parse(specs).encoding, mark:JSON.parse(specs).mark}, new Date())
            })
            
         $.ajax({
             type: 'POST',
             crossDomain: true,
             url: 'http://localhost:5500/encode2',
             data: JSON.stringify(specs),
             contentType: 'application/json'
         }).done((data) => {

         });
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
            import('./openNav.js').then(module => {
                module. openNav();
            })
     })

     $('#performaceViewClose').click(() => {
            console.log("User requested Performance View to be closed")
            import('./openNav.js').then(module => {
                module.closeNav();
            })
     })

     $('#bookmarkViewOpen').click(() => {
            console.log("User requested Bookmark View")
            import('./utils.js').then(module => {
                module.openBookmark();
            })
           

     })

     $('#bookmarkViewClose').click(() => {
            console.log("User requested Bookmark View to be closed")
            
            import('./utils.js').then(module => {
                module.closeBookmark();
            })
     })

     $('#baselineViewOpen').click(() => {
         console.log("User requested Baseline View")
         import('./StoreLogs.js').then(module => {
            module.storeInteractionLogs('requested baseline charts', "", new Date())
        })
         document.getElementById("mySidebar").style.width = "550px";
         import('./displayBaselineCharts.js').then(module => {
            module.displayBaselineCharts('#suggestionview2', true);
        })
        

     })

     $('#baselineViewClose').click(() => {
        document.getElementById("mySidebar").style.width = "0";
        import('./StoreLogs.js').then(module => {
            module.storeInteractionLogs('Close Baseline View', "", new Date())
        })
        

     })

     $(window).resize(() => {
         app.sumview.svgsize = [$('#sumview').width(), $('#sumview').height()]
     })
}