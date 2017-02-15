var color = d3.scale.category20c();     //builtin range of colors

var w = 100,
    h = 120,
    r = 50;

var arc = d3.svg.arc()              //this will create <path> elements for us using arc data
    .outerRadius(r);

var pie = d3.layout.pie()           //this will create arc data for us given a list of values
    .value(function(d) { return d.value; });    //we must tell it out to access the value of each element in our data array

//https://bl.ocks.org/mbostock/1346410
function arcTween(a) {
  var i = d3.interpolate(this._current, a);
  this._current = i(0);
  return function(t) {
    return arc(i(t));
  };
}

var AgeHandler = function(){
  this.count = function(tileProps){
    var that = this
    Object.keys(tileProps).forEach(function(key){
      if(key.startsWith("age") && key != "age-undefined"){
        that.totals[key] += tileProps[key]
      }
    })
  }

  this.clear = function(){
    this.totals = {"age-18-19":0,
                   "age-20-24":0,
                   "age-25-29":0,
                   "age-30-34":0,
                   "age-35-39":0,
                   "age-40-44":0,
                   "age-45-49":0,
                   "age-50-54":0,
                   "age-55-59":0,
                   "age-60-64":0,
                   "age-65+"  :0 }
  }

  this.totalsArray = function(){
    var arr = []
    var that = this;
    Object.keys(this.totals).forEach(function(key){
      arr.push({label: key.substring(4,key.length), value: that.totals[key]})
    })
    return arr;
  }

  var tooltip = document.querySelector('#tooltip'),
      margin = {top: 5, right: 0, bottom: 40, left: 30},
      width =  300 - margin.left - margin.right,
      height = 120 - margin.top - margin.bottom,
      svg;

  var x = d3.scale.ordinal().rangeRoundBands([0, width], .05);
  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(10);

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(3);

  this.bar = undefined;

  this.buildGraph = function(where){

    svg = d3.selectAll(where+'-svg')
      .attr("width",  width  + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform","translate(" + margin.left + "," + margin.top + ")");


    var data = this.totalsArray()

    x.domain(data.map(function(d) { return d.label; }));
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-35)");

    svg.append("g")
      .attr("class", "y axis")
      .attr("id","yaxis")
      .call(yAxis)

    this.bar = svg.selectAll("bar")
      .data(data)
      .enter().append("rect")
        .attr('class','bar')
        .attr("x", function(d) { return x(d.label); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.value); })
        .attr("height", function(d) { return height - y(d.value); })
        .on('mouseover',function(d){
          d3.select('#tooltip')
            .style("display", "block")
            .style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px")
            .text(d.label + ": " + d.value)
        })
        .on('mouseout',function(e){
          d3.select('#tooltip').style("display", "none")
        });
  }

  this.updateGraph = function(){
    var data = this.totalsArray()
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    svg.select("#yaxis")
      .transition()
      .duration(1000)
      .call(yAxis);

    this.bar.data(data)
      .transition()
      .duration(1000)
      .attr("x", function(d) { return x(d.label); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
  }
}

var GenderHandler = function(){
  this.clear = function(){
    this.totals = {"gender-male":0,
                   "gender-female":0,
                   "gender-other":0 }
  }

  this.count = function(tileProps){
    var that = this
    Object.keys(tileProps).forEach(function(key){
      if(key.startsWith('gender') && key != "gender-undefined"){
        that.totals[key] += tileProps[key]
      }
    })
  }

  this.totalsArray = function(){
    var arr = []
    var that = this;
    Object.keys(this.totals).forEach(function(key){
      arr.push({label: key.substring(7,key.length), value: that.totals[key]})
    })
    return arr;
  }

  var path,
      svg;

  this.buildPieChart = function(where){

    var data = this.totalsArray()

    svg = d3.select(where+"-svg")
      .attr("width", w)
      .attr("height", h)
      .append("g")
        .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

    path = svg.datum(data).selectAll("path")
        .data(pie)
      .enter().append("path")
        .attr("fill", function(d, i) { return color(i); })
        .attr("d", arc)
        .each(function(d) { this._current = d; }) // store the initial angles
        .on('mouseover',function(d){
          d3.select(this).attr('style','opacity:1')
          d3.select('#tooltip')
            .style("display", "block")
            .style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px")
            .text(d.data.label + ": " + d.data.value)
        })
        .on('mouseout',function(e){
          d3.select(this).attr('style','opacity:0.75')
          d3.select('#tooltip').style('display','none')
        });
  }

  this.updatePieChart = function(){
    svg.datum(this.totalsArray()).selectAll("path")
      .data(pie)
    path.transition().duration(750).attrTween("d", arcTween); // redraw the arcs
  }
}

var UseHandler = function(){

  this.clear = function(){
    this.totals = {"use-no": 0,
                   "use-yes-work": 0,
                   "use-yes-personal": 0 }
  }

  // this.options = Object.keys(this.totals);

  this.count = function(tileProps){
    var that = this
    Object.keys(tileProps).forEach(function(key){
      if(key.startsWith('use') && key != "use-undefined"){
        that.totals[key] += tileProps[key]
      }
    })
  }

  this.totalsArray = function(){
    var arr = []
    var that = this;
    var prettyLabels = ['No', 'Work', 'Personal']
    var ordered = ["use-no", "use-yes-work", "use-yes-personal"]
    ordered.forEach(function(key,i){
      arr.push({label: prettyLabels[i], value: that.totals[key]})
    })
    return arr;
  }

  var path,
      svg;

  this.buildPieChart = function(where){

    var data = this.totalsArray()

    svg = d3.select(where+"-svg")
      .attr("width", w)
      .attr("height", h)
      .append("g")
        .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

    path = svg.datum(data).selectAll("path")
        .data(pie)
      .enter().append("path")
        .attr("fill", function(d, i) { return color(i); })
        .attr("d", arc)
        .each(function(d) { this._current = d; }) // store the initial angles
        .on('mouseover',function(d){
          d3.select(this).attr('style','opacity:1')
          d3.select('#tooltip')
            .style("display", "block")
            .style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px")
            .text(d.data.label + ": " + d.data.value)
        })
        .on('mouseout',function(e){
          d3.select(this).attr('style','opacity:0.75')
          d3.select('#tooltip').style('display','none')
        });
  }

  this.updatePieChart = function(){
    svg.datum(this.totalsArray()).selectAll("path")
      .data(pie)
    path.transition().duration(750).attrTween("d", arcTween); // redraw the arcs
  }
}

var EthnicityHandler = function(){

  this.clear = function(){
    this.totals = {"ethnicity-caucasian":0,
                   "ethnicity-african-american":0,
                   "ethnicity-native-american":0,
                   "ethnicity-latino-hispanic":0,
                   "ethnicity-asian":0,
                   "ethnicity-pacific-islander":0,
                   "ethnicity-other":0}
  }


  this.count = function(tileProps){
    var that = this
    Object.keys(tileProps).forEach(function(key){
      if(key.startsWith("ethnicity") && key != "ethnicity-undefined"){
        that.totals[key] += tileProps[key]
      }
    })
  }

  this.totalsArray = function(){
    var arr = []
    var that = this;
    Object.keys(this.totals).forEach(function(key){
      arr.push({label: key.substring(10,key.length), value: that.totals[key]})
    })
    return arr;
  }

  var margin = {top: 5, right: 0, bottom: 60, left: 30},
      width =  300 - margin.left - margin.right,
      height = 120 - margin.top - margin.bottom,
      svg;

  var x = d3.scale.ordinal().rangeRoundBands([0, width], .05);
  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(10);

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(3);

  this.bar = undefined;

  this.buildGraph = function(where){

    svg = d3.selectAll(where+'-svg')
      .attr("width",  width  + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform","translate(" + margin.left + "," + margin.top + ")");


    var data = this.totalsArray()

    x.domain(data.map(function(d) { return d.label; }));
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-35)");

    svg.append("g")
      .attr("class", "y axis")
      .attr("id","yaxis")
      .call(yAxis)

    this.bar = svg.selectAll("bar")
      .data(data)
      .enter().append("rect")
        .attr('class','bar')
        .attr("x", function(d) { return x(d.label); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.value); })
        .attr("height", function(d) { return height - y(d.value); })
        .on('mouseover',function(d){
          d3.select('#tooltip')
            .style("display", "block")
            .style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px")
            .text(d.label + ": " + d.value)
        })
        .on('mouseout',function(e){
          d3.select('#tooltip').style("display", "none")
        });
  }

  this.updateGraph = function(){
    var data = this.totalsArray()
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    svg.select("#yaxis")
      .transition()
      .duration(1000)
      .call(yAxis);

    this.bar.data(data)
      .transition()
      .duration(1000)
      .attr("x", function(d) { return x(d.label); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
  }
}
