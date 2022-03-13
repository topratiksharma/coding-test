"use strict";

//#region Global Variables
let ctx;
const scale = 4;
const worldWidth = 480;
const worldHeight = 240;
let selectedWorld;
//#endregion

//#region Initialize
//Reading world data and saving it in global constant
const worldData = await readFile();

initializeSelectOptions();

initalizeCanvas();

/**
 * Initializes Select Box Options
 */
async function initializeSelectOptions() {
  const selectOption = document.getElementById("availableRecords");
  worldData.forEach((eachOption) => {
    const optionEl = document.createElement("option");
    optionEl.text = eachOption.name;
    optionEl.title = eachOption.description;
    selectOption.add(optionEl);
  });
}

/**
 * Initialize Canvas with width and height
 */
function initalizeCanvas() {
  const canvas = document.querySelector("canvas");
  canvas.width = worldWidth * scale;
  canvas.height = worldHeight * scale;
  ctx = canvas.getContext("2d");
}
//#endregion

/**
 * Renders the new world points on the canvas
 * @param {worldObject} world | Provide the world info
 * @param {string} topSpace | Top margin
 * @param {number} leftSpace | Left margin
 */
function render(world, topSpace, leftSpace) {
  ctx.fillStyle = "#202020";
  ctx.fillRect(0, 0, worldWidth * scale, worldHeight * scale);
  ctx.fillStyle = "green";
  world.forEach((rows, y) => {
    rows.forEach(
      (alive, x) =>
        alive === "O" && 
        ctx.fillRect((x + leftSpace) * scale, (y + topSpace) * scale, scale - 1, scale - 1)
    );
  });
}

/**
 * Reads the data from the json file
 * @returns json file data
 */
async function readFile() {
  return new Promise((resolve, reject) => {
    readJsonFile("./src/lexicon.json", (fileDataAsString) => {
      resolve(JSON.parse(fileDataAsString));
    });
  });
}

/**
 * Does AJAX for fetching the file info
 * @param {string} file File path
 * @param {function} callback Callback functions
 */
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

/**
 * This returns if the current coordinate should live or die
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {Array} rows world rows
 * @param {Array} columns world columns
 * @param {worldDataObject} data World data
 * @returns {boolean}
 */
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

/**
 * This returns the current coordinate counts
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {Array} rows world rows
 * @param {Array} columns world columns
 * @param {worldDataObject} data World data
 * @returns {boolean}
 */
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

/**
 * Checks if given coordinate is under populated with the count
 * @param {number} c
 * @returns {boolean}
 */
function isUnderPopulated(c) {
  return c < 2;
}

/**
 * Checks if given coordinate is Healthy or should live with the count
 * @param {number} c
 * @returns {boolean}
 */
function isHealthy(c) {
  return c === 2 || c === 3;
}

/**
 * Checks if given coordinate is over populated with the count
 * @param {number} c
 * @returns {boolean}
 */
function isOverPopulated(c) {
  return c > 3;
}

/**
 * Checks if given coordinate is should be born or generated
 * @param {number} c
 * @returns {boolean}
 */
function isBorn(c) {
  return c === 3;
}

/**
 *
 * @param {number} x X coordinate
 * @param {number} y Y Coordinates
 * @param {worldObject} data World Object
 * @returns {boolean} isCurrent Coordinate is live
 */
function isLive(x, y, data) {
  if (data[y] && data[y][x]) return data[y][x] === "O";
  return false;
}
// #endregion

//#region Events

/**
 * Add description of selected world into label
 * @param {string} selectedOption Option Selected by user
 * @returns {undefined}
 */
window.optionChange = (selectedOption) => {
  if (!selectedOption) return;
  const description = worldData.find(
    (ss) => ss.name === selectedOption
  ).description;
  document.getElementById("selectedValue").innerText = description;
};

/**
 * Starts the regeneration process of the selected world
 */
window.startProcess = () => {
  const selectedOption = document.getElementById("availableRecords").value;
  const topSpace = 100;
  const leftSpace = 220;
  if (!selectedOption) return;
  selectedWorld = getSelectedWorld(selectedOption);
  render(selectedWorld, topSpace, leftSpace);
  setInterval(() => {
    regenerate();

    render(selectedWorld, topSpace, leftSpace);
  }, 100);
};

/**
 * fetchs the selected world
 * @param {string} selectedOption Selected Option
 */
function getSelectedWorld(selectedOption) {
  let currentWorld = worldData.find((ss) => ss.name === selectedOption);
  currentWorld = currentWorld.pattern.split("\n").map((e) => e.split(""));
  currentWorld = currentWorld.filter((n) => n.length > 0);
  return currentWorld;
}

/**
 * Regenerates the world for next iteration
 */
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
