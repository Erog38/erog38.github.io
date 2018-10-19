var data = [""];
var incomingData = {};

var corsProxy = "https://cors-anywhere.herokuapp.com/"            

var audioElem = document.getElementById('audio');
audioElem.addEventListener("loadeddata", function() {
    document.getElementById("loading").style.display = "none";
    audioElem.play();
});
audioElem.addEventListener("loadstart", function() {
    document.getElementById("loading").style.display = "block";
});

var context = new AudioContext();
var sourceNode = context.createMediaElementSource(audioElem);
var analyser = context.createAnalyser();
analyser.fftSize = 256;
sourceNode.connect(analyser);
analyser.connect(context.destination);


var margin = {top: 20, right: 30, bottom: 20, left: 30}
var width = 960 - margin.left - margin.right
var height = 255 + margin.top + margin.bottom;

var freq = d3.select("#freq");
freq.attr("width", width + margin.left + margin.right)    
    .attr("height", height);

var freqData = new Uint8Array(analyser.frequencyBinCount)
freq.selectAll("rect")
    .data(freqData)
    .enter()
    .append("rect")
    .attr("x", (d,i) => i*(width/freqData.length))
    .attr("width",width/analyser.fftSize)

function renderFrame(){
    requestAnimationFrame(renderFrame);
    analyser.getByteFrequencyData(freqData);
    var bar_width = width/freqData.length-5;
    freq.selectAll("rect")
        .data(freqData)
        .attr("height", d => (d))
        .attr("y", d => height/2-d/2)
        .attr("fill", d => d3.rgb(d,255-d,0));

};

function changeAudioSource(link) {
    audioElem.src = link;
    renderFrame();
}

