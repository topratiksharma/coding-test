"use strict";

//#region Global Variables
let ctx;
const scale = 4;
const worldWidth = 480;
const worldHeight = 240;
let selectedWorld;
//#endregion

//Reading world data and saving it in global constant
const worldData = await readFile();

initializeSelectOptions();

initalizeCanvas();

async function initializeSelectOptions() {
  const selectOption = document.getElementById("availableRecords");
  worldData.forEach((eachOption) => {
    const optionEl = document.createElement("option");
    optionEl.text = eachOption.name;
    optionEl.title = eachOption.description;
    selectOption.add(optionEl);
  });
}

function initalizeCanvas() {
  const canvas = document.querySelector("canvas");
  canvas.width = worldWidth * scale;
  canvas.height = worldHeight * scale;
  ctx = canvas.getContext("2d");
}

function render(world, topSpace, leftSpace) {
  ctx.fillStyle = "#202020";
  ctx.fillRect(0, 0, worldWidth * scale, worldHeight * scale);
  ctx.fillStyle = "green";
  world.forEach((rows, y) => {
    rows.forEach(
      (alive, x) => alive === "O" && ctx.fillRect((x + leftSpace) * scale, (y + topSpace) * scale,scale - 1, scale - 1)
    );
  });
}

async function readFile() {
  return new Promise((resolve, reject) => {
    readJsonFile("./src/lexicon.json", (fileDataAsString) => {
      resolve(JSON.parse(fileDataAsString));
    });
  });
}

function readJsonFile(file, callback) {
  const rawFile = new XMLHttpRequest();
  rawFile.overrideMimeType("application/json");
  rawFile.open("GET", file, true);
  rawFile.onreadystatechange = () => {
    if (rawFile.readyState === 4 && rawFile.status == "200") {
      callback(rawFile.responseText);
    }
  };
  rawFile.send(null);
}

// #region Automaton
function census(x, y, rows, columns, data) {
  let c = getNeighbors(x, y, rows, columns, data);
  let underPopulated = false;
  let healthy = false;
  let overPopulated = false;
  let born = false;
  if (isLive(x, y, data)) {
    underPopulated = isUnderPopulated(c);
    healthy = isHealthy(c);
    overPopulated = isOverPopulated(c);
  } else {
    born = isBorn(c);
  }
  if (underPopulated || overPopulated) {
    return false;
  }
  if (healthy || born) {
    return true;
  }
  return false;
}

function getNeighbors(x, y, rows, columns, data) {
  let n = y != rows - 1; // has northern neighbors
  let e = x != 0; // has eastern neighbors
  let s = y != 0; // has southern neighbors
  let w = x != columns - 1; // has western neighbors
  let count = 0;
  if (n && isLive(x, y + 1, data)) count++;
  if (n && e && isLive(x - 1, y + 1, data)) count++;
  if (e && isLive(x - 1, y, data)) count++;
  if (s && e && isLive(x - 1, y - 1, data)) count++;
  if (s && isLive(x, y - 1, data)) count++;
  if (s && w && isLive(x + 1, y - 1, data)) count++;
  if (w && isLive(x + 1, y, data)) count++;
  if (n && w && isLive(x + 1, y + 1, data)) count++;
  return count;
}

function isUnderPopulated(c) {
  return c < 2;
}

function isHealthy(c) {
  return c === 2 || c === 3;
}

function isOverPopulated(c) {
  return c > 3;
}

function isBorn(c) {
  return c === 3;
}

function isLive(x, y, data) {
  if (data[y] && data[y][x]) return data[y][x] === "O";
  return false;
}
// #endregion

//#region Events
window.optionChange = (selectedOption) => {
  if (!selectedOption) return;
  const description = worldData.find(
    (ss) => ss.name === selectedOption
  ).description;
  document.getElementById("selectedValue").innerText = description;
};

window.startProcess = () => {
  const selectedOption = document.getElementById("availableRecords").value;
  if (!selectedOption) return;
  selectedWorld = getSelectedWorld(selectedOption);
  render(selectedWorld, 100, 220);
  setInterval(() => {
    regenerate();

    render(selectedWorld, 100, 220);
  }, 100);
};

function getSelectedWorld(selectedOption) {
  let currentWorld = worldData.find((ss) => ss.name === selectedOption);
  currentWorld = currentWorld.pattern.split("\n").map((e) => e.split(""));
  currentWorld = currentWorld.filter((n) => n.length > 0);
  return currentWorld;
}

function regenerate() {
  const rows = selectedWorld.length;
  const columns = selectedWorld[0].length;
  // Change each cell
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const toggle = census(x, y, rows, columns, selectedWorld);
      if (toggle) {
        selectedWorld[y][x] = "O";
      } else {
        selectedWorld[y][x] = ".";
      }
    }
  }
}
//#endregion
