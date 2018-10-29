var svg = d3.select("#radial")
    .attr("width", width + margin.left + margin.right)
    .attr("height", width + margin.top+margin.bottom);

var interaction = true;

function toggleTrackSelection(){
    interaction = !interaction;
}

var zoom = d3.zoom()
    .scaleExtent([1 / 2, 4])
    .on("zoom", zoomed)

var container = svg.append("g");
svg.call(zoom);
svg.call(zoom.transform,d3.zoomIdentity.translate((width+margin.left)/2,(width+margin.top)/2));

function zoomed() {
    container.attr("transform", d3.event.transform)
}

var tree = d3.tree()
    .size([360, width/2 - margin.left])
    .separation(function(a, b) { return (a.parent == b.parent ? 5 : 10) / a.depth; });

var hoverRadialElement = function(d,i) {
    if (interaction){
    d3.select(this)
        .attr("fill","#00FFFF")
        .attr("r",d3.select(this).attr("r")*2) ;
    }
}
var unhoverRadialElement = function(d,i) {
    if (interaction){
    d3.select(this)
        .attr("fill","#000000")
        .attr("r",d3.select(this).attr("r")/2) ;
    }
}

var selectSong = function(d,i) {
    if(interaction){
    var selectValue = d3.select(this.parentNode).selectAll("text").text();
       audioElem.pause();
       audioElem.src = corsProxy + incomingData[selectValue].track_url + "/download";
       document.getElementById("track_name").innerHTML = incomingData[selectValue].name
       document.getElementById("artist_name").innerHTML = incomingData[selectValue].artist_name
    }
}

d3.json("/A4/albumList.json").then(data => {

    var root = tree(d3.hierarchy(data));

    var nodes = container
        .selectAll("g")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("transform", d => "translate(" +
            [d.y * Math.cos((d.x -= 90)*Math.PI/180), d.y * Math.sin(d.x*Math.PI/180)] + ")");

    container.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkRadial()
            .angle(d => (d.x+90)*Math.PI/180)
            .radius(d => d.y));

    nodes.append("circle")
        .attr("r",4)
        .filter(d => !d.children)
        .on("mouseover", hoverRadialElement)
        .on("mouseout", unhoverRadialElement)
        .on("click", selectSong);

    nodes.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => (d.x < 90 === !d.children) ? 6 : -6)
        .attr("text-anchor", d =>  (d.x < 90 === !d.children) ? "start" : "end")
        .attr("transform", d => "rotate(" + (d.x < 90?d.x:d.x-180) + ")")
        .text(d => d.data.name)


    changeAudioSource(corsProxy + data.children[0].children[0].track_url+"/download");
    document.getElementById("track_name").innerHTML = data.children[0].children[0].name
    document.getElementById("artist_name").innerHTML = data.children[0].children[0].artist_name
    data.children.forEach(d => {
        d.children.forEach(t => {
            incomingData[t.name] = t;
        });
    });

})

