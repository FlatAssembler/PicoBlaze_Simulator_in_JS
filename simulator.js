"use strict";
function simulateOneInstruction() {
  document.getElementById("PC_label_" + formatAsAddress(PC)).innerHTML = "";
  if (machineCode[PC].hex.substr(0, 2) === "00") {
    // LOAD register,register
    registers[regbank][parseInt(machineCode[PC].hex[2], 16)] =
        registers[regbank][parseInt(machineCode[PC].hex[3], 16)];
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "01") {
    // LOAD register,constant
    registers[regbank][parseInt(machineCode[PC].hex[2], 16)] =
        parseInt(machineCode[PC].hex.substr(3));
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "16") {
    // STAR register,constant ;Storing a constant into an inactive register
    registers[!regbank | 0 /*That is how you convert a boolean to an integer in
                              JavaScript.*/
    ][parseInt(machineCode[PC].hex[2], 16)] =
        parseInt(machineCode[PC].hex.substr(3));
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "17") {
    // STAR register,register ;Copying from an active register into an inactive
    // one.
    registers[!regbank | 0][parseInt(machineCode[PC].hex[2], 16)] =
        registers[regbank][parseInt(machineCode[PC].hex[3], 16)];
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "2e") {
    // STORE register,(register) ;Store the first register at the memory
    // location where the second register points to.
    memory[registers[regbank][parseInt(machineCode[PC].hex[3], 16)]] =
        registers[regbank][parseInt(machineCode[PC].hex[2], 16)];
    document
        .getElementById(
            "memory_" +
            formatAsByte(
                registers[regbank][parseInt(machineCode[PC].hex[3], 16)]))
        .innerHTML =
        formatAsByte(registers[regbank][parseInt(machineCode[PC].hex[2], 16)]);
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "2f") {
    // STORE register,memory_address ;Copy a register onto a memory address.
    memory[parseInt(machineCode[PC].hex.substr(3), 16)] =
        registers[regbank][parseInt(machineCode[PC].hex[2])];
    document.getElementById("memory_" + machineCode[PC].hex.substr(3))
        .innerHTML =
        formatAsByte(registers[regbank][parseInt(machineCode[PC].hex[2], 16)]);
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "0a") {
    // FETCH register,(register) ;Dereference the pointer in the second
    // register.
    registers[regbank][parseInt(machineCode[PC].hex[2])] =
        memory[registers[regbank][parseInt(machineCode[PC].hex[3])]];
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "0b") {
    // FETCH register,memory_address ;Copy the value at memory_address to the
    // register.
    registers[regbank][parseInt(machineCode[PC].hex[2])] =
        memory[parseInt(machineCode[PC].hex.substr(3))];
    PC++;
  } else {
    alert(
        'Sorry about that, the simulator currently does not support the instruction "' +
        machineCode[PC].hex + '", assembled from line #' +
        machineCode[PC].line + ".");
    stopSimulation();
  }
  displayRegistersAndFlags();
  document.getElementById("PC_label_" + formatAsAddress(PC)).innerHTML = "-&gt;";
}
