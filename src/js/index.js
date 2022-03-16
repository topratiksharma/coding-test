import { next, parse } from "../engine.js";

//#region Global Variables
let ctx;
const scale = 4;
const worldWidth = 480;
const worldHeight = 240;
let selectedWorld;
let timer;
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
        alive &&
        ctx.fillRect(
          (x + leftSpace) * scale,
          (y + topSpace) * scale,
          scale - 1,
          scale - 1
        )
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
  clearInterval(timer);
  const selectedOption = document.getElementById("availableRecords").value;
  const topSpace = 100;
  const leftSpace = 220;
  if (!selectedOption) return;
  selectedWorld = getSelectedWorld(selectedOption);
  render(selectedWorld, topSpace, leftSpace);
  timer = setInterval(() => {
    selectedWorld = next(selectedWorld);
    render(selectedWorld, topSpace, leftSpace);
  }, 100);
};

/**
 * fetchs the selected world
 * @param {string} selectedOption Selected Option
 */
function getSelectedWorld(selectedOption) {
  return parse(worldData.find((ss) => ss.name === selectedOption).pattern);
}

//#endregion
