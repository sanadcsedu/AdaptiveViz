import SumView from './sumview.js'
import ChartView from './chartview.js'
import { vegaConfig } from './config.js'
import {keys} from 'lodash'

export function createDataTable() {
    var columns = keys(app.data.chartdata.values[0]).map((d) => {return {title: d} })
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

    // Calculate dynamic scroll height as a percentage of the viewport height
    var scrollH = `${window.innerHeight * 0.2}px`; // Example: 50% of the viewport height

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
}

export function updateData(data, name) {
    return new Promise((resolve, reject) => {
      try {
        $("#datafile").html(name);
  
        app.data = {};
        app.data.chartdata = { attributes: data.attributes, values: data.data };
        app.data.chartspecs = data.charts;
  
        app.sumview = new SumView(d3.select('#sumview'), app.data, {
          backend: 'http://127.0.0.1:5500',
          size: [$('#sumview').width(), $('#sumview').height()],
          margin: 10,
          chartclr: ['#f1a340', '#998ec3']
        });
  
        app.chartview = new ChartView({}, {
          attributes: app.data.chartdata.attributes,
          datavalues: app.data.chartdata.values,
          vegaconfig: vegaConfig
        });
        app.sumview.update();
        
        createDataTable(280);
  
        // Resolve the promise after all updates are done
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  