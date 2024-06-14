 import { storeInteractionLogs } from './StoreLogs.js'
 

 var bookmarkedCharts = [];


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


export function openBookmark() {
    document.getElementById("myBookmark").style.width = "550px";
    storeInteractionLogs('Open Bookmark View', "", new Date())
    import('./displayBookmarkCharts.js').then(module => {
        module.displayBookmarkCharts('#bookmarkview', true)
    })
    
    }
export function closeBookmark() {
  document.getElementById("myBookmark").style.width = "0%";
   storeInteractionLogs('Close Task/Bookmark View', "", new Date())
}

// Function to parse CSV data into an array of arrays
function CSVToArray(text) {
  const rows = text.split('\n');
  return rows.map(row => row.split(','));
}


// ###################################################### Helper Functions ########################################################



function computeCTR(predictions, groundTruth) {
    // Helper function to compare two arrays
    //fileter out 'none' from both predictions and groundTruth
    predictions = predictions.filter(attribute => attribute !== 'none');
    groundTruth = groundTruth.filter(attribute => attribute !== 'none');
    function arraysEqual(a, b) {
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


// ######################################### Send Logs to Backend #########################################################################################
export function sendLogs() {
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
    const interactionlogs = storeInteractionLogs.interactionLogs;
    const finalData = {'chartdata': chartdata, 'interactionlogs': interactionlogs, 'taskanswers': answers};


  // call backend to store the answers
    $.ajax({
        type: 'POST',
        crossDomain: true,
        url: 'http://localhost:5500' + '/submit-form',
        data: JSON.stringify(finalData),
        contentType: 'application/json'
    }).done(() => {
        alert('Note Stored! Safe to close')
      }).fail(() => {
        alert('Failed to store notes. Please try again later.');
    });
  console.log(answers);

}



