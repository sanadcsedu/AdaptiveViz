var d3 = require('d3')

function updateTimeSeriesChart(clickedTime, data, xScale, algorithm, fillColor) {
    // console.log("Circle clicked:", clickedTime, algorithm);

    const fieldNames = ['airport_name', 'speed_ias_in_knots','aircraft_make_model', 'flight_date', 'aircraft_airline_operator', 'origin_state', 'effect_amount_of_damage', 'when_phase_of_flight', 'wildlife_size', 'wildlife_species', 'when_time_of_day', 'cost_other', 'cost_repair', 'cost_total_a'];


    var localattributeHistory = data['full_history'];
    var mapping = data['recTimetoInteractionTime'];
    var Predictions = data['algorithm_predictions'][algorithm][clickedTime];

    // Remove previous highlighting
    d3.selectAll(".highlight").attr("fill", "rgba(128, 128, 128, 0.6)").classed("highlight", false);

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


export function createShiftFocusChart(full_data) {
    d3.select('#timeSeriesChart').selectAll('svg').remove();

    const localattributeHistory = full_data['full_history'];

    const fieldNames = ['airport_name', 'speed_ias_in_knots','aircraft_make_model', 'flight_date', 'aircraft_airline_operator', 'origin_state', 'effect_amount_of_damage', 'when_phase_of_flight', 'wildlife_size', 'wildlife_species', 'when_time_of_day', 'cost_other', 'cost_repair', 'cost_total_a'];

    const timeSeriesData = localattributeHistory.map((attributes, index) => {
        const dataPoint = { time: index };
        fieldNames.forEach((field, fieldIndex) => {
            dataPoint[field] = attributes.includes(field) ? fieldIndex : null;
        });
        return dataPoint;
    });

    const margin = { top: 0, right: 200, bottom: 50, left: 190 }; // Adjusted right margin for legend
    const width = Math.max(window.innerWidth * 0.8 - margin.left - margin.right, 300);
    const height = window.innerHeight * 0.6 - margin.top - margin.bottom;
    const svg = d3.select("#timeSeriesChart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

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
                        .attr("fill", "rgba(128, 128, 128, 0.6)"); // Grey color with adjusted alpha value
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
        .attr("transform", `translate(${width / 2},${height + margin.top + 22})`)
        .style("text-anchor", "middle")
        .text("Interactions")
        .style("font-weight", "bold");

    // Add a label for the grey color on the right side
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 30}, 0)`);  // add extra padding

    const legendRow = legend.append("g")
        .attr("transform", `translate(0, 0)`);  // 30 pixels spacing between labels

    legendRow.append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "rgba(128, 128, 128, 0.6)"); // Grey color

    legendRow.append("text")
        .attr("x", 30)
        .attr("y", 15)
        .attr("text-anchor", "start")
        .style("font-size", "15px")
        .style("font-weight", "bold")
        .text("User Interactions");
    import('./CreateAccuracy.js').then(module => {
        module.createAccuracyChart('accuracyChart', full_data, updateTimeSeriesChart, xScale);
    })
    
}