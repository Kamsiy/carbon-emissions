var width = 500,
    height = 500;

var colors = { clickable: 'darkgrey', hover: '#bae67e', clicked: "#ef6b73", clickhover: "darkred" };

var projection = d3.geoOrthographic()
    .scale(200)
    .translate([width / 2, height / 2])
    .clipAngle(90)
    .rotate([90, 3,3])
    .precision(10);

// vertical
var v = d3.scaleLinear()
  .domain([0, width])
  .range([-180, 180]);

// horizontal
var u = d3.scaleLinear()
  .domain([0, height])
  .range([90, -90]);

var path = d3.geoPath()
    .projection(projection);

var globe = d3.select("#globe").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "globe");

globe.append("defs").append("path")
    .datum({type: "Sphere"})
    .attr("id", "sphere")
    .attr("d", path);

globe.append("use")
    .attr("class", "stroke")
    .attr("xlink:href", "#sphere");

globe.append("use")
    .attr("class", "fill")
    .attr("xlink:href", "#sphere");

d3.queue()
  .defer(d3.json, "data/world.json")
  .defer(d3.tsv, "data/world-country-names.tsv")
  .defer(d3.json, "data/carbon-emissions.json")
  .await(init);
  
function init(error, world, names, data){
  if (error) throw error;
  names = _.sortBy(names, ['name']);
  var land = topojson.feature(world, world.objects.land),
      countries = topojson.feature(world, world.objects.countries).features,
      borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; });
  drawMap(land, borders, countries, names)
}

function drawMap(land, borders, countries, names) {
    
  _.forEach(names, function(n){
    _.forEach(countries, function(country){
      if (country.id == n.id) {
          
        globe.insert("path")
          .datum(country)
          .attr("fill", colors.clickable)
          .classed(n.name, true)
          .attr("d", path)
          .on("click", function() {
            d3.selectAll(".clicked")
              .classed("clicked", false)
              .attr("fill", colors.clickable);
            d3.select(this)
              .classed("clicked", true)
              .attr("fill", colors.clicked);
            plotLine(d3.select(this).attr('class').replace(' clicked', ''))
            d3.select("#name").text(d3.select(this).attr('class').replace('clicked', ''));
          })
          .on("mousemove", function() {
            var c = d3.select(this);
            if (c.classed("clicked")) {
              c.attr("fill", colors.clickhover);
            } else {
              c.attr("fill", colors.hover);
            }
          })
          .on("mouseout", function() {
            var c = d3.select(this);
            if (c.classed("clicked")) {
              c.attr("fill", colors.clicked);
            } else {
              d3.select(this).attr("fill", colors.clickable);
            }
          });
      }
    })
  })
  plotLine('United States');
  rotate();
  //borders
  globe.insert("path")
      .datum(borders)
      .attr("class", "boundary")
      .attr("d", path);
};


// rotate works
function rotate(land){
    var drag = d3.drag().subject(function() {
      var r = projection.rotate();
      return {
        x: v.invert(r[0]),
        y: u.invert(r[1])
      };
    }).on("drag", function() {
        projection.rotate([v(d3.event.x), u(d3.event.y)]);
        globe.selectAll("path")
          .attr("d", path);
  });
  globe.call(drag);
}

// Line Graph