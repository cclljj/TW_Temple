(function(window) {
  // voronoi map with d3 and leaflet 
  // code from https://chriszetter.com/blog/2014/06/15/building-a-voronoi-map-with-d3-and-leaflet/
  let showHide = function(selector) {
    d3.select(selector).select('.hide').on('click', function() {
      d3.select(selector)
        .classed('visible', false)
        .classed('hidden', true);
    });

    d3.select(selector).select('.show').on('click', function() {
      d3.select(selector)
        .classed('visible', true)
        .classed('hidden', false);
    });
  };

  let voronoiMap = function(map, url, initialSelections) {
    var pointTypes = d3.map(),
      points = [],
      lastSelectedPoint;

    var voronoi = d3.geom.voronoi()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; });

    var selectPoint = function() {
      d3.selectAll('.selected').classed('selected', false);
      var cell = d3.select(this),
        point = cell.datum();

      lastSelectedPoint = point;
      cell.classed('selected', true);

      //d3.select('#selected h1')
      //  .html(point.name + " (" + point.address + ")")
    }

    var drawPointTypeSelection = function() {
      showHide('#selections')
      labels = d3.select('#toggles').selectAll('input')
        .data(pointTypes.values())
        .enter().append("label");

      labels.append("input")
        .attr('type', 'checkbox')
        .property('checked', function(d) {
          var strs = d.type.split(" ");
          return true; //initialSelections === undefined || initialSelections.has(strs[0]) //|| !initialSelections.has(d.type)
        })
        .attr("value", function(d) { return d.type; })
        .on("change", drawWithLoading);

      labels.append("span")
        .attr('class', 'key')
        .style('background-color', function(d) { return '#' + d.color; });

      labels.append("span")
        .text(function(d) { return d.type; });
    }

    var selectedTypes = function() {
      return d3.selectAll('#toggles input[type=checkbox]')[0].filter(function(elem) {
        return elem.checked;
      }).map(function(elem) {
        return elem.value;
      })
    }

    var pointsFilteredToSelectedTypes = function() {
      var currentSelectedTypes = d3.set(selectedTypes());
      return points.filter(function(item) {
        return currentSelectedTypes.has(item.type);
      });
    }

    var drawWithLoading = function(e) {
      d3.select('#loading').classed('visible', true);
      if (e && e.type == 'viewreset') {
        d3.select('#overlay').remove();
      }
      setTimeout(function() {
        draw();
        d3.select('#loading').classed('visible', false);
      }, 0);
    }

    var draw = function() {
      d3.select('#overlay').remove();

      var bounds = map.getBounds(),
        topLeft = map.latLngToLayerPoint(bounds.getNorthWest()),
        bottomRight = map.latLngToLayerPoint(bounds.getSouthEast()),
        existing = d3.set(),
        drawLimit = bounds.pad(0.4);

      filteredPoints = pointsFilteredToSelectedTypes().filter(function(d) {
        var latlng = new L.LatLng(d.latitude, d.longitude);

        if (!drawLimit.contains(latlng)) { return false };

        var point = map.latLngToLayerPoint(latlng);

        key = point.toString();
        if (existing.has(key)) { return false };
        existing.add(key);

        d.x = point.x;
        d.y = point.y;
        return true;
      });

      voronoi(filteredPoints).forEach(function(d) { d.point.cell = d; });

      var svg = d3.select(map.getPanes().overlayPane).append("svg")
        .attr('id', 'overlay')
        .attr("class", "leaflet-zoom-hide")
        .style("width", map.getSize().x + 'px')
        .style("height", map.getSize().y + 'px')
        .style("margin-left", topLeft.x + "px")
        .style("margin-top", topLeft.y + "px");

      var g = svg.append("g")
        .attr("transform", "translate(" + (-topLeft.x) + "," + (-topLeft.y) + ")");

      var svgPoints = g.attr("class", "points")
        .selectAll("g")
        .data(filteredPoints)
        .enter().append("g")
        .attr("class", "point");

      var buildPathFromPoint = function(point) {
        return "M" + point.cell.join("L") + "Z";
      }

      svgPoints.append("path")
        .attr("class", "point-cell")
        .attr("d", buildPathFromPoint)
        //.on('click', selectPoint)
        .on('click', function(d) {
	      	d3.selectAll('.selected').classed('selected', false);
      		var cell = d3.select(this),
        	point = cell.datum();

      		lastSelectedPoint = point;
      		cell.classed('selected', true);

      		//d3.select('#selected h1')
      		//  .html(point.name + " (" + point.address + ")")
		
		d3.select('#showinfo').html("<b><font size=\"+1\">"+d.name+"</font></b>")
				.append('p')
				.html("地址: " + d.address)
				.append('p')
				.html("主神: " + d.type)
				.append('p')
				.html("宗教: " + d.religion)
				.append('p')
				.html("負責人: " + d.corresponding + " (" + d.phone + ")");
		var divL = 0;
		var divT = 0;

		if (d3.event.pageX<parseInt(svg.style("width"), 10) - 200 - 7){  // assume the text-box size is 200px width
			divL = d3.event.pageX + 7;
		} else {
			divL = d3.event.pageX -200 - 7;
		}
		if (d3.event.pageY< parseInt(svg.style("height"), 10) - 100 - 15) {  // assume the text-box size is 100px height
			divT = d3.event.pageY - 15;
		} else {
			divT = d3.event.pageY - 100 - 15;
		}

		d3.select('#showinfo').style("left", divL + "px")
				.style("top", divT + "px")
				.style("padding", "5px")
				.style("border", "solid #ccc 1px")
	 			.style("display", "block")
				.style("opacity", 1);
		})
	.on("mouseover", function(d) { 
		//console.log(d.name,d.address,d.type,d.religion,d.corresponding,d.phone);
		d3.select('#showinfo').html("<b><font size=\"+1\">"+d.name+"</font></b>")
				.append('p')
				.html("地址: " + d.address)
				.append('p')
				.html("主神: " + d.type)
				.append('p')
				.html("宗教: " + d.religion)
				.append('p')
				.html("負責人: " + d.corresponding + " (" + d.phone + ")");
		var divL = 0;
		var divT = 0;

		if (d3.event.pageX<parseInt(svg.style("width"), 10) - 200 - 7){  // assume the text-box size is 200px width
			divL = d3.event.pageX + 7;
		} else {
			divL = d3.event.pageX -200 - 7;
		}
		if (d3.event.pageY< parseInt(svg.style("height"), 10) - 100 - 15) {  // assume the text-box size is 100px height
			divT = d3.event.pageY - 15;
		} else {
			divT = d3.event.pageY - 100 - 15;
		}

		d3.select('#showinfo').style("left", divL + "px")
				.style("top", divT + "px")
				.style("padding", "5px")
				.style("border", "solid #ccc 1px")
	 			.style("display", "block")
				.style("opacity", 1);
		})
	.on("mouseout", function() { 
		d3.select('#showinfo').html("")
				.style("padding", 0)
				.style("border", "0px")
				.style("opacity",0)
				.style("display","none");
		})
	.on("mousemove", function(d) {
		})
        .classed("selected", function(d) { return lastSelectedPoint == d });

      svgPoints.append("circle")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        //.style('fill', function(d) { return '#' + d.color })
        .style('fill', function(d) { return '#D00000' })
        .attr("r", 2.5);
    }

    var mapLayer = {
      onAdd: function(map) {
        map.on('viewreset moveend', drawWithLoading);
        drawWithLoading();
      }
    };
    showHide('#about');
    d3.tsv(url, function(tsv) {
      points = tsv;
      points.forEach(function(point) {
        pointTypes.set(point.type, { type: point.type, color: point.color });
      })
      drawPointTypeSelection();
      map.addLayer(mapLayer);
    })
  }

  // leaflet map
  let map;
  let Stamen_TonerLite;
  let url = "data/temple.tsv";
  let initialSelection = d3.set([
      'ProbeCube', 'Webduino', 'AirQ', 
      'AirU', 'DustBoy', 'CityAir', 'AoT', 'PurpleAir'
    ]);

  map = L.map("map", {
    attributionControl: true,
    maxZoom: 16,
    minZoom: 8
  }).setView([25, 121.2], 10);

  Stamen_TonerLite = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}', {
    attribution: `<a target="_blank" rel="noopener noreferrer" href='http://creativecommons.org/licenses/by-nc-sa/4.0/'>CC-BY-NC-SA</a> | ` +
      `Tiles by <a target="_blank" rel="noopener noreferrer" href="http://stamen.com">Stamen Design</a>, ` +
      `&copy; <a target="_blank" rel="noopener noreferrer" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>`,
    // Credits not used
    // <a href='https://sites.google.com/site/cclljj/NRL'>IIS-NRL</a>
    minZoom: 0,
    maxZoom: 16,
    ext: 'png'
  }).addTo(map);

  if (!L.Browser.touch) {
    Promise
      .resolve(makeRequest("GET", url))
      .then(xhr => {
        // add logo conainer to map
        //L.control.voronoiLogo({
        //  position: "bottomright",
        //  "latest-updated-time": xhr.getResponseHeader("Last-Modified")
        //}).addTo(map);
        // add voronoi legend to the map
        //L.control.voronoiLegend({ position: 'bottomright' }).addTo(map);
      })
      .catch(function(error) {
        console.log(error);
      });

    // make request function in promise
    // for getting the csv update time
    function makeRequest(method, url) {
      return new Promise(function(resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function() {
          if (this.status >= 200 && this.status < 300) {
            resolve(xhr);
          } else {
            reject({
              status: this.status,
              statusText: xhr.statusText
            });
          }
        };
        xhr.onerror = function() {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        };
        xhr.send();
      });
    }
  } else {
    // ensure voronoi legend is loaded after logo
    // add voronoi legend to the map
    // L.control.voronoiLegend({ position: 'bottomright' }).addTo(map);
  }

  // voronoi map
  voronoiMap(map, url, initialSelection);

  // map scale 
  L.control.scale({ "position": "topright" }).addTo(map);
  window.map = map;
})(this);


