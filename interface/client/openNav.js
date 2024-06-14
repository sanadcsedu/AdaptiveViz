// Declare global variables for charts
var baselineCharts = {};
var accuracyCharts = {};

export function openNav() {
    $.ajax({
        type: 'GET',
        crossDomain: true,
        url: 'http://localhost:5500' + '/get-performance-data',
        contentType: 'application/json'
    }).done((full_data) => {
        import('./StoreLogs.js').then(module => {
            module.storeInteractionLogs('Open Performance View', full_data, new Date());
        })
        var data = full_data['distribution_response'];

        try {
            import('./CreateShiftFocus.js').then(module => {
                module.createShiftFocusChart(full_data);
            })
        } catch (error) {
            console.warn('Failed to create accuracy chart:', error);
            alert('Not enough interactions to derive Performance View. Please try again later.');
        }
        document.getElementById("myNav").style.width = "100%";
    }).fail((xhr, status, error) => {
        alert('Cannot Derive Performance View. Please Try Again Later');
    });
}

/* Close when someone clicks on the "x" symbol inside the overlay */
export function closeNav() {
    
  document.getElementById("myNav").style.width = "0%";
}