window.optionChange = (va) => {
  const fullData = JSON.parse(localStorage.getItem("data"));
  const description = fullData.find((ss) => ss.name === va).description;
  document.getElementById("selectedValue").innerText = description;
  console.log("Option Change", va);
};

window.startProcess = () => {
  const fullData = JSON.parse(localStorage.getItem("data"));
  const selectedOption = document.getElementById("availableRecords").value;
  let data = fullData.find((ss) => ss.name === selectedOption);
  data = data.pattern.split("\n").map((e) => e.split(""));
  data = data.filter((n) => n.length > 0);
  localStorage.setItem("regeneratedData", JSON.stringify(data));
  const topSpace = 100;
  const leftSpace = 220;
  render(data, topSpace, leftSpace);
  setInterval(() => {
    const regeneratedData = JSON.parse(localStorage.getItem("regeneratedData"));
    const rows = regeneratedData.length;
    const columns = regeneratedData[0].length;
    // Change each cell
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const toggle = census(x, y, rows, columns, regeneratedData);
        if (toggle) {
          regeneratedData[y][x] = "O";
        } else {
          regeneratedData[y][x] = ".";
        }
      }
    }
    // add some default spacing
    localStorage.setItem("regeneratedData", JSON.stringify(regeneratedData));
    render(regeneratedData, topSpace, leftSpace);
  }, 100);
};

const scale = 4;
const worldWidth = 480;
const worldHeight = 240;

const canvas = document.querySelector("canvas");
canvas.width = worldWidth * scale;
canvas.height = worldHeight * scale;
const ctx = canvas.getContext("2d");

const readJsonFile = (file, callback) => {
  const rawFile = new XMLHttpRequest();
  rawFile.overrideMimeType("application/json");
  rawFile.open("GET", file, true);
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4 && rawFile.status == "200") {
      callback(rawFile.responseText);
    }
  };
  rawFile.send(null);
};

const readFile = async () => {
  return new Promise((resolve, reject) => {
    readJsonFile("./src/lexicon.json", (fileDataAsString) => {
      resolve(JSON.parse(fileDataAsString));
    });
  });
};

const render = (world, topSpace, leftSpace) => {
  ctx.fillStyle = "#202020";
  ctx.fillRect(0, 0, worldWidth * scale, worldHeight * scale);
  ctx.fillStyle = "green";
  world.forEach((rows, y) => {
    rows.forEach(
      (alive, x) =>
        alive === "O" &&
        ctx.fillRect(
          (x + leftSpace) * scale,
          (y + topSpace) * scale,
          scale - 1,
          scale - 1
        )
    );
  });
};

var data = await readFile();

const selectOption = document.getElementById("availableRecords");

localStorage.setItem("data", JSON.stringify(data));

data.forEach((eachOption) => {
  const optionEl = document.createElement("option");
  optionEl.text = eachOption.name;
  optionEl.title = eachOption.description;
  selectOption.add(optionEl);
});

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
