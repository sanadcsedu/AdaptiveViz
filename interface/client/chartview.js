
 import { EventEmitter } from "events"

 import { storeInteractionLogs } from "./StoreLogs.js"
//  import { createTaskForm } from "./utils.js"
 import {cloneDeep, extend} from 'lodash'

 export default class ChartView extends EventEmitter {
     constructor(data, conf) {
         super()
 
         // global variable: window.app
         this.data = data
         this.conf = conf
 
         this._attributeTypeMap = {}
         this.conf.attributes.forEach((att) => {
                 this._attributeTypeMap[att[0]] = att[2]
         })
 
         this._init()
     }
 
     _init() {
        // text editor
        import('ace-builds/src-noconflict/ace')
        .then(ace => {
            return import('ace-builds/webpack-resolver').then(() => ace);
        })
        .then(ace => {
            this._cheditor = ace.edit('editorcontainer', {
                mode: 'ace/mode/json',
                minLines: 20,
                maxLines: 35,
                wrap: true,
                autoScrollEditorIntoView: true,
                highlightActiveLine: true,
                showPrintMargin: true,
                showGutter: false,
            });
        })

        //  createTaskForm();
         // ui controls
         var html = ''
 
         var comps = ['ch-x', 'ch-y', 'ch-color', 'ch-size', 'ch-shape']
         comps.forEach((comp) => {
             html = '<option value="-">-</option>'
             this.conf.attributes.forEach((d) => {
                  d[0] = d[0].toString().toLowerCase();
                 html += '<option value="' + d[0] + '">' + d[0] + '</option>'
             })
             $('#' + comp).append(html)
         })
     
         var marks = ['bar', 'point', 'circle', 'line', 'tick']
         html = ''
         marks.forEach((d) => {
             html += '<option value="' + d + '">' + d + '</option>'
         })
         $('#ch-mark').append(html)
         
         var comps = ['ch-xtrans', 'ch-ytrans', 'ch-colortrans', 'ch-sizetrans']
         var aggs = ['-', 'count', 'mean', 'sum', 'bin']
         comps.forEach((comp) => {
             html = ''
             aggs.forEach((d) => {
                 html += '<option value="' + d + '">' + d + '</option>'
             })
     
             $('#' + comp).append(html)
         })
 
         // buttons
        //  pressing the recommend button, what will happen? goes to handlevents -> similar
         $('#recommend').click((e) => {
             this.update(this._cheditor.session.getValue(), 'texteditor')
             this.emit('similar', this.data)
         })
        //  Pressing the update button, where user sets the fields herself.
         $('#preview1').click((e) => {
             var data = cloneDeep(this.data)
             data['mark'] = $('#ch-mark').val()
 
             if(!data['encoding'])
                 data['encoding'] = {}
 
             var channels = ['x', 'y', 'color', 'size', 'shape']
             channels.forEach((channel) => {
                 if(!data['encoding'][channel])
                     data['encoding'][channel] = {}
 
                 if(channel != 'shape') {
                     var val = $('#ch-' + channel + 'trans').val()
                     if(val == 'bin')
                         data['encoding'][channel]['bin'] = true
                     else if(val != '-')
                         data['encoding'][channel]['aggregate'] = val
                     else {
                         delete data['encoding'][channel]['aggregate']
                         delete data['encoding'][channel]['bin']
                     }
                 }
 
                 var val = $('#ch-' + channel).val()
                 if(val != '-') {
                     data['encoding'][channel]['field'] = val
                     data['encoding'][channel]['type'] = this._attributeTypeMap[val]
                 }
                 else
                     delete data['encoding'][channel]
             })
            //  console.log(data)
              storeInteractionLogs('manually Edited Chart', {encoding:data['encoding'], mark:data['mark']}, new Date())
              this._validateChart(data, (recommended_chart_specs) => {
        this.update(recommended_chart_specs, 'uicontrols');


        /// ############################### Manually Edited Chart should also make to the history ##############################
         const visualizationConfig = this.data.encoding;

         const shapeField = visualizationConfig.shape?.field !== undefined ? visualizationConfig.shape.field : null;
         const sizeField = visualizationConfig.size?.field !== undefined ? visualizationConfig.size.field : null;
         const xField = visualizationConfig.x?.field !== undefined ? visualizationConfig.x.field : null;
         const yField = visualizationConfig.y?.field !== undefined ? visualizationConfig.y.field : null;
         const colorField = visualizationConfig.color?.field !== undefined ? visualizationConfig.color.field : null;
         const fieldsArray = [colorField, xField, yField, shapeField,sizeField].filter(field => field !== null && field !== undefined);


        //#######################################################################################################################

        this.emit('similar', this.data, fieldsArray); // Generate charts according to users input
    });

         })
     }
     
update(data_all, eventsource) {
    // Handle data parsing, string or object
    if (['outside'].includes(eventsource)) {
        this.data = data_all;
    } else {
        if (typeof data_all === 'object') {
            // Extract the first key from the object and update data_all
            data_all = [data_all[Object.keys(data_all)[0]]];
        } else if (typeof data_all === 'string') {
            // Convert string to an array containing the string itself
            data_all = [data_all];
        }

        var data = data_all[0];
        if (typeof data == 'string') {
            try {
                this.data = JSON.parse(data);
            } catch (err) {
                console.log(err, data);
                return;
            }
        } else if (typeof data == 'object') {
            this.data = data;
        }
    }
// Calculate the dimensions of chartview
    var chartViewElement = document.getElementById('chartview');
    var chartViewWidth = chartViewElement.clientWidth;
    var chartViewHeight = chartViewElement.clientHeight;

    var vegachart = extend({}, this.data, {
        width: chartViewWidth*0.90 ,
        height: chartViewHeight*0.90 ,
        datasets: { "data-2ad45d7d002e5134c7eb6f8a0ec71df4": app.data.chartdata.values},
        autosize: { type: 'fit', resize: true },
        config: this.conf.vegaconfig
    });
    vegachart.mark.tooltip = true;

    import('vega-embed')
        .then(({ default: vegaEmbed }) => {
            vegaEmbed('#chartview .chartcontainer', vegachart, { actions: true })
                .then((result) => {
                    // Access the Vega view instance
                    var view = result.view;
                    var spec = result.spec; // Capture the spec here

                    // Add hover event listeners to the view
                    view.addEventListener('mousemove', (event, item) => {
                        if (item && item.datum) {
                            storeInteractionLogs('hover on main chart', {
                                encoding: spec.encoding,
                                mark: spec.mark,
                                fields: item.datum
                            }, new Date());
                        }
                    });

                })
                .catch(console.error);
            })

    if (eventsource != 'texteditor')
        this._cheditor.session.setValue(JSON.stringify(this.data, null, '  '));

    if (eventsource != 'uicontrols')
        this._updateChartComposer(this.data);
}

     _updateChartComposer(chart_data){
         if(this.data['mark'])
             $('#ch-mark').val(this.data['mark']['type'])
         var channels = ['x', 'y', 'color', 'size', 'shape']
         channels.forEach((ch) => {
             if(chart_data['encoding'][ch]) {
                 // if (chart_data['encoding'][ch]['field'].toString()=='cost_total_a'){
                 //     $('#ch-' + ch).val('Cost_Total_a')
                 // }
                 // else {
                 $('#ch-' + ch).val(chart_data['encoding'][ch]['field'])
     
                 if(ch != 'shape') {
                     if(chart_data['encoding'][ch]['bin'])
                         $('#ch-' + ch + 'trans').val('bin')
                     else if(chart_data['encoding'][ch]['aggregate'])
                         $('#ch-' + ch + 'trans').val(chart_data['encoding'][ch]['aggregate'])
                     else
                         $('#ch-' + ch + 'trans').val('-')
                 }
             }
             else {
                 $('#ch-' + ch).val('-')
                 if(ch != 'shape') $('#ch-' + ch + 'trans').val('-')
             }
         })
     }
 
             _validateChart(chart, callback) {
                 var sp = chart
                 if(typeof chart == 'object')
                     sp = JSON.stringify(chart)
            $.ajax({
                type: 'POST',
                crossDomain: true,
                url: app.sumview.conf.backend + '/encode',
                data: JSON.stringify([sp]),
                contentType: 'application/json'
            }).done((data) => {
                callback(data);
            }).fail((xhr, status, error) => {
                if (xhr.status == 400) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        const errorMessage = response.message;
                        alert(errorMessage);
                    } catch (e) {
                        alert('Invalid chart specification.');
                    }
                } else {
                    alert('This chart is currently not supported. Updating recommendations.');
                }
            });
        }
    }