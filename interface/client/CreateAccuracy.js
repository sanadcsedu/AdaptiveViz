var d3 = require('d3')

function computeAccuracy(predictions, groundTruth) {
    // Filter out placeholders like 'none' from ground truth and predictions
    const ground = [...new Set(groundTruth.filter(attribute => attribute !== 'none'))];
    const predict = [...new Set(predictions.filter(attribute => attribute !== 'none'))];

    // Initialize total matches
    let matches = 0;

    // Iterate through unique ground truth attributes
    ground.forEach(attr => {
        if (predict.includes(attr)) {
            matches++;
        }
    });

    // Calculate accuracy as the proportion of unique matches to the number of unique attributes in the ground truth
    const accuracy = matches / ground.length;

    return accuracy;
}

export function createAccuracyChart(id, data, updateTimeSeriesChart, xsc, algorithm) {
    // const fieldNames = [
    //     'airport_name', 'aircraft_make_model', 'effect_amount_of_damage', 'flight_date',
    //     'aircraft_airline_operator', 'origin_state', 'when_phase_of_flight', 'wildlife_size',
    //     'wildlife_species', 'when_time_of_day', 'cost_other', 'cost_repair', 'cost_total_a',
    //     'speed_ias_in_knots'
    // ];

    // ########################################################## Variables ########################################################
    var algorithmPredictions = data['algorithm_predictions'];
    //only select Random, RL, and Momentum from the algorithm predictions
    const selectedAlgorithms = ['Hotspot','Modified-Hotspot', 'ShiftScope'];
    const selectedAlgorithmPredictions = {};
    selectedAlgorithms.forEach(algorithm => {
        selectedAlgorithmPredictions[algorithm] = algorithmPredictions[algorithm];
    });
    algorithmPredictions = selectedAlgorithmPredictions;
    const fullHistory = data['full_history'];
    const recTimetoInteractionTime = data['recTimetoInteractionTime'];
    // ########################################################## Variables ########################################################

    // Clear the existing SVG content
    d3.select(`#${id}`).selectAll("*").remove();

    const margin = { top: 0, right: 200, bottom: 60, left: 190 }; // increased right margin for legend
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

    // ########################################################## Calculating Accuracy ########################################################

    // Compute hit rates for each algorithm
    const hitRateHistory = {};
    Object.keys(algorithmPredictions).forEach(algorithm => {
        const predictions = algorithmPredictions[algorithm];
        const hitRates = [];
        Object.keys(recTimetoInteractionTime).forEach(time => {
            const timeSteps = recTimetoInteractionTime[time];

            let concatenatedHistory = [];
            // Same as concatenatedPredictions, full history step is also a list of interactions; flatten that too
            timeSteps.forEach(step => {
                if (!fullHistory[step]) {
                    // console.log('No interactions for time:', time, 'step:', step);
                    return;
                }
                concatenatedHistory.push(...fullHistory[step].flat());
            });

            let concatenatedPredictions = [];
            // For each item in predictions[time], make one array of all predictions
            if (predictions[time] && predictions[time].length > 0) {
                predictions[time].forEach(predictionArray => {
                    concatenatedPredictions.push(...predictionArray);
                });
            }

            if (concatenatedHistory.length > 0) {
                let accuracy = computeAccuracy(concatenatedPredictions, concatenatedHistory);
                hitRates.push(accuracy);
            } else {
                // console.log('No interactions for time:', time);
                hitRates.push(0);
            }
        });
        // // ########################################################## make hitRateHistory cumulative and between 0-1 ########################################################
        //  hitRates.forEach((hitRate, hr) => {
        //     if (hr > 0) {
        //         hitRates[hr] += hitRates[hr - 1];
        //     }
        //  });
        // hitRates.forEach((hitRate, hr) => {
        //     hitRates[hr] = hitRate / (hr + 1);
        // }   );
        hitRateHistory[algorithm] = hitRates;


    });



    // ########################################################## Plotting Accuracy Calculations ########################################################
    import('./StoreLogs.js').then(module => {
        module.storeInteractionLogs('updated accuracy chart', hitRateHistory, new Date());
    })
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
                .attr("r", 10)
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
        .style("font-size", "20px")
        .text("Interactions");

    // Add y-axis label
    svg.append("text")
        .attr("transform", `translate(-35, ${height / 2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .text(" Coverage");

    // Add a label box for different algorithms on the right
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 30}, 0)`);  // add extra padding

    Object.keys(hitRateHistory).forEach((algorithm, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 30})`);  // 30 pixels spacing between labels

        legendRow.append("rect")
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", colors(algorithm));

        const legendText = legendRow.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .attr("text-anchor", "start")
            .style("font-size", "15px")
            .style("font-weight", "bold")
            .text(algorithm);

    });

}
