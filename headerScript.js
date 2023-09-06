"use strict";
let simulationThread;

function displayRegistersAndFlags(state) {
  const {flagZ, flagC, flagIE, PC, registers, regbank} = state;

  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 16; j++) {
      const tableCell = document.getElementById(
          "register_" + String.fromCharCode("A".charCodeAt(0) + i) + "_s" +
          j.toString(16));
      if (tableCell.innerHTML !== formatAsByte(registers[i][j]) &&
          registers[i][j])
        tableCell.className = "changed";
      else if (tableCell.innerHTML !== formatAsByte(registers[i][j]))
        tableCell.className = "turning_off";
      else if (tableCell.innerHTML === "00")
        tableCell.className = "inactive";
      else
        tableCell.className = "active";
      tableCell.innerHTML = formatAsByte(registers[i][j]);
    }
  if (document.getElementById("flag_A_Z").innerHTML !== flagZ[0].toString() &&
      flagZ[0])
    document.getElementById("flag_A_Z").className = "changed";
  else if (document.getElementById("flag_A_Z").innerHTML !==
           flagZ[0].toString())
    document.getElementById("flag_A_Z").className = "turning_off";
  else if (flagZ[0] === 0)
    document.getElementById("flag_A_Z").className = "inactive";
  else
    document.getElementById("flag_A_Z").className = "active";
  document.getElementById("flag_A_Z").innerHTML = flagZ[0];
  if (document.getElementById("flag_B_Z").innerHTML !== flagZ[1].toString() &&
      flagZ[1])
    document.getElementById("flag_B_Z").className = "changed";
  else if (document.getElementById("flag_B_Z").innerHTML !==
           flagZ[1].toString())
    document.getElementById("flag_B_Z").className = "turning_off";
  else if (flagZ[1] === 0)
    document.getElementById("flag_B_Z").className = "inactive";
  else
    document.getElementById("flag_B_Z").className = "active";
  document.getElementById("flag_B_Z").innerHTML = flagZ[1];
  if (document.getElementById("flag_A_C").innerHTML !== flagC[0].toString() &&
      flagC[0])
    document.getElementById("flag_A_C").className = "changed";
  else if (document.getElementById("flag_A_C").innerHTML !==
           flagC[0].toString())
    document.getElementById("flag_A_C").className = "turning_off";
  else if (flagC[0] === 0)
    document.getElementById("flag_A_C").className = "inactive";
  else
    document.getElementById("flag_A_C").className = "active";
  document.getElementById("flag_A_C").innerHTML = flagC[0];
  if (document.getElementById("flag_B_C").innerHTML !== flagC[1].toString() &&
      flagC[1])
    document.getElementById("flag_B_C").className = "changed";
  else if (document.getElementById("flag_B_C").innerHTML !==
           flagC[1].toString())
    document.getElementById("flag_B_C").className = "turning_off";
  else if (flagC[1] === 0)
    document.getElementById("flag_B_C").className = "inactive";
  else
    document.getElementById("flag_B_C").className = "active";
  document.getElementById("flag_B_C").innerHTML = flagC[1];
  const regbank_a = document.getElementsByClassName("regbank_a");
  const regbank_b = document.getElementsByClassName("regbank_b");
  for (const element of regbank_a)
    element.style.fontStyle = regbank === 0 ? "normal" : "italic";
  for (const element of regbank_b)
    element.style.fontStyle = regbank === 1 ? "normal" : "italic";
  if (document.getElementById("interrupt_flag").innerHTML !==
          flagIE.toString() &&
      flagIE)
    document.getElementById("interrupt_flag").className = "changed";
  else if (document.getElementById("interrupt_flag").innerHTML !==
           flagIE.toString())
    document.getElementById("interrupt_flag").className = "turning_off";
  else if (flagIE === 0)
    document.getElementById("interrupt_flag").className = "inactive";
  else
    document.getElementById("interrupt_flag").className = "active";
  document.getElementById("interrupt_flag").innerHTML = flagIE;
  document.getElementById("register_PC").innerHTML = formatAsAddress(PC);
}

function setUpLineNumbers() {
  const assemblyCode = document.getElementById("assemblyCode").innerText;
  const numberOfLines = Math.max((assemblyCode.match(/\n/g) || []).length, 1);
  let lineNumbersHTML = "";
  for (let i = 1; i <= numberOfLines; i++)
    lineNumbersHTML +=
        '<div id="label_line_' + i + '" data-linenumber="' + i +
        '"><img src="breakpoint.png" alt="BP" id="breakpoint_icon_' + i +
        '" class="breakpoint_icon"/>' + i + ".</div>";
  document.getElementById("lineNumbers").innerHTML = lineNumbersHTML;
  for (let i = 1; i <= numberOfLines; i++) {
    document.getElementById("label_line_" + i).onclick = (ev) => {
      setBreakpoint(ev, state.breakpoints)
    };
  }
  for (let i = 0; i < state.breakpoints.length; i++)
    if (state.breakpoints[i] <= numberOfLines)
      document.getElementById("breakpoint_icon_" + state.breakpoints[i])
          .style.display = "inline";
    else {
      state.breakpoints.splice(i, 1);
      i--;
    }
}
function setBreakpoint(event, breakpoints) {
  const lineNumber =
      parseInt(event.currentTarget.getAttribute("data-linenumber"));
  console.log("Setting/removing breakpoint on line #" + lineNumber + ".");
  if (breakpoints.includes(lineNumber)) {
    breakpoints.splice(breakpoints.indexOf(lineNumber), 1);
    document.getElementById("breakpoint_icon_" + lineNumber).style.display =
        "inline";
  } else {
    breakpoints.push(lineNumber);
    document.getElementById("breakpoint_icon_" + lineNumber).style.display =
        "none";
  }
}
function setupLayout(is_UART_enabled) {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  // Modern browsers execute
  // JavaScript so fast that
  // calling "window.innerWidth"
  // multiple times within a
  // function leads to a race
  // condition.
  if (windowWidth < 500)
    document.getElementsByTagName("main")[0].style.left = 8 + "px";
  else
    document.getElementsByTagName("main")[0].style.left =
        windowWidth / 2 - 500 / 2 + "px";
  if (windowHeight < 400) {
    document.getElementById("buttons").style.top =
        windowHeight + 200 + 3 * 4 + "px";
    document.getElementById("divWithMachineCode").style.top =
        windowHeight + 4 * 4 + 20 + 200 + "px";
    document.getElementById("simulationButtons").style.top =
        2 * windowHeight + 3 * 4 + 30 + 200 + "px";
    document.getElementsByTagName("footer")[0].style.top =
        65 + 4 + 2 * 50 + 3 * windowHeight + 200 + 210 + is_UART_enabled * 260 +
        50 + "px";
    document.getElementById("divWithExamples").style.top =
        windowHeight + 4 + "px";
    document.getElementById("simulationResults").style.top =
        windowHeight * 2 + 200 + 65 + 50 - 30 + 210 + is_UART_enabled * 260 +
        50 + "px";
    document.getElementById("graphicalResults").style.top =
        windowHeight * 2 + 200 + 65 + 50 - 30 + "px";
    document.getElementById("UART_enable_button").style.top =
        windowHeight * 2 + 200 + 65 + 50 - 30 + 210 +
        "px"; // Usually has no effect, see below...
    document.getElementById("UART_IO").style.top =
        windowHeight * 2 + 200 + 65 + 50 - 30 + 210 + 50 + "px";
  } else {
    document.getElementById("divWithExamples").style.top = 410 + "px";
    document.getElementById("buttons").style.top = 400 + 210 + 3 * 4 + "px";
    document.getElementById("divWithMachineCode").style.top = 450 + 210 + "px";
    document.getElementById("simulationButtons").style.top = 855 + 210 + "px";
    document.getElementById("simulationResults").style.top =
        910 + 2 * 210 + is_UART_enabled * 260 + 50 + "px";
    document.getElementById("UART_IO").style.top =
        910 + 2 * 210 + 50 + "px"; // Has no effect if the UART_IO is not shown
    // (and it isn't shown by default).
    document.getElementById("UART_enable_button").style.top =
        910 + 2 * 210 + "px";
    document.getElementById("graphicalResults").style.top = 910 + 210 + "px";
    document.getElementsByTagName("footer")[0].style.top =
        1380 + 2 * 210 + is_UART_enabled * 260 + 50 + "px";
  }
}
function formatAsAddress(n) {
  let ret = Math.round(n).toString(16);
  if (Math.round(n) >= 4096 || Math.round(n) < 0) {
    alert("Some part of the compiler tried to format the number " + n +
          " as an address, which makes no sense.");
    return "fff";
  }
  while (ret.length < 3)
    ret = "0" + ret;
  return ret;
}
function drawTable(machineCode, PC, is_UART_enabled) {
  let tableHTML = `
  <button id="downloadHex">Download Hexadecimal</button>
  <table id="machineCode">
     <tr>
       <th colspan="4">Machine Code</th>
     </tr>
     <tr>
       <th>PC</th>
       <th>Address</th>
       <th>Directive</th>
       <th>Line</th>
     </tr>
  `;
  for (let i = 0; i < machineCode.length; i++)
    tableHTML += `
      <tr>
        <td id="PC_label_${formatAsAddress(i)}">${PC === i ? "-&gt;" : " "}</td>
        <td>${formatAsAddress(i)}</td>
        <td>${machineCode[i].hex}</td>
        <td>${machineCode[i].line}</td>
      </tr>
    `;
  tableHTML += "</table>";
  document.getElementById("divWithMachineCode").innerHTML = tableHTML;
  let registersTable = `
<table style="font-size:0.95em;">
<tr>
<th>Registers</th>
  `;
  for (let i = 0; i < 16; i++)
    registersTable += "<th>s" + i.toString(16) + "</th>";
  registersTable += "<th>PC</th>";
  registersTable += '</tr><tr class="regbank_a"><th>REGBANK A</th>';
  for (let i = 0; i < 16; i++)
    registersTable += '<td id="register_A_s' + i.toString(16) + '">00</td>';
  registersTable +=
      '<td id="register_PC" rowspan=2>000</td></tr><tr class="regbank_b"><th>REGBANK B</th>';
  for (let i = 0; i < 16; i++)
    registersTable += '<td id="register_B_s' + i.toString(16) + '">00</td>';
  registersTable += "</tr></table>";
  let flagsTable = `
  <table>
    <tr>
      <th>Flags</th>
      <th>Zero (Z)</th>
      <th>Carry (C)</th>
      <th>Interrupt Enabled (IE)</th>
    </tr>
    <tr class="regbank_a">
      <th>REGBANK A</th>
      <td id="flag_A_Z">0</td>
      <td id="flag_A_C">0</td>
      <td id="interrupt_flag" rowspan="2">1</td>
    </tr>
    <tr class="regbank_b">
      <th>REGBANK B</th>
      <td id="flag_B_Z">0</td>
      <td id="flag_B_C">0</td>
    </tr>
  </table>
  <div style="text-align: center; font-family: Arial;">
  <b style="background: #FF7777; padding-left: 2px; padding-right:2px;">
  NOTE</b>:
  I have good reasons to think the emulation of flags is unrealistic,
  especially when it comes to <code>REGBANK</code>s.</div>`;
  let inputOutputTable = `
<table>
<tr>
<th>Address</th>
<th>Input</th>
<th>Output</th>
<th>Memory</th>
</tr>
  `;
  for (let i = 0; i < 256; i++)
    inputOutputTable += "<tr><th>" + formatAsByte(i) +
                        '</th><td><input id="input_' + formatAsByte(i) +
                        '" value="00"></td><td id="output_' + formatAsByte(i) +
                        '">00</td><td id="memory_' + formatAsByte(i) +
                        '">00</td></tr>';
  inputOutputTable += "</table>";
  let oldOnInput, oldInput00Value;
  if (document.getElementById("input_00")) {
    oldOnInput = document.getElementById("input_00").oninput;
    oldInput00Value = document.getElementById("input_00").value;
  }
  document.getElementById("simulationResults").innerHTML =
      registersTable + flagsTable + inputOutputTable;
  document.getElementById("input_00").oninput = oldOnInput;
  if (document.getElementById("input_00") &&
      typeof document.getElementById("input_00").oninput === "function") {
    document.getElementById("input_00").value = oldInput00Value;
    // Because, on real PicoBlaze, switches do not automatically switch
    // to 0 when assembling is done.
    document.getElementById("input_00").oninput();
  }
  document.getElementById("downloadHex").onclick = () => {
    let machineCode;

    //FIXME: cheating a bit here with the global but someone could click downloadHex before compilation
    if (typeof state == 'undefined' || typeof state.machineCode == 'undefined') {
      machineCode = initialMachineCode();
    } else {
      machineCode = state.machineCode;
    }
    downloadHex(machineCode);
  };
  document.getElementById("input_02").disabled = is_UART_enabled;
  document.getElementById("input_03").disabled = is_UART_enabled;
}
function downloadHex(machineCode) {
  /*
  Loosely based on:
  https://stackoverflow.com/a/33622881/8902065
  */
  let hexadecimalString = "";
  for (let i = 0; i < 4096; i++)
    hexadecimalString += machineCode[i].hex + "\r\n";
  let arrayOfBytes = new Uint8Array(hexadecimalString.length);
  for (let i = 0; i < hexadecimalString.length; i++)
    arrayOfBytes[i] = hexadecimalString.charCodeAt(i);
  const blob = new Blob([ arrayOfBytes ], {
    type : "application/binhex",
    endings : "transparent",
  });
  const url = URL.createObjectURL(blob);
  let link = document.createElement("a");
  link.href = url;
  link.download = "program.hex";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * TODO: STATE, or refactor to ports
 */
function displayOutput(output) {
  for (let i = 0; i < 2 ** 8; i++)
    document.getElementById("output_" + formatAsByte(i)).innerHTML =
        formatAsByte(output[i]);
  displayHexadecimalNumber(document.getElementById("sevenSegmentDisplay0"),
                           output[1] >> 4);
  displayHexadecimalNumber(document.getElementById("sevenSegmentDisplay1"),
                           output[1] % 2 ** 4);
  displayHexadecimalNumber(document.getElementById("sevenSegmentDisplay2"),
                           output[2] >> 4);
  displayHexadecimalNumber(document.getElementById("sevenSegmentDisplay3"),
                           output[2] % 2 ** 4);
  for (let i = 0; i < 8; i++)
    document.getElementById("LED" + i).setAttribute(
        "fill", output[0] & (1 << i) ? "lightGreen" : "#333333");
}
function displayHexadecimalNumber(display, number) {
  if (!(display instanceof SVGElement) ||
      display.classList[0] !== "sevenSegmentDisplay") {
    if (playing) //FIXME: throw here and stop simulation instead of using global
      clearInterval(simulationThread);
    alert(
        "The simulator crashed! Some part of the simulator attempted to display a hexadecimal number on something that's not an HTML element suited for that.");
    return;
  }
  if (number < 0 || number > 15 || typeof number !== "number") {
    if (playing) //FIXME: throw here and stop simulation instead of using global
      clearInterval(simulationThread);
    alert(
        'The simulator crashed! Some part of the simulator tried to display "' +
        number + '" as a hexadecimal digit.');
  }
  number = Math.floor(number);
  const LEDs = [
    "1111110", // 0
    "0110000", // 1
    "1101101", // 2
    "1111001", // 3
    "0110011", // 4
    "1011011", // 5
    "1011111", // 6
    "1110000", // 7
    "1111111", // 8
    "1111011", // 9
    "1110111", // A
    "0011111", // b
    "1001110", // c
    "0111101", // d
    "1001111", // E
    "1000111", // F
  ];
  const LED = LEDs[number];
  for (let i = 0; i < display.children.length; i++)
    display.children[i].setAttribute("fill",
                                     LED[i] === "0" ? "#333333" : "#ffaaaa");
}
function fetchExample(exampleName) {
  document.getElementById("assemblyCode").innerHTML =
      ";Fetching the example from GitHub...";
  setUpLineNumbers();
  fetch(URL_prefix_of_the_examples + exampleName)
      .then((response) => {
        if (!response.ok)
          throw new Error(response.status);
        else
          return response.text();
      })
      .then((text) => {
        document.getElementById("assemblyCode").innerHTML = text;
        setUpLineNumbers();
      })
      .catch((error) =>
                 alert("Fetching the example code from GitHub unsuccessful! " +
                       error));
}
