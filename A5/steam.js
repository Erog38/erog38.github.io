var margin = {top: 20, right: 30, bottom: 20, left: 30}
var width = 900
var height = 450;

//data globals
var steamData = {};
var world;

//simple data syncronization booleans.
var steamDataRecieved = false;
var worldDataDone = false;

//This is how steam transfers public stats. jsonp seems like a wonderful
//and terrible idea.
jsonpFetch = function (url, func, callback) {
    function create() {
        jsonpFetch[func] = function(data) {
            callback(data);
            delete jsonpFetch[func];
            script.remove();
        };
        return 'jsonpFetch.' + func;
    }

    var cb = create();
    var	script = d3.select('head')
        .append('script')
        .attr('type', 'text/javascript')
        .attr('src', url );
};

today = new Date();
jsonpFetch( "https://steamcdn-a.akamaihd.net/steam/publicstats/download_traffic_per_country.jsonp?v="+today.getMonth()+"-"+today.getDay()+"-"+today.getFullYear()+"-19", "onTrafficData", d => {

    steamData = d;
    steamDataRecieved = true;
    if (worldDataDone){
        ready();
    }
});

jsonpFetch("https://steamstore-a.akamaihd.net/public/data/world-countries.jsonp", "onWorldCountries", wD => {
    world = wD;
    worldDataDone = true;
    if (steamDataRecieved){
        ready();
    }
});

var globeSVG = d3.select("#globe")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

var mapSVG = d3.select("#map")
    .style("background-color","#444")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

var blackGreenPalette =
    {
        highlight: "#89adba",
        gradient:[
            '#222222',
            '#343926',
            '#46502a',
            '#58672f',
            '#6B7e33',
            '#7d9537',
            '#8fac3c',
            '#a1c340',
            '#b4da45' ]
    };

var sens = 0.5;
var scl = Math.min(width, height)/2.5;

//Setting globe projection
var globeProjection = d3.geoOrthographic()
    .fitExtent([[1, 1], [width - 1, height - 1]], {type:"Sphere"})
    .rotate([0, 0])
    .translate([(width / 2)+margin.left, (height / 2)+margin.top])
    .scale(scl);

var mapProjection = d3.geoEquirectangular()
    .translate([(width / 2)+margin.left, (height / 2)+margin.top])

var mapPath = d3.geoPath(mapProjection);
var globePath = d3.geoPath(globeProjection)


var zoom = d3.zoom()
    .scaleExtent([1, 5])
    .on("zoom", e => {
        globeProjection.scale(d3.event.transform.translate(globeProjection).k * scl)
        sens = 1/(2*d3.event.transform.k);
        globeSVG.selectAll("path").attr("d", globePath);
    });


//Adding water
globeSVG.append("path")
    .datum({type: "Sphere"})
    .attr("class", "water")
    .attr("d", globePath);

var quantize= d3.scaleQuantize()

function buildGlobe() {


    countries = world.features;
    //Drawing countries on the globe
    var globe = globeSVG.selectAll("path.land")
        .data(countries)
        .enter().append("path")
        .attr("class", "land")
        .attr("d", globePath)
        .style( "fill", d => {
            if (steamData[d.id]){
                return quantize(Math.sqrt(+steamData[d.id]["totalbytes"]))
            } else
                return "#000";
        })
        .style('stroke', 'white')
        .style('stroke-width', 0.3)
        .on('mouseover',hover)
        .on("mouseover", hover)
        .on("mouseout", unhover)
        .on("click", selectCountry);
    //Drag event
    globeSVG.call(d3.drag()
        .subject(() => {
            var r = globeProjection.rotate(); return {x: r[0]/sens, y: -r[1]/sens};
        })
        .on("drag", () => {
            var rotate = globeProjection.rotate();
            globeProjection.rotate([d3.event.x*sens, -d3.event.y*sens, rotate[2]]);
            globeSVG.selectAll("path.land").attr("d", globePath);
        }))
    globeSVG.call(zoom);

}
function hover(d, i) {
    var cur = d3.select(this);
    var previousColor = cur.style("fill");
    cur.attr("prevcolor", previousColor )
        .style( "fill", blackGreenPalette['highlight'] )
}
function unhover(d, i) {
    var cur = d3.select(this);
    cur.style( "fill", cur.attr("prevcolor") );

}
function selectCountry(d, i) {
    var name = d3.select("#country_name");
    var bytesTransferred = d3.select("#average_mbps");
    var totalBytes = d3.select("#total_bytes");
    name.node().innerHTML = d.properties.name;
    if (steamData[d.id]){
        bytesTransferred.node().innerHTML = d3.format(".4s")(+steamData[d.id]["avgmbps"])+"bps";
        totalBytes.node().innerHTML = d3.format(".4s")(+steamData[d.id]["totalbytes"])+"B";
    } else {
        bytesTransferred.node().innerHTML = "No Data";
        totalBytes.node().innerHTML = "No Data";
    }
}

function buildMap(){
    mapSVG.append("g")
        .attr("class", "countries")
        .selectAll("path")
        .data(world.features)
        .enter().append("path")
        .attr("d", mapPath)
        .style( "fill", d => {
            if (steamData[d.id]){
                return quantize(Math.sqrt(+steamData[d.id]["totalbytes"]))
            } else
                return "#000";
        })
        .style('stroke', 'white')
        .style('stroke-width', 0.3)
        .on('mouseover',hover)
        .on('mouseout', unhover)
        .on('click', selectCountry);
}

//Main function
function ready() {
    quantize.range(blackGreenPalette['gradient'])
        .domain([
            d3.min( d3.values(steamData), d=> Math.sqrt(+d['totalbytes'])),
            d3.max( d3.values(steamData), d=> Math.sqrt(+d['totalbytes']))
        ]);
    buildGlobe();
    buildMap();
};
