import './assets/scss/app.scss'

import {parseurl} from './utils.js'

var datafile = '/data/birdstrikes_lowercase.json'

var app = {}
app.logger = []
window.app = app

$(document).ready(async function() {
    
    var parameters = parseurl();

    if (parameters['data'])
        datafile = parameters.data;

    import('./createTaskForm.js').then(module => {
      module.createTaskForm();
    })

    const data = await $.get(datafile);  
    const dataTableModule = await import('./DataTable.js');
    await dataTableModule.updateData(data, datafile);

    const chartsModule = await import('./displayAllCharts.js');
    chartsModule.displayAllCharts('#allchartsview', true);

    const eventsModule = await import('./handleEvents.js');
    eventsModule.handleEvents();

  }    
);
