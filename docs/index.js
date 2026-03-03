/* global sharkViewer */
let s = null;
const loadedNeurons = {};
let neuronCounter = 0;
let mdata;

// Cores pré-definidas para neurônios
const presetColors = [
  "#394ECF",
  "#EB4034",
  "#C3FE1A",
  "#59fc20",
  "#f8d43c",
  "#fd2c4d",
  "#9b59b6",
  "#34495e",
];

function getNeuronColor(index) {
  return presetColors[index % presetColors.length];
}

function updateNeuronList() {
  const listElement = document.getElementById("neuron-list");
  const neuronIds = Object.keys(loadedNeurons);

  if (neuronIds.length === 0) {
    listElement.innerHTML =
      '<li style="color: #95a5a6; font-size: 13px; text-align: center; padding: 10px;">Nenhum neurônio carregado</li>';
    return;
  }

  listElement.innerHTML = "";

  neuronIds.forEach((neuronId) => {
    const neuronData = loadedNeurons[neuronId];
    const li = document.createElement("li");
    li.className = "neuron-item";
    li.id = `neuron-item-${neuronId}`;

    li.innerHTML = `
      <div class="neuron-header">
        <div class="neuron-name">${neuronData.displayName}</div>
        <div class="neuron-controls">
          <button onclick="toggleNeuron('${neuronId}')" id="toggle-${neuronId}">
            ${neuronData.visible ? "👁️" : "🔒"}
          </button>
          <button class="danger" onclick="removeNeuron('${neuronId}')">🗑️</button>
        </div>
      </div>
      <div class="color-opacity-controls">
        <div class="color-control">
          <label style="margin: 0; font-size: 12px;">Cor:</label>
          <input type="color" id="color-${neuronId}" value="${
      neuronData.color
    }" 
                 onchange="updateNeuronColor('${neuronId}', this.value)">
          <div class="preset-colors">
            ${presetColors
              .map(
                (color) =>
                  `<div class="preset-color" style="background-color: ${color}" 
                    onclick="updateNeuronColor('${neuronId}', '${color}')"></div>`,
              )
              .join("")}
          </div>
        </div>
        <div class="opacity-control">
          <label style="margin: 0; font-size: 12px;">
            Transparência: <span class="opacity-value" id="opacity-value-${neuronId}">${Math.round(
      neuronData.opacity * 100,
    )}%</span>
          </label>
          <input type="range" id="opacity-${neuronId}" min="0" max="100" 
                 value="${neuronData.opacity * 100}"
                 oninput="updateNeuronOpacity('${neuronId}', this.value)">
        </div>
      </div>
    `;

    listElement.appendChild(li);
  });
}

function updateNeuronColor(neuronId, color) {
  if (loadedNeurons[neuronId]) {
    loadedNeurons[neuronId].color = color;
    s.setNeuronColor(neuronId, color);
    document.getElementById(`color-${neuronId}`).value = color;
    s.render();
  }
}

function updateNeuronOpacity(neuronId, value) {
  if (loadedNeurons[neuronId]) {
    const opacity = parseFloat(value) / 100;
    loadedNeurons[neuronId].opacity = opacity;
    s.setNeuronOpacity(neuronId, opacity);
    document.getElementById(
      `opacity-value-${neuronId}`,
    ).textContent = `${Math.round(value)}%`;
    s.render();
  }
}

function toggleNeuron(neuronId) {
  if (loadedNeurons[neuronId]) {
    const isVisible = loadedNeurons[neuronId].visible;
    loadedNeurons[neuronId].visible = !isVisible;
    s.setNeuronVisible(neuronId, !isVisible);
    document.getElementById(`toggle-${neuronId}`).textContent = isVisible
      ? "🔒"
      : "👁️";
    s.render();
  }
}

function removeNeuron(neuronId) {
  if (loadedNeurons[neuronId]) {
    s.unloadNeuron(neuronId);
    delete loadedNeurons[neuronId];
    updateNeuronList();
    s.render();
  }
}

// Expor funções para o HTML
window.updateNeuronColor = updateNeuronColor;
window.updateNeuronOpacity = updateNeuronOpacity;
window.toggleNeuron = toggleNeuron;
window.removeNeuron = removeNeuron;

// Funções de controle de câmera
function resetCameraToFirst() {
  if (s) {
    s.resetAroundFirstNeuron({ frontToBack: true });
    s.render();
  }
}

function resetCameraToAll() {
  if (!s) return;

  const neurons = s.getNeurons();
  const visibleNeurons = neurons.filter((n) => n.visible);

  if (visibleNeurons.length === 0) {
    alert("Nenhum neurônio visível para centralizar!");
    return;
  }

  // Calcula bounding box combinado de todos os neurônios visíveis
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  let minZ = Infinity,
    maxZ = -Infinity;

  visibleNeurons.forEach((neuron) => {
    if (neuron.boundingSphere) {
      const center = neuron.boundingSphere.center;
      const radius = neuron.boundingSphere.radius;

      minX = Math.min(minX, center.x - radius);
      maxX = Math.max(maxX, center.x + radius);
      minY = Math.min(minY, center.y - radius);
      maxY = Math.max(maxY, center.y + radius);
      minZ = Math.min(minZ, center.z - radius);
      maxZ = Math.max(maxZ, center.z + radius);
    }
  });

  // Calcula centro e raio da esfera que engloba todos
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const dx = maxX - minX;
  const dy = maxY - minY;
  const dz = maxZ - minZ;
  const radius = Math.sqrt(dx * dx + dy * dy + dz * dz) / 2;

  // Calcula posição da câmera
  const fov = 45; // FOV padrão
  const theta = (fov * (Math.PI / 180.0)) / 2.0;
  const distance = radius / Math.sin(theta);

  // Posiciona câmera
  s.trackControls.target.set(centerX, centerY, centerZ);
  s.camera.position.set(centerX, centerY, centerZ + distance);
  s.trackControls.update();
  s.render();
}

window.resetCameraToFirst = resetCameraToFirst;
window.resetCameraToAll = resetCameraToAll;

function readSwcFile(e) {
  const f = e.target.files[0];
  if (f) {
    const r = new FileReader();
    r.onload = (e2) => {
      const swcTxt = e2.target.result;
      const swc = sharkViewer.swcParser(swcTxt);
      if (Object.keys(swc).length > 0) {
        // Usa o nome do arquivo como ID único
        const neuronId = f.name;

        // Se já existe, remove antes de adicionar
        if (loadedNeurons[neuronId]) {
          s.unloadNeuron(neuronId);
        }

        // Seleciona cor automática baseada no número de neurônios
        const color = getNeuronColor(Object.keys(loadedNeurons).length);

        // Carrega neurônio - não atualiza câmera se já tem outros neurônios
        const updateCamera = Object.keys(loadedNeurons).length === 0;
        s.loadNeuron(neuronId, color, swc, updateCamera, false, true);

        // Armazena dados do neurônio
        loadedNeurons[neuronId] = {
          displayName: f.name,
          color: color,
          opacity: 1.0,
          visible: true,
        };

        updateNeuronList();
        s.render();
      } else {
        alert("Por favor, carregue um arquivo SWC válido.");
      }
    };
    r.readAsText(f);
  } else {
    alert("Falha ao carregar arquivo");
  }
  // Limpa o input para permitir recarregar o mesmo arquivo
  e.target.value = "";
}

function readObjFile(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const objText = event.target.result;
      const objId = file.name;
      s.loadCompartment(objId, "#ff0000", objText);
      s.render();
    };
    reader.readAsText(file);
  }
  // Limpa o input
  e.target.value = "";
}

window.onload = () => {
  document
    .getElementById("swc_input")
    .addEventListener("change", readSwcFile, false);
  document
    .getElementById("obj_input")
    .addEventListener("change", readObjFile, false);

  const swc = sharkViewer.swcParser(document.getElementById("swc").text);
  mdata = JSON.parse(document.getElementById("metadata_swc").text);

  s = new sharkViewer.default({
    animated: false,
    mode: "particle",
    dom_element: document.getElementById("container"),
    metadata: mdata,
    showAxes: 10000,
    showStats: true,
    maxVolumeSize: 5000,
    cameraChangeCallback: () => {},
  });

  window.s = s;
  s.init();
  s.animate();

  // Carrega neurônio de exemplo
  const exampleId = "exemplo.swc";
  s.loadNeuron(exampleId, presetColors[0], swc, true, false, true);
  loadedNeurons[exampleId] = {
    displayName: "exemplo.swc",
    color: presetColors[0],
    opacity: 1.0,
    visible: true,
  };

  updateNeuronList();
  s.render();
};
