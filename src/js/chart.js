import { scaleTime, scaleLinear } from 'd3-scale';
import { timeParse, timeFormat } from 'd3-time-format';
import { json } from 'd3-request';
import { extent } from 'd3-array';
import { line } from 'd3-shape';
import { axisBottom, axisLeft, axisRight } from 'd3-axis';
import { queue } from 'd3-queue';
import { select, selectAll } from 'd3-selection';
import { format } from 'd3-format';

const dateParse = timeParse("%Y-%m-%d %H:%M:00.000000");
const shortDateParse = timeParse("%Y-%m-%d 00:00:00");
const startDateparse = timeFormat("%Y%m%d");
const commaFormat = format(",");

const FULL_WIDTH = 1200;
const FULL_HEIGHT = 720;
const MARGIN = {top: 24, right: 48, bottom: 32, left: 48};
const CHART_WIDTH = FULL_WIDTH - MARGIN.left - MARGIN.right;
const CHART_HEIGHT = FULL_HEIGHT - MARGIN.top - MARGIN.bottom;

const BASE_URL = 'http://polarity.dkrichards.com/api';
const ACTIVE_CLASS = 'active-button'

class SentimentViz {
    constructor() {
        this.cache = {};

        this.setVisualization(30);
        
        this.buildScales();
        this.buildChart();
        this.handleButtonClick();
    }
    
    addActiveClass(elem) {
        elem.classed(ACTIVE_CLASS, true);
    }
    
    buildChart() {
        this.svg = select("#anchor")
            .append('svg')
            .attr('preserveAspectRatio','xMinYMin meet')
            .attr('viewBox', '0 0 ' + FULL_WIDTH + ' ' + FULL_HEIGHT)
            .style('display', 'none');
    
        this.g = this.svg.append("g")
            .attr("transform", "translate(" + MARGIN.left + "," + MARGIN.top + ")");
        
        this.g.append("g")
            .attr("id", "axis-bottom")
            .attr("transform", "translate(0," + CHART_HEIGHT + ")");
        
        this.g.append("g")
            .attr("id", "axis-left");
            
        this.g.append("g")
            .attr("id", "axis-right")
            .attr("transform", "translate(" + CHART_WIDTH + ", 0)");
        
        this.g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 8)
            .attr("x", -8)
            .attr("dy", "0.71em")
            .attr("text-anchor", "end")
            .text("Sentiment");
    }

    buildScales() {
        this.x = scaleTime()
            .rangeRound([0, CHART_WIDTH]);

        this.y = scaleLinear()
            .domain([0, 100])
            .rangeRound([CHART_HEIGHT, 0]);

        this.vizLine = line()
            .x( d => this.x(d.datetime) )
            .y( d => this.y(d.polarity) );
    }

    fetchData() {
        var date = new Date();
        var startDate = startDateparse(date.setDate(date.getDate() - this.delta));
        
        let dataURL = `${BASE_URL}?from=${startDate}`;

        if (this.cache[this.delta]) {
            this.render(this.cache[this.delta]);
        }
        else {
            queue()
                .defer(json, dataURL)
                .await( (error, jsonData)  => {
                    if (error) {
                        throw error;
                    }
        
                    const data = jsonData.data.map( elem => {
                        elem.datetime = dateParse(elem.datetime);
                        elem.polarity = +elem.polarity;
                        return elem;
                    });
                    
                    const result = {
                        data: data,
                        start_datetime: shortDateParse(jsonData.start_datetime),
                        avg: jsonData.avg,
                        count: jsonData.count
                    }
                    
                    this.cache[this.delta] = result;
                    this.render(result);
                });
        }
    }

    handleButtonClick() {
        const self = this;
        selectAll('.button')
            .on('click', function() { 
                var el = select(this);

                var delta = el.attr('data-chart-delta');
                
                self.setVisualization(delta);
            });
    }
    
    removeActiveClass() {
        selectAll(`.${ACTIVE_CLASS}`).classed(ACTIVE_CLASS, false);
    }
  
    render(result) {
        var data = result.data;
    
        var dateRange = extent(data, function(d) { return d.datetime; });
        var polarityRange = extent(data, function(d) { return d.polarity; });
        
        var blurbDelta = '';
        if (this.delta == 30) {
            blurbDelta = '30 days';
        }
        else if (this.delta == 7) {
            blurbDelta = '7 days';
        }
        else if (this.delta == 1) {
            blurbDelta = '24 hours';
        }
        
        select('#sentiment-blurb').style('display', 'block');
        select("#time_delta").html(blurbDelta);
        select("#tweet_count").html(commaFormat(result.count));
        select("#avg_polarity").html(result.avg);
        select("#high_polarity").html(polarityRange[1]);
        select("#low_polarity").html(polarityRange[0]);
    
        this.x.domain(dateRange);
        
        this.svg.style('display', 'block');
        
        this.g.select('#axis-bottom')
            .call(axisBottom(this.x).tickSize(-CHART_HEIGHT))
        
        this.g.select('#axis-left')
            .call(axisLeft(this.y).tickSize(-CHART_WIDTH));
        
        this.g.select('#axis-right')
            .call(axisRight(this.y));
        
        this.g.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", this.vizLine);
        
        this.g.append("line")
            .attr('class', 'midline')
            .attr('x1', this.x(dateRange[0]))
            .attr('x2', this.x(dateRange[1]))
            .attr('y1', this.y(50))
            .attr('y2', this.y(50));

        this.g.append("line")
            .attr('class', 'avgline')
            .attr('x1', this.x(dateRange[0]))
            .attr('x2', this.x(dateRange[1]))
            .attr('y1', this.y(result.avg))
            .attr('y2', this.y(result.avg));
    }
    
    setVisualization(delta) {
        this.removeActiveClass();
        
        const elem = select(`[data-chart-delta='${delta}']`);
        this.addActiveClass(elem);
        
        ['line', 'midline', 'avgline'].forEach( (selector) => {
            selectAll(`.${selector}`).remove();
        });
        
        this.delta = delta;
        this.fetchData();
    }
}

export default SentimentViz;