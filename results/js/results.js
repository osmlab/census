var color = d3.scale.category20c();     //builtin range of colors

var AgeHandler = function(){
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
                 "age-65+":0}

  this.count = function(tileProps){
    var that = this
    Object.keys(tileProps).forEach(function(key){
      if(key.startsWith("age") && key != "age-undefined"){
        that.totals[key] += tileProps[key]
      }
    })
  }

  this.totalsArray = function(){
    var arr = []
    var that = this;
    Object.keys(this.totals).forEach(function(key){
      arr.push({label: key.substring(4,key.length), value: that.totals[key]})
    })
    return arr;
  }

  this.buildGraph = function(where){
    d3.select(where).selectAll("*").remove();
    var tooltip = document.querySelector('#tooltip')
    data = this.totalsArray()
    var margin = {top: 20, right: 0, bottom: 30, left: 30},
        width = 300 - margin.left - margin.right,
        height = 100 - margin.top - margin.bottom;

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

    var svg = d3.select(where).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform","translate(" + margin.left + "," + margin.top + ")");

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
      .call(yAxis)


    svg.selectAll("bar")
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
}

var GenderHandler = function(){
  this.totals = {"gender-male":0,
                 "gender-female":0,
                 "gender-other":0 }

  this.options = Object.keys(this.totals);

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

  this.buildPieChart = function(where){
    d3.select(where).selectAll("*").remove();
    data = this.totalsArray()
    var w = 100,
        h = 100,
        r = 50

    var vis = d3.select(where)
        .append("svg:svg")              //create the SVG element inside the <body>
        .data([data])                   //associate our data with the document
            .attr("width", w)           //set the width and height of our visualization (these will be attributes of the <svg> tag
            .attr("height", h)
        .append("svg:g")                //make a group to hold our pie chart
            .attr("transform", "translate(" + r + "," + r + ")")    //move the center of the pie chart from 0, 0 to radius, radius

    var arc = d3.svg.arc()              //this will create <path> elements for us using arc data
        .outerRadius(r);

    var pie = d3.layout.pie()           //this will create arc data for us given a list of values
        .value(function(d) { return d.value; });    //we must tell it out to access the value of each element in our data array

    var arcs = vis.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
        .data(pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties)
        .enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
            .append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
                .attr("class", "slice");    //allow us to style things in the slices (like text)

        arcs.append("svg:path")
          .attr("fill", function(d, i) { return color(i); } ) //set the color for each slice to be chosen from the color function defined above
          .attr("d", arc)                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing function
          .attr('style','opacity:0.75')
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
}

var UseHandler = function(){
  this.totals = {"use-no": 0,
                 "use-yes-work": 0,
                 "use-yes-personal": 0 }

  this.options = Object.keys(this.totals);

  this.count = function(tileProps){
    var that = this
    Object.keys(tileProps).forEach(function(key){
      if(key.startsWith('use') && key != "use-undefined"){
        console.log(key)
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

  this.buildPieChart = function(where){
    d3.select(where).selectAll("*").remove();
    data = this.totalsArray()
    var w = 100,
        h = 100,
        r = 50

    var vis = d3.select(where)
        .append("svg:svg")              //create the SVG element inside the <body>
        .data([data])                   //associate our data with the document
            .attr("width", w)           //set the width and height of our visualization (these will be attributes of the <svg> tag
            .attr("height", h)
        .append("svg:g")                //make a group to hold our pie chart
            .attr("transform", "translate(" + r + "," + r + ")")    //move the center of the pie chart from 0, 0 to radius, radius

    var arc = d3.svg.arc()              //this will create <path> elements for us using arc data
        .outerRadius(r);

    var pie = d3.layout.pie()           //this will create arc data for us given a list of values
        .value(function(d) { return d.value; });    //we must tell it out to access the value of each element in our data array

    var arcs = vis.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
        .data(pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties)
        .enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
            .append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
                .attr("class", "slice");    //allow us to style things in the slices (like text)

        arcs.append("svg:path")
          .attr("fill", function(d, i) { return color(i); } ) //set the color for each slice to be chosen from the color function defined above
          .attr("d", arc)                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing function
          .attr('style','opacity:0.75')
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
}

var EthnicityHandler = function(){
  this.totals = {"ethnicity-caucasian":0,
                 "ethnicity-african-american":0,
                 "ethnicity-native-american":0,
                 "ethnicity-latino-hispanic":0,
                 "ethnicity-asian":0,
                 "ethnicity-pacific-islander":0,
                 "ethnicity-other":0}

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

  this.buildGraph = function(where){
    d3.select(where).selectAll("*").remove();
    var tooltip = document.querySelector('#tooltip')
    data = this.totalsArray()
    var margin = {top: 20, right: 0, bottom: 30, left: 30},
        width = 300 - margin.left - margin.right,
        height = 100 - margin.top - margin.bottom;

    var x = d3.scale.ordinal().rangeRoundBands([0, width], .05);
    var y = d3.scale.linear().range([height, 0]);

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .ticks(20);

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(3);

    var svg = d3.select(where).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform","translate(" + margin.left + "," + margin.top + ")");

    x.domain(data.map(function(d) { return d.label; }));
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
        .style("text-anchor", "center")
        .attr("dx", "-.8em")
        .attr("dy", ".25em")
        .attr("transform", "rotate(-25)");

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)


    svg.selectAll("bar")
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
}
