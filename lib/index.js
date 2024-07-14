/* global sharkViewer */
let s = null;
const loadedNeurons = {};
let mdata;
function readSwcFile(e) {
 const f = e.target.files[0];
 const color = e.target.color;
  if (f) {
    const fname = f.name+e.target.id
    const r = new FileReader();
    r.onload = (e2) => {
      const swcTxt = e2.target.result;
      const swc    = sharkViewer.swcParser(swcTxt);
      if (Object.keys(swc).length > 0) {
        loadedNeurons[fname] = s.loadNeuron(fname, null, swc, true, false, true); // Armazena o neurônio carregado
        s.render();
      } else {
        alert("Please upload a valid swc file.");
      }
    };
    r.readAsText(f);
  } else {
    alert("Failed to load file");
  }
}

function readObjFile(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const objText = event.target.result;
      s.loadCompartment('foo', '#ff0000', objText);
      s.render();
    };
    reader.readAsText(file);
  }
}

function toggleVisu(e) {
  const buttonId = e.target.id;
  let neuronVisible = e.target.visible
  const neuronName = buttonId === "toggle_swc"? Object.keys(loadedNeurons)[0] : Object.keys(loadedNeurons)[1];
  if(neuronName){
    if (!neuronVisible) {
      e.target.value = "Hide SWC";
    }else{
      e.target.value = "Show SWC";
    }
    console.log(neuronName);
    s.setNeuronVisible(neuronName, !neuronVisible);
    e.target.visible = !neuronVisible;
    s.render();
  }
}

window.onload = () => {
  const swc1 = document.getElementById("swc_input");
  swc1.addEventListener("change", readSwcFile, false);
  //swc1.color = '#eb4034';

  const swc2 = document.getElementById("swc2_input");
  swc2.addEventListener("change", readSwcFile, false);
  //swc2.color = '#2f3f9c';
  
  const button1 = document.getElementById("toggle_swc")
  button1.addEventListener("click", toggleVisu);
  button1.visible = true;
  const button2 = document.getElementById("toggle_swc2")
  button2.addEventListener("click", toggleVisu);
  button2.visible = true;
  
  // document
  //   .getElementById("obj_input")
  //   .addEventListener("change", readObjFile, false);
  const swc = sharkViewer.swcParser(document.getElementById("swc").text);
  mdata = JSON.parse(document.getElementById("metadata_swc").text);
  s = new sharkViewer.default({
    animated: false,
    mode: 'particle',
    dom_element: document.getElementById('container'),
    metadata: mdata,
    showAxes: 10000,
    showStats: true,
    maxVolumeSize: 5000,
    cameraChangeCallback: () => { }
  });
  window.s = s;
  s.init();
  s.animate();
  // const swc2 = sharkViewer.swcParser(document.getElementById("swc2").text);
  // s.loadNeuron('swc2', '#ff0000', swc2);
  //s.loadNeuron('swc', null, swc, true, false, true);
  s.render();
};
