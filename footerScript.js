"use strict";
// For now, attempting to highlight code as the user is typing is worse
// than useless, because it moves the cursor to the beginning.
/*
document.getElementById("assemblyCode").
       oninput=syntaxHighlighter;
*/
setUpLineNumbers();
let hasTheCodeBeenModifiedSinceLastSuccessfulAssembly = false;
document.getElementById("assemblyCode").oninput = () => {
  setUpLineNumbers();
  hasTheCodeBeenModifiedSinceLastSuccessfulAssembly = true;
};
document.getElementById("assemblyCode").onscroll = () => {
  document.getElementById("lineNumbers")
      .scroll(0, document.getElementById("assemblyCode").scrollTop);
};
document.getElementById("highlightButton").onclick = syntaxHighlighter;
let hasTheCodeBeenAssembled = false;
document.getElementById("assembleButton").onclick = () => {
  const assembly = document.getElementById("assemblyCode").innerText;

  let tokenized;
  try {
    tokenized = tokenize(assembly);
  } catch (error) {
    alert("Internal compiler error in the tokenizer: " + error.message);
    return;
  }
  let resultOfTokenizing = "[";
  for (let i = 0; i < tokenized.length; i++) {
    const token = tokenized[i];
    if (token.text === "\n")
      resultOfTokenizing += '"\\n"';
    else
      resultOfTokenizing += '"' + token.text + '"';
    if (i !== tokenized.length - 1)
      resultOfTokenizing += ",";
  }
  resultOfTokenizing += "]";
  console.log("Result of tokenizing: ", resultOfTokenizing);
  let parsed;
  try {
    parsed = parse(tokenized);
  } catch (error) {
    alert("Internal compiler error in the parser: " + error.message);
  }
  console.log("Result of parsing: ", parsed.getLispExpression());
  let context;
  try {
    context = makeCompilationContext(parsed);
  } catch (error) {
    alert("Internal compiler error in the preprocessor: " + error.message);
  }
  console.log("Result of preprocessing: ", context);
  try {
    assemble(parsed, context);
  } catch (error) {
    alert("Internal assembler error: " + error.message);
  }
  drawTable();
  stopSimulation();
  hasTheCodeBeenAssembled = true;
  hasTheCodeBeenModifiedSinceLastSuccessfulAssembly = false;
};
function stopSimulation() {
  if (!playing) {
    alert("You are not supposed to press the stop button unless the simulation is currently playing, and it is not right now!");
    return;
  }
  document.getElementById("fastForwardButton").disabled = false;
  document.getElementById("singleStepButton").disabled = false;
  document.getElementById("UART_INPUT").disabled = false;
  if (playing)
    clearInterval(simulationThread);
  document.getElementById("PC_label_" + formatAsAddress(PC)).innerHTML = "";
  PC = 0;
  document.getElementById("PC_label_000").innerHTML =
      "<img src=\"https://icons.getbootstrap.com/assets/icons/arrow-right.svg\" alt=\"-&gt;\">";
  playing = false;
  document.getElementById("playImage").style.display = "inline";
  document.getElementById("pauseImage").style.display = "none";
  for (let i = 0; i < 256; i++)
    output[i] = 0;
  for (let i = 0; i < 16; i++)
    registers[0][i] = registers[1][i] = 0;
  flagZ = [ 0, 0 ];
  flagC = [ 0, 0 ];
  callStack = [];
  regbank = 0;
  flagIE = 1;
  displayRegistersAndFlags();
  displayOutput();
  currentlyReadCharacterInUART = 0;
}
setupLayout();
window.onresize = setupLayout;
drawTable();
displayRegistersAndFlags();
window.onscroll = () => {
  if (window.innerWidth >= 700) {
    if (window.scrollY > document.getElementById("assemblyCode").clientHeight) {
      document.body.style.backgroundPosition = "top left";
    } else {
      document.body.style.backgroundPosition = "top right";
    }
  } else {
    document.body.style.backgroundPosition = "top left";
  }
};
function onPlayPauseButton() {
  playing = !playing;
  if (!playing) {
    clearInterval(simulationThread);
    document.getElementById("fastForwardButton").disabled = false;
    document.getElementById("singleStepButton").disabled = false;
    document.getElementById("UART_INPUT").disabled = false;
    document.getElementById("playImage").style.display = "inline";
    document.getElementById("pauseImage").style.display = "none";
  } else {
    if (!hasTheCodeBeenAssembled) {
      if (!confirm(
              "The code has not been assembled. Do you really want to proceed starting the emulation?"))
        return;
    } else if (
        hasTheCodeBeenModifiedSinceLastSuccessfulAssembly) // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/28
    {
      if (!confirm(
              "The code has been modified since the last successful assembling. Are you sure you want to proceed starting the emulation?"))
        return;
    }
    if (!document.getElementById("shouldWeUpdateRegisters")
             .checked) // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/20
      document.getElementById("PC_label_" + formatAsAddress(PC)).innerHTML =
          " ";
    simulationThread = setInterval(simulateOneInstruction, 500);
    document.getElementById("fastForwardButton").disabled = true;
    document.getElementById("singleStepButton").disabled = true;
    document.getElementById("UART_INPUT").disabled = true;
    document.getElementById("playImage").style.display = "none";
    document.getElementById("pauseImage").style.display = "inline";
  }
}
function onSingleStepButton() {
  if (playing)
    return;
  simulateOneInstruction();
}
function fastForward() {
  if (!hasTheCodeBeenAssembled) {
    if (!confirm(
            "The code has not been assembled. Do you really want to proceed starting the emulation?"))
      return;
  } else if (
      hasTheCodeBeenModifiedSinceLastSuccessfulAssembly) // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/28
  {
    if (!confirm(
            "The code has been modified since the last successful assembling. Are you sure you want to proceed starting the emulation?"))
      return;
  }
  playing = true;
  if (!document.getElementById("shouldWeUpdateRegisters")
           .checked) // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/20
    document.getElementById("PC_label_" + formatAsAddress(PC)).innerHTML = " ";
  document.getElementById("fastForwardButton").disabled = true;
  document.getElementById("singleStepButton").disabled = true;
  document.getElementById("UART_INPUT").disabled = true;
  simulationThread = setInterval(simulateOneInstruction, 0);
  document.getElementById("playImage").style.display = "none";
  document.getElementById("pauseImage").style.display = "inline";
}
document.getElementById("playPauseButton").onclick = onPlayPauseButton;
document.getElementById("stopButton").onclick = stopSimulation;
document.getElementById("singleStepButton").onclick = onSingleStepButton;
document.getElementById("fastForwardButton").onclick = fastForward;
const svgNS = document.getElementById("emptySVG").namespaceURI;
let sevenSegmentDisplays = document.createElement("div");
sevenSegmentDisplays.style.width = 4 * 60 + "px";
sevenSegmentDisplays.style.marginLeft = "auto";
sevenSegmentDisplays.style.marginRight = "auto";
for (let i = 0; i < 4; i++) {
  let sevenSegmentDisplay = document.createElementNS(svgNS, "svg");
  sevenSegmentDisplay.classList.add("sevenSegmentDisplay");
  sevenSegmentDisplay.id = "sevenSegmentDisplay" + i;
  const polygons = [
    "15,5  35, 5 40,10 35,15 15,15 10,10", // Segment A (top)
    "40,10 45,15 45,45 40,50 35,45 35,15", // Segment B (top-right)
    "40,50 45,55 45,85 40,90 35,85 35,55", // Segment C (bottom-right)
    "40,90 35,95 15,95 10,90 15,85 35,85", // Segment D (bottom)
    "10,90  5,85  5,55 10,50 15,55 15,85", // Segment E (bottom-left)
    "10,50  5,45  5,15 10,10 15,15 15,45", // Segment F (top-left)
    "10,50 15,45 35,45 40,50 35,55 15,55", // Segment G (hyphen in the middle)
  ];
  for (const polygonPoints of polygons) {
    let polygon = document.createElementNS(svgNS, "polygon");
    if (polygons.indexOf(polygonPoints) === 6)
      polygon.setAttribute("fill", "#ffaaaa");
    else
      polygon.setAttribute("fill", "#333333");
    polygon.setAttribute("points", polygonPoints);
    polygon.setAttribute("stroke", "black");
    sevenSegmentDisplay.appendChild(polygon);
  }
  sevenSegmentDisplays.appendChild(sevenSegmentDisplay);
}
document.getElementById("graphicalResults").appendChild(sevenSegmentDisplays);
let LEDs = document.createElementNS(svgNS, "svg");
LEDs.setAttribute("width", 400);
LEDs.setAttribute("height", 60);
LEDs.style.background = "darkGreen"; //"fill" does not work here.
LEDs.style.marginLeft = "auto";      // No idea why this is necessary.
LEDs.style.marginRight = "auto";
LEDs.style.display = "block";
for (let i = 0; i < 8; i++) {
  let LED = document.createElementNS(svgNS, "circle");
  LED.setAttribute("fill", "#333333");
  LED.setAttribute("cx", 25 + i * 50);
  LED.setAttribute("cy", 15);
  LED.setAttribute("r", 5);
  LED.id = "LED" + (7 - i);
  LEDs.appendChild(LED);
  let switchHolder = document.createElementNS(svgNS, "rect");
  switchHolder.setAttribute("fill", "black");
  switchHolder.setAttribute("width", 5);
  switchHolder.setAttribute("height", 30);
  switchHolder.setAttribute("y", 25);
  switchHolder.setAttribute("x", 23 + i * 50);
  LEDs.appendChild(switchHolder);
  let button = document.createElementNS(svgNS, "rect");
  button.setAttribute("fill", "gray");
  button.setAttribute("width", 15);
  button.setAttribute("height", 15);
  button.setAttribute("x", 18 + i * 50);
  button.setAttribute("y", 25 + 30 - 15);
  button.id = "switch" + i;
  button.setAttribute("data-buttonValue", 1 << (7 - i));
  button.onclick = onSwitchPressed;
  LEDs.appendChild(button);
}
document.getElementById("graphicalResults").appendChild(LEDs);
function onSwitchPressed(event) {
  let valueOfTheFirstInput =
      parseInt(document.getElementById("input_00").value, 16);
  valueOfTheFirstInput ^= event.target.getAttribute("data-buttonValue");
  // https://discord.com/channels/530598289813536771/847014270922391563/1434254492014219315
  const isValid =
      valueOfTheFirstInput & event.target.getAttribute("data-buttonValue");
  if (isValid)
    event.target.setAttribute("y", 25);
  else
    event.target.setAttribute("y", 25 + 30 - 15);
  document.getElementById("input_00").value =
      formatAsByte(valueOfTheFirstInput);
}
document.getElementById("input_00").oninput = () => {
  const value =
      Math.abs(parseInt(document.getElementById("input_00").value, 16) | 0) %
      256;
  let formatedAsBinary = value.toString(2);
  while (formatedAsBinary.length < 8)
    formatedAsBinary = "0" + formatedAsBinary;
  for (let i = 0; i < 8; i++)
    document.getElementById("switch" + i)
        .setAttribute("y", 40 - formatedAsBinary[i] * 15);
};
document.getElementById("UART_enable_button").onclick = () => {
  is_UART_enabled = !is_UART_enabled;
  document.getElementById("input_02").disabled =
      document.getElementById("input_03").disabled = is_UART_enabled;
  document.getElementById("UART_IO").style.display =
      is_UART_enabled ? "block" : "none";
  document.getElementById("enable_or_disable_UART").innerHTML =
      is_UART_enabled ? "Disable" : "Enable";
  if (is_UART_enabled)
    document.getElementById("shouldWeUpdateRegisters").checked = false;
  window.onresize();
};
fetch(URL_of_JSON_with_examples)
    .then((response) => {
      if (!response.ok)
        throw new Error(response.status);
      else
        return response.json();
    })
    .then((examplesArray) => {
      let examplesHTML = examplesArray
                             .map((example) => `
    <button class="exampleCodeLink" onclick="fetchExample('${
                                      example.file_name}')"
				      ${
                                      /WebPositive/.test(navigator.userAgent)
                                          ? "style=\"font-size:12px;\""
                                          : ""}>
      <img
        src="${example.image}"
        alt="${example.image_alt}"
      /><br/>${example.name}
    </button>
        `).join("") + `
    <div class="exampleCodeLink" style="display: flex">
      <div class="callForMoreExamples">
      Maybe you'd like to try <a href="https://flatassembler.github.io/Duktape.zip">my examples of x86 assembly (<img src="https://icons.getbootstrap.com/assets/icons/archive.svg" alt="ZIP" style="width:20px;height:10px;">)</a>,
      that <a href="https://flatassembler.github.io/AEC_specification.html#AEC_to_x86"><abbr title="Arithmetic Expression Compiler, my programming language">AEC</abbr> compiles</a> to?
      </div>
    </div>
    <div class="exampleCodeLink" style="display: flex">
      <div class="callForMoreExamples">
        Have some example you would like to add here?
        <a
          href="https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues"
          ><img src="https://icons.getbootstrap.com/assets/icons/chat.svg" alt="Contact" style="width:20px;height:10px;"> me on GitHub</a
        > or <a href="https://reddit.com/r/PicoBlaze">Reddit</a>!
      </div>
    </div>
`;
      document.getElementById("examples").style.justifyContent = "initial";
      document.getElementById("examples").style.alignItems = "initial";
      document.getElementById("examples").innerHTML = examplesHTML;
    })
    .catch((error) => {
      document.getElementById("fetchingExamples").innerHTML =
          "Failed to fetch the examples JSON from GitHub: " + error;
    });
