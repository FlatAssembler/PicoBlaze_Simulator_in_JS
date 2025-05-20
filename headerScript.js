"use strict";
let is_UART_enabled = false, areWeHighlighting = false, playing = false;
let registers = [ new Uint8Array(16), new Uint8Array(16) ], flagZ = [ 0, 0 ],
    flagC = [ 0, 0 ], flagIE = 1, output = new Uint8Array(256),
    memory = new Uint8Array(256), regbank = 0, callStack = [], breakpoints = [],
    currentlyReadCharacterInUART = 0;
let simulationThread;
let machineCode = [];
for (let i = 0; i < 4096; i++)
  machineCode.push({hex : "00000", line : 0});
let default_base_of_literals_in_assembly = 16;
function displayRegistersAndFlags() {
  if (playing && !document.getElementById("shouldWeUpdateRegisters").checked)
    return;
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
function highlightToken(token) {
  if (token[0] === ";")
    return `<span class="comment">${token}</span>`;
  for (const mnemonic of mnemonics)
    if (RegExp("^" + mnemonic + "$", "i").test(token) ||
        /^interrupt$/i.test(token))
      return `<span class="mnemonic">${token}</span>`;
  for (const directive of preprocessor)
    if (RegExp("^" + directive + "$", "i").test(token))
      return `<span class="directive">${token}</span>`;
  if (/^s(\d|[a-f])$/i.test(token))
    return `<span class="register">${token}</span>`;
  if (/^N?[CZAB]$/i.test(token))
    // TODO: This actually sometimes incorrectly highlights "a" as
    // a flag, when it is in fact a hexadecimal constant. You can
    // read more about it here:
    // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/6
    return `<span class="flag">${token}</span>`;
  if (/:$/.test(token) && token.length > 1)
    return `<span class="label">${token}</span>`;
  if (token[0] === '"')
    return `<span class="string">${token}</span>`;
  if (/^(\d|[a-f])+$/i.test(token) || /\'d$/.test(token) ||
      /\'b$/.test(token) || /\'o$/.test(token) ||
      /\'x$/.test(token))
    return `<span class="number">${token}</span>`;
  return token;
}
function syntaxHighlighter(/*edit*/) {
  //"edit" should contain the cursor position, but that seems not to work.
  // I have opened a StackOverflow question about that:
  // https://stackoverflow.com/q/76566400/8902065
  if (areWeHighlighting)
    return;
  areWeHighlighting = true;
  const assemblyCodeDiv = document.getElementById("assemblyCode");
  const assemblyCode =
      assemblyCodeDiv.innerText.replace(/&/g, "&amp;")
          .replace(
              /</g,
              "&lt;") // This appears to cause this bug:
                      // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/7
          .replace(/>/g, "&gt;");
  // const start=edit.selectionStart,
  //  end=edit.selectionEnd; //Cursor position.
  if (assemblyCode.indexOf("&") != -1) {
    alert(
        "Sorry about that, but syntax highlighting of the programs containing `<`, `&`, and `>` is not supported yet.");
    areWeHighlighting = false;
    return;
  }
  let areWeInAString = false;
  let areWeInAComment = false;
  let currentToken = "";
  let highlightedText = "";
  for (let i = 0; i < assemblyCode.length; i++) {
    if (assemblyCode[i] === ";" && !areWeInAString) {
      highlightedText += highlightToken(currentToken);
      currentToken = ";";
      areWeInAComment = true;
      continue;
    }
    if (areWeInAComment && assemblyCode[i] !== "\n") {
      currentToken += assemblyCode[i];
      continue;
    }
    if (assemblyCode[i] === "\n") {
      areWeInAString = false;
      areWeInAComment = false;
      highlightedText += highlightToken(currentToken) + "<br/>";
      currentToken = "";
      continue;
    }
    if (assemblyCode[i] === ":" && !areWeInAString) {
      highlightedText += highlightToken(currentToken + assemblyCode[i]);
      currentToken = "";
      continue;
    }
    if ((assemblyCode[i] === " " || assemblyCode[i] === "\t" ||
         assemblyCode[i] === "," || assemblyCode[i] === "+" ||
         assemblyCode[i] === "-" || assemblyCode[i] === "*" ||
         assemblyCode[i] === "/" || assemblyCode[i] === "^" ||
         assemblyCode[i] === '?') &&
        !areWeInAString) {
      highlightedText += highlightToken(currentToken) + assemblyCode[i];
      currentToken = "";
      continue;
    }
    if (assemblyCode[i] === '"' && !areWeInAString) {
      highlightedText += highlightToken(currentToken);
      currentToken = '"';
      areWeInAString = true;
      continue;
    }
    if ((assemblyCode[i] === "(" || assemblyCode[i] === ")" ||
         assemblyCode[i] === "[" || assemblyCode[i] === "]" ||
         assemblyCode[i] === "{" || assemblyCode[i] === "}") &&
        !areWeInAString) {
      highlightedText += highlightToken(currentToken) +
                         '<span class="parenthesis">' + assemblyCode[i] +
                         "</span>";
      currentToken = "";
      continue;
    }
    if (assemblyCode[i] !== '"') {
      currentToken += assemblyCode[i];
      continue;
    }
    if (assemblyCode[i] === '"' && areWeInAString) {
      highlightedText += highlightToken(currentToken + '"');
      currentToken = "";
      areWeInAString = false;
    }
  }
  highlightedText += highlightToken(currentToken);
  assemblyCodeDiv.innerHTML = highlightedText;
  // The following code is supposed to move the cursor to the correct
  // position, but it doesn't work.
  /*
  const range=document.createRange();
  range.setStart(assemblyCodeDiv,start);
  range.setEnd(assemblyCodeDiv,end);
  const selection=window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  */
  setUpLineNumbers();
  areWeHighlighting = false;
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
  for (let i = 1; i <= numberOfLines; i++)
    document.getElementById("label_line_" + i).onclick = setBreakpoint;
  for (let i = 0; i < breakpoints.length; i++)
    if (breakpoints[i] <= numberOfLines)
      document.getElementById("breakpoint_icon_" + breakpoints[i])
          .style.display = "inline";
    else {
      breakpoints.splice(i, 1);
      i--;
    }
}
function setBreakpoint(event) {
  const lineNumber =
      parseInt(event.currentTarget.getAttribute("data-linenumber"));
  console.log("Setting/removing breakpoint on line #" + lineNumber + ".");
  if (breakpoints.includes(lineNumber))
    breakpoints.splice(breakpoints.indexOf(lineNumber), 1);
  else
    breakpoints.push(lineNumber);
  if (breakpoints.includes(lineNumber))
    document.getElementById("breakpoint_icon_" + lineNumber).style.display =
        "inline";
  else
    document.getElementById("breakpoint_icon_" + lineNumber).style.display =
        "none";
}
function setupLayout() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  // Modern browsers execute JavaScript so fast that calling "window.innerWidth"
  // multiple times within a function leads to a race condition.
  if (windowWidth < 500) {
    document.getElementsByTagName("main")[0].style.left = 8 + "px";
  } else {
    document.getElementsByTagName("main")[0].style.left =
        windowWidth / 2 - 500 / 2 + "px";
  }
  if (windowHeight < 400) {
    document.getElementById("buttons").style.top =
        windowHeight + 200 + 3 * 4 + "px";
    document.getElementById("whyClickAssemble").style.top =
        windowHeight + 200 + 3 * 4 + 20 + 5 + "px";
    const heightOfTheDivWithTheInstructionAboutAssembling =
        document.getElementById("whyClickAssemble").clientHeight;
    document.getElementById("divWithMachineCode").style.top =
        windowHeight + 4 * 4 + 20 + 200 +
        heightOfTheDivWithTheInstructionAboutAssembling + "px";
    document.getElementById("simulationButtons").style.top =
        2 * windowHeight + 3 * 4 + 30 + 200 +
        heightOfTheDivWithTheInstructionAboutAssembling + "px";
    document.getElementsByTagName("footer")[0].style.top =
        65 + 4 + 2 * 50 + 3 * windowHeight + 200 + 210 + is_UART_enabled * 260 +
        50 + heightOfTheDivWithTheInstructionAboutAssembling + "px";
    document.getElementById("divWithExamples").style.top =
        windowHeight + 4 + "px";
    document.getElementById("simulationResults").style.top =
        windowHeight * 2 + 200 + 65 + 50 - 30 + 210 + is_UART_enabled * 260 +
        50 + heightOfTheDivWithTheInstructionAboutAssembling + "px";
    document.getElementById("graphicalResults").style.top =
        windowHeight * 2 + heightOfTheDivWithTheInstructionAboutAssembling +
        200 + 65 + 50 - 30 + "px";
    document.getElementById("UART_enable_button").style.top =
        windowHeight * 2 + 200 + 65 + 50 - 30 + 210 +
        heightOfTheDivWithTheInstructionAboutAssembling +
        "px"; // Usually has no effect, see below...
    document.getElementById("UART_IO").style.top =
        windowHeight * 2 + 200 + 65 + 50 - 30 + 210 + 50 +
        heightOfTheDivWithTheInstructionAboutAssembling + "px";
  } else {
    document.getElementById("divWithExamples").style.top = 410 + "px";
    document.getElementById("buttons").style.top = 400 + 210 + 3 * 4 + "px";
    document.getElementById("whyClickAssemble").style.top =
        400 + 210 + 3 * 4 + 30 + "px";
    const heightOfTheDivWithTheInstructionAboutAssembling =
        document.getElementById("whyClickAssemble").clientHeight;
    document.getElementById("divWithMachineCode").style.top =
        450 + 210 + heightOfTheDivWithTheInstructionAboutAssembling + "px";
    document.getElementById("simulationButtons").style.top =
        855 + 210 + heightOfTheDivWithTheInstructionAboutAssembling + "px";
    document.getElementById("simulationResults").style.top =
        910 + 2 * 210 + is_UART_enabled * 260 + 50 +
        heightOfTheDivWithTheInstructionAboutAssembling + "px";
    document.getElementById("UART_IO").style.top =
        910 + 2 * 210 + 50 + heightOfTheDivWithTheInstructionAboutAssembling +
        "px"; // Has no effect if the UART_IO is not shown
              // (and it isn't shown by default).
    document.getElementById("UART_enable_button").style.top =
        910 + 2 * 210 + heightOfTheDivWithTheInstructionAboutAssembling + "px";
    document.getElementById("graphicalResults").style.top =
        910 + 210 + heightOfTheDivWithTheInstructionAboutAssembling + "px";
    document.getElementsByTagName("footer")[0].style.top =
        1380 + 2 * 210 + is_UART_enabled * 260 + 50 + 20 +
        heightOfTheDivWithTheInstructionAboutAssembling + "px";
  }
  if (/WebPositive/.test(
          navigator.userAgent)) { // WebPositive prints the #authors in such a
                                  // small font it's illegible.
    document.getElementById("authors").style.fontSize = "1.3em";
  }
  if (window.onscroll)
    window.onscroll();
}
let PC = 0;
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
function deletePCpointer() {
  if (document.getElementById("shouldWeUpdateRegisters").checked)
    return;
  for (let i = 0; i < machineCode.length; i++)
    document.getElementById("PC_label_" + formatAsAddress(i)).innerHTML = "";
}
function drawTable() {
  let tableHTML = `
  <button id="downloadHex"><img src="https://icons.getbootstrap.com/assets/icons/download.svg" alt="Download Hexadecimal"></button>
  <div id="warningAboutDownloadingHexadecimal">Clicking the button above will download the hexadecimal (<code>.HEX</code>) file, in the same format that the Xilinx PicoBlaze Assembler outputs. You need to convert it to a binary file before uploading it to PicoBlaze. I am sorry that this program is not outputting binary files, but there is no obvious way to do it since PicoBlaze instructions are 18-bit and the smallest addressable memory unit in JavaScript is byte (8 bits), and 18 bits is not divisible by bytes.</div>
  <table id="machineCode" style="border-collapse: separate; border-spacing: 0;">
     <tr>
       <th colspan="4">Machine Code</th>
     </tr>
     <tr>
       <th class="sticky-header">PC</th>
       <th class="sticky-header">Address</th>
       <th class="sticky-header">Directive</th>
       <th class="sticky-header">Line</th>
     </tr>
  `;
  for (let i = 0; i < machineCode.length; i++)
    tableHTML += `
      <tr>
        <td id="PC_label_${formatAsAddress(i)}">${
        PC === i
            ? "<img src=\"https://icons.getbootstrap.com/assets/icons/arrow-right.svg\" alt=\"-&gt;\">"
            : " "}</td>
        <td>${formatAsAddress(i)}</td>
        <td>${machineCode[i].hex}</td>
        <td>${machineCode[i].line}</td>
      </tr>
    `;
  tableHTML += "</table>";
  document.getElementById("divWithMachineCode").innerHTML = tableHTML;
  let registersTable = `
<table style="border: none;">
<tr><td style="border-right: none;"><input type="checkbox" id="shouldWeUpdateRegisters" ${
      is_UART_enabled ? "" : "checked"} onchange="deletePCpointer()" /></td>
<td style="text-align:left; border-left: none;"><label for="shouldWeUpdateRegisters">Update registers and flags on every step</label></td></tr>
<tr><td colspan="2" style="font-family: Arial; text-align: justify; font-weight: normal; border-top: none;">
Displaying registers and flags on every step is useful for debugging, but it slows the simulation down. I would not recommend you to enable UART and updating the registers and flags at the same time.
</td></tr></table>
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
<table style="border-collapse: separate; border-spacing: 0;">
<tr>
<th class="sticky-header">Address</th>
<th class="sticky-header">Input</th>
<th class="sticky-header">Output</th>
<th class="sticky-header">Memory</th>
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
  document.getElementById("downloadHex").onclick = downloadHex;
  document.getElementById("input_02").disabled =
      document.getElementById("input_03").disabled = is_UART_enabled;
}
function downloadHex() {
  if (!hasTheCodeBeenAssembled) {
    if (!confirm(
            "The code has not been assembled. Do you really want to proceed downloading the hexadecimal file?"))
      return;
  } else if (
      hasTheCodeBeenModifiedSinceLastSuccessfulAssembly) // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/28
  {
    if (!confirm(
            "The code has been modified since the last successful assembling. Are you sure you want to proceed downloading the hexadecimal file?"))
      return;
  }
  if (/WebPositive/.test(navigator.userAgent))
    alert(
        "It's detected you are using WebPositive. 'Download Hexadecimal' didn't work there when we tested it.");

  /*
  The following code is loosely based on:
  https://stackoverflow.com/a/33622881/8902065
  */
  let hexadecimalString = "";
  for (let i = 0; i < 2 ** 12; i++)
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
function displayOutput() {
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
        "fill", output[0] & (1 << i) ? "lightGreen" : "#333");
}
function displayHexadecimalNumber(display, number) {
  if (!(display instanceof SVGElement) ||
      display.classList[0] !== "sevenSegmentDisplay") {
    if (playing)
      clearInterval(simulationThread);
    alert(
        "The simulator crashed! Some part of the simulator attempted to display a hexadecmal number on something that's not an HTML element suited for that.");
    return;
  }
  if (number < 0 || number > 15 || typeof number !== "number") {
    if (playing)
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
  hasTheCodeBeenModifiedSinceLastSuccessfulAssembly =
      true; // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/29
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
