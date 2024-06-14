/*************************************************************************
 * Copyright (c) 2024 Sanad Saha
 *
 *************************************************************************
 *
 * @author
 * Sanad <sahasa@oregonstate.edu>
 *
 *************************************************************************/

import EventEmitter from "events"
import {storeInteractionLogs} from "./StoreLogs.js";
var logging = true

import { scaleOrdinal } from 'd3-scale';
import { schemeGreys } from 'd3-scale-chromatic'; 

export default class SumView extends EventEmitter {
    constructor(container, data, conf) {
        super()

        this.container = container
        this.data = data
        this.conf = conf
        this._sessionStarted = false;

        this._params = {
            recradius: 0.1,
            recnum: 6,
            dotr: 11,
            distw: 0.5,
            clthreshold: 0.4,
            ngbrN: 6
        }
        this._charts = []
        this._baselinecharts = []
        this._prevcharts = []
        this._selectedChartID = -1
        this._selectedbookmarkedChartID = -1
        this._performanceData = {}
        
        this._varclr = scaleOrdinal(['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075'])
        this._varclr = scaleOrdinal(['#F3C300', '#875692', '#F38400', '#A1CAF1', '#BE0032', '#C2B280', '#848482', '#008856', '#E68FAC', '#0067A5', '#F99379', '#604E97', '#F6A600', '#B3446C', '#DCD300', '#882D17', '#8DB600', '#654522', '#E25822', '#2B3D26'])
        this._usrclr = scaleOrdinal(schemeGreys[5]).domain([0, 1, 2, 3, 4])
        this._bookmarkedCharts = []

        this._algorithm= 'ActorCritic'
        this._baseline= 'Momentum'

        this._init()
    }

    get charts() {
      return this._charts
    }

    get baselineCharts() {
        return this._baselinecharts
    }

    get bookmarkedCharts() {
        return this._bookmarkedCharts
    }

    get selectedChartID() {
        return this._selectedChartID
    }

     set bookmarkedselectedChartID(ch) {
        this._svgDrawing.selectAll('.chartdot.selected')
            .classed('selected', false)
        if (ch < 0) {
            this._selectedChartID = -1
        } else {
            this._selectedChartID = ch
            this._svgDrawing.selectAll('.chartdot')
                .filter((c) => {
                    return c.overallchid == ch
                })
                .classed('selected', true)
            var selectedChart = _.find(this._bookmarkedCharts, (d) => {
                return this._selectedChartID == d.overallchid
            })
            this.emit('clickchart', selectedChart)
        }
    }

    set selectedChartID(ch) {
        this._svgDrawing.selectAll('.chartdot.selected')
            .classed('selected', false)
        if (ch < 0) {
            this._selectedChartID = -1
        } else {
            this._selectedChartID = ch
            this._svgDrawing.selectAll('.chartdot')
                .filter((c) => {
                    return c.chid == ch
                })
                .classed('selected', true)
            var selectedChart = _.find(this._charts, (d) => {
                return this._selectedChartID == d.chid
            })
            this.emit('clickchart', selectedChart)
        }
    }
  

    _init() {

        this.container.select('svg').remove()
        this.svg = this.container.append('svg')
            .attr('width', this.conf.size[0])
            .attr('height', this.conf.size[1])
        this._svgDrawing = this.svg.append('g')
            .attr('translate', 'transform(' + this.conf.margin + ',' + this.conf.margin + ')')
        this._svgDrawing.append('g')
            .attr('class', 'bubblelayer')
        this._svgDrawing.append('g')
            .attr('class', 'textlayer')
        this._svgDrawing.append('circle')
            .attr('class', 'cursorc')
            .attr('r', this.conf.size[0] * this._params.recradius)
            .style('visibility', 'hidden')
        this._svgDrawing.append('g')
            .attr('class', 'chartlayer')
    }

    update(callback, attributesHistory = null) {
        this._prevcharts = this._charts

        this._recommendCharts(attributesHistory)       

    }

    highlight(chid, hoverin, bookmarked = false) {
        this._svgDrawing.selectAll('.chartdot.hovered').classed('hovered', false)
        if (hoverin) {
            if (bookmarked) {
                this._svgDrawing.selectAll('.chartdot')
                    .filter((c) => {
                        return c.overallchid == chid
                    })
                    .classed('hovered', true)
            } else {
                this._svgDrawing.selectAll('.chartdot')
                    .filter((c) => {
                        return c.chid == chid
                    })
                    .classed('hovered', true)
            }
        }
    }

 _recommendCharts(attributesHistory, callback) {
        if (attributesHistory == null) {
            attributesHistory = [];
        }

        // Get the selected algorithm and baseline directly
        var algorithmDropdown = document.getElementById("algorithm");
        this._algorithm = algorithmDropdown.value;

        var baselinealgorithmDropdown = document.getElementById("baseline");
        this._baseline = baselinealgorithmDropdown.value;

        // Also send bookmarked charts
        var JsonRequest = {
            history: JSON.stringify(attributesHistory),
            bookmarked: this._bookmarkedCharts,
            algorithm: this._algorithm,
            baseline: this._baseline
        };

        // Function to make the top_k recommendation request
        const makeRecommendationRequest = () => {
            $.ajax({
                context: this,
                type: 'POST',
                crossDomain: true,
                url: this.conf.backend + '/top_k',
                data: JSON.stringify(JsonRequest),
                contentType: 'application/json'
            }).done((data) => {
                // console.log(data)
                this._charts = [];
                this._baselinecharts = [];
                this._performanceData = data['distribution_map'];
                for (var i = 0; i < data['chart_recommendations'].length; i++) {
                    if (data['chart_recommendations'][i]) {
                        var chart = {
                            originalspec: JSON.parse(data['chart_recommendations'][i]),
                            created: true,
                            chid: i + 1,
                        };
                        this._charts.push(chart);
                    }
                }
                for (var j = 0; j < data['baseline_chart_recommendations'].length; j++) {
                    if (data['chart_recommendations'][j]) {
                        var bchart = {
                            originalspec: JSON.parse(data['baseline_chart_recommendations'][j]),
                            created: true,
                            chid: j,
                        };
                        this._baselinecharts.push(bchart);
                    }
                }
                if (logging) {
                    app.logger.push({ time: Date.now(), action: 'system-recommendations', data: this._charts });
                    app.logger.push({ time: Date.now(), action: 'current_distribution', data: data['distribution_map'] });
                }
                this.emit('recommendchart', this._charts);
            }).fail((xhr, status, error) => {
                alert('Cannot Generate Recommendations.');
            }).always(() => {
                if (callback) {
                    callback();
                }
            });
        };

        // Check if the session has already been started
        if (!this._sessionStarted) {
            // Call backend to start session first
            $.ajax({
                type: 'GET',
                crossDomain: true,
                url: 'http://localhost:5500/',
                contentType: 'application/json'
            }).done((data) => {
                var user_session_id = data['session_id'];
                console.log("Session ID: ", user_session_id);
                storeInteractionLogs('study begins', user_session_id, new Date());
                this._sessionStarted = true; // Set the flag to true
                // Make recommendation request after session has started
                makeRecommendationRequest();
            }).fail((xhr, status, error) => {
                alert('Cannot start session.');
                if (callback) {
                    callback();
                }
            });
        } else {
            // If session is already started, directly make the recommendation request
            makeRecommendationRequest();
        }
    }
}
