var margin = {top: 20, right: 20, bottom: 20, left: 40}, 
    width = 620 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom; 

var xAxis = d3.scaleLinear()
    .domain([1960, 2015]) 
    .range([0, width]); 

var yAxis = d3.scaleLinear()
    .domain([0, 100]) 
    .range([height, 0]); 

var line = d3.line()
    .x(function(d) { return xAxis(d.year); }) 
    .y(function(d) { return yAxis(d.emission); }); 

var graph = d3.select('.line-chart .content')
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  

// append x-axis
graph.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xAxis)); 

// append y-axis
graph.append("g")
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yAxis));

d3.select('.line-chart .content').append('div')
.attr('id', 'tooltip');

var tooltipLine = graph.append('line');

tipBox = graph.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('opacity', 0);

function plotLine(string){
  // Remove previous line chart
  d3.select('path.line').remove();
  
  var dataset = '';
  d3.json('data/carbon-emissions.json', function(d){

    // Exit if country's data cant be found
    if(d[string] == undefined){
      d3.select('.emission').text('-');
      d3.select('.year').text('-');
      d3.select('.growth').text('-');
      assignRank(undefined);
      return;
    }

    dataset = d[string];
    newDataset = [];
    var emissions = [];
    emissions.push(0); // Retain origin

    // Reorganize dataset
    Object.keys(dataset).forEach(function(key) {
      if(typeof parseInt(key) != "number" || typeof dataset[key] != "number"){
          return;
      }
      newDataset.push({
          'year' : parseInt(key),
          'emission' : dataset[key]
      });
      emissions.push(dataset[key]);
      // console.log(key + ': ' + dataset[key]);
    });

    // Optimize y-axis for countries with lower carbon emissions
    yAxis.domain(d3.extent(emissions));
    d3.select('.y-axis').remove();
    graph.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yAxis));


    // Draw line
    graph.append("path")
    .datum(newDataset) 
    .attr("class", "line") 
    .attr("d", line(newDataset))
    .call(transition);

    // assign cpi rank
    assignRank(string);

    // Display 2014 info for each country
    var s = (newDataset[newDataset.length - 1]);
    d3.select('.emission').text(parseFloat(s.emission).toFixed(4));
    d3.select('.year').text(s.year);
    var int = newDataset.length;

    getGrowthRate(newDataset[0].emission, newDataset[int-1].emission);
    drawDonut(parseFloat(s.emission));
    tipBox.on('mousemove', function(){
        var year = xAxis.invert(d3.mouse(tipBox.node())[0]);
        // Search for year
        var emi = newDataset.find(function(element){
          return element.year == year.toFixed(0);
        });
        d3.selectAll('.dot').remove();

        // if year was found, update content
        if (emi != undefined){
          d3.select('.yearly-emissions').text(emi.emission.toFixed(3) + " MT ");
          d3.select('.tooltip-year').text("(" + emi.year + ")");
          graph.append('circle').attr('class','dot')
          .attr('cx', xAxis(emi.year))
          .attr('cy', yAxis(emi.emission))
          .attr('r', 3);
        }

        tooltipLine.attr('stroke', '#dde2e7')
          .attr('x1', xAxis(year))
          .attr('x2', xAxis(year))
          .attr('y1', 0)
          .attr('y2', 160);
      })
      .on('mouseout', function removeTooltip() {
        tooltipLine.attr('stroke', 'none');
        d3.selectAll('.dot').remove();
        d3.select('.yearly-emissions').text('');
        d3.select('.tooltip-year').text('');
      });
  });
}

function getGrowthRate(before, after){
  var growth = (Math.pow(after/before, 1/54) - 1)*100;
  d3.select('.growth').text((growth).toFixed(2)+ '%');
}

function assignRank(d){
  d3.json('data/ccpi.json', function(ranks){
    if(ranks[d] == undefined){
      d3.select('.ccpi').text('-');
    } else{
      d3.select('.ccpi').text(ranks[d]);
    }
  });
}

function drawDonut(val){
  // remove previous donut
  d3.select(".half-donut").remove();
  
  // Data
  var value = (val/50),
      data = [value, 1 - value];
  
  // Setup
  var colors = ["#E06A3C", "#F5F5F5"],
      translation = function(x,y){ return 'translate(' + (x)+',' + (y) + ')';};
  
  var pies = d3.pie()
    .value( function(d){return d;})
    .sort(null)
    .startAngle( -0.5 * Math.PI)
    .endAngle( 0.5 * Math.PI);
  
  var arc = d3.arc()
    .outerRadius(100)
    .innerRadius(72);
  
  

  var svg = d3.select(".donut")
    .append("svg")
    .attr("width", 300)
    .attr("height", 100)
    .attr("class", "half-donut")
    .append("g")
    .attr("transform", translation(150, 100));
  
  // Draw donut
  svg.selectAll("path")
    .data(pies(data))
    .enter()
    .append("path")
    .transition() // TODO: Add transition for donut 
    .attr("d", arc)
    .attr("fill", function(d, i){ return colors[i]; });
  
  // Donut Labels
  svg.append("text")
    .attr("dy", "-20px")
    .attr("class", "emission")
    .attr("text-anchor", "middle")
    .text(val.toFixed(4))
    .style({"font-size": "28px", 'color': "#E06A3C"})

  svg.append('text')
    .attr("dx", "-110px")
    .attr('class', 'label')
    .text('0')
    .style({'font-size': '12px', 'color': '#8b939b', 'font-weight' : 'bold'});
  
  svg.append('text')
    .attr("dx", "105px")
    .attr('class', 'label')
    .text('50')
    .style({'font-size': '12px', 'color': '#8b939b', 'font-weight' : 'bold'});

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr('class', 'label')
    .text("metric tons")
    .style({'font-size': '12px', 'color': '#8b939b', 'font-weight' : 'bold'})
}


// Line Chart Transition, Patrick Sier, https://bl.ocks.org/pjsier/28d1d410b64dcd74d9dab348514ed256 
function transition(path) {
  path.transition()
      .duration(2000)
      .attrTween("stroke-dasharray", function() {
        var l = this.getTotalLength();
        var i = d3.interpolateString("0," + l, l + "," + l);
        return function (t) { return i(t); };
      });
}