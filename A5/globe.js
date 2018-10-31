var margin = {top: 20, right: 30, bottom: 20, left: 30}
var width = 900
var height = 450;

//data globals
var tempData = {};
var world;

//simple data syncronization booleans.
var tempDataDone = false;
var worldDataDone = false;

//This is how steam transfers public stats. jsonp seems like a wonderful
//and terrible idea.
//Their world map is more complete and up to date than many others from what
//I found testing vis.philgore.net/A5/steam.html so I kept it.
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

jsonpFetch("https://steamstore-a.akamaihd.net/public/data/world-countries.jsonp", "onWorldCountries", wD => {
    world = wD;
    worldDataDone = true;
    if (tempDataDone){
        ready();
    }
});

d3.csv("/A5/temps.csv").then( data => {
    tempData = data.reduce((map,d) => {map[d.id]=d;return map},{});
    console.log(tempData);
    tempDataDone = true
    if (worldDataDone){
        ready();
    }
});

var globeSVG = d3.select("#globe")
    .attr("width", width/2 + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

var mapSVG = d3.select("#map")
    .style("background-color","#444")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

var sens = 0.5;
var scl = height/2;

//Setting globe projection
var globeProjection = d3.geoOrthographic()
    .fitExtent([[1, 1], [width - 1, height - 1]], {type:"Sphere"})
    .rotate([0, 0])
    .translate([(width / 4)+margin.left, (height / 2)+margin.top])
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

//var quantize= d3.scaleQuantize()
var blueRedPalette =
    {
        highlight: "#fff",
        gradient:[
"#021893",
"#1b2f9d",
"#3446a8",
"#4d5db3",
"#6774be",
"#c1697b",
"#b75065",
"#ad374e",
"#a31e38",
"#990623"
        ]
    };


var color = d3.scaleQuantize()
    .range(blueRedPalette["gradient"])
    .domain([0,35]);

var transitionLocation = 0
var trans = d3.transition()
    .duration(1000)
    .delay(1000);

var globe;
var map;
function buildGlobe() {

    countries = world.features;
    //Drawing countries on the globe
    globe = globeSVG.selectAll("path.land")
        .data(countries)
        .enter().append("path")
        .attr("class", "land")
        .attr("d", globePath)
        .style('stroke', 'white')
        .style('stroke-width', 0.3)
        .on('mouseover',hover)
        .on("mouseover", hover)
        .on("mouseout", unhover)
        .on("click", selectCountry)


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
    cur.style("stroke", "black")
       .style('stroke-width', 2)
}
function unhover(d, i) {
    var cur = d3.select(this);
    cur.style("stroke", "white")
       .style('stroke-width', 0.3)
}
selectedCountry = {};
function selectCountry(d) {
    console.log(d);
    if(d.id != null){
        selectedCountry = d;
        var name = d3.select("#country_name");
        var temperature = d3.select("#annual_mean_temp");
        name.node().innerHTML = d.properties.name;
        if (tempData[d.id]){
            temperature.node().innerHTML = +tempData[d.id][transitionLocation]+"° C";
        } else {
            temperature.node().innerHTML = "No Data";
        }
    }
}
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
function setMonth(index) {
    d3.select("#month").node().innerHTML = monthNames[index-1];
}

function buildMap(){
    map = mapSVG.append("g")
        .attr("class", "countries")
        .selectAll("path")
        .data(world.features)
        .enter().append("path")
        .attr("d", mapPath)
        .style('stroke', 'white')
        .style('stroke-width', 0.3)
        .on('mouseover',hover)
        .on('mouseout', unhover)
        .on('click', selectCountry);
}

function repeatTransition() {
    transitionLocation = (transitionLocation % 12)+1
    lock = {};
    d3.select(lock).transition().delay(1000).ease(d3.easeLinear).duration(1000).call(() => {
        setMonth(transitionLocation);
        globe.transition().ease(d3.easeLinear).duration(300).style( "fill", (d,i) => {
            if (tempData[d.id]){
                return color(+tempData[d.id][transitionLocation])
            } else
                return "#000";
        })
        map.transition().ease(d3.easeLinear).duration(300).style( "fill", (d,i) => {
            if (tempData[d.id]){
                return color(+tempData[d.id][transitionLocation])
            } else
                return "#000";
        })
        selectCountry(selectedCountry);
    }).on("end",repeatTransition);
}

//Main function
function ready() {
    color.domain([-10,50]);
    buildGlobe();
    buildMap();
    repeatTransition()
};

