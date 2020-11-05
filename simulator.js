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
        parseInt(machineCode[PC].hex.substr(3), 16);
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "16") {
    // STAR register,constant ;Storing a constant into an inactive register
    registers[!regbank | 0 /*That is how you convert a boolean to an integer in
                                               JavaScript.*/
    ][parseInt(machineCode[PC].hex[2], 16)] =
        parseInt(machineCode[PC].hex.substr(3), 16);
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
        registers[regbank][parseInt(machineCode[PC].hex[2], 16)];
    for (const sElement of (
             document.getElementById("memory_" + machineCode[PC].hex.substr(3))
                 .innerHTML = formatAsByte(
                 registers[regbank][parseInt(machineCode[PC].hex[2], 16)]))) {
    }
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "0a") {
    // FETCH register,(register) ;Dereference the pointer in the second
    // register.
    registers[regbank][parseInt(machineCode[PC].hex[2], 16)] =
        memory[registers[regbank][parseInt(machineCode[PC].hex[3], 16)]];
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "0b") {
    // FETCH register,memory_address ;Copy the value at memory_address to the
    // register.
    registers[regbank][parseInt(machineCode[PC].hex[2], 16)] =
        memory[parseInt(machineCode[PC].hex.substr(3), 16)];
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "08") {
    // INPUT register,(register) ;Read a byte from a port specified by a
    // register.
    registers[regbank][parseInt(machineCode[PC].hex[2], 16)] = parseInt(
        document
            .getElementById(
                "input_" +
                formatAsByte(
                    registers[regbank][parseInt(machineCode[PC].hex[3], 16)]))
            .value,
        16);
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "09") {
    // INPUT register, port_number
    registers[regbank][parseInt(machineCode[PC].hex[2], 16)] = parseInt(
        document.getElementById("input_" + machineCode[PC].hex.substr(3)).value,
        16);
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "2c") {
    // OUTPUT register,(register) ;Output the result of the first register to
    // the port specified by the second register.
    output[registers[regbank][parseInt(machineCode[PC].hex[3], 16)]] =
        registers[regbank][parseInt(machineCode[PC].hex[2], 16)];
    displayOutput();
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "2d") {
    // OUTPUT register, port_number
    output[parseInt(machineCode[PC].hex.substr(3), 16)] =
        registers[regbank][parseInt(machineCode[PC].hex[2], 16)];
    displayOutput();
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "2b") {
    // OUTPUTK constant, port_number
    output[parseInt(machineCode[PC].hex[4], 16)] =
        parseInt(machineCode[PC].hex.substr(2, 2), 16);
    displayOutput();
    PC++;
  } else if (machineCode[PC].hex === "37000") {
    // REGBANK A
    regbank = 0;
    PC++;
  } else if (machineCode[PC].hex === "37001") {
    // REGBANK B
    regbank = 1;
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "22") {
    // JUMP label
    PC = parseInt(machineCode[PC].hex.substr(3), 16);
  } else if (machineCode[PC].hex.substr(0, 2) === "14") {
    // HWBUILD register
    flagC[regbank] =
        1; // Have a better idea? We can't simulate all of what this directive
           // does, but we can simulate this part of it.
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "10") {
    // ADD register, register
    const firstRegister = parseInt(machineCode[PC].hex[2], 16);
    const secondRegister = parseInt(machineCode[PC].hex[3], 16);
    const firstValue = registers[regbank][firstRegister];
    const secondValue = registers[regbank][secondRegister];
    if ((firstValue + secondValue) % 256 === 0)
      flagZ[regbank] = 1;
    else
      flagZ[regbank] = 0;
    if (firstValue + secondValue > 255)
      flagC[regbank] = 1;
    else
      flagC[regbank] = 0;
    registers[regbank][firstRegister] += secondValue;
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "11") {
    // ADD register, constant
    const firstRegister = parseInt(machineCode[PC].hex[2], 16);
    const firstValue = registers[regbank][firstRegister];
    const secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
    if ((firstValue + secondValue) % 256 === 0)
      flagZ[regbank] = 1;
    else
      flagZ[regbank] = 0;
    if (firstValue + secondValue > 255)
      flagC[regbank] = 1;
    else
      flagC[regbank] = 0;
    registers[regbank][firstRegister] += secondValue;
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "12") {
    // ADDCY register, register
    const firstRegister = parseInt(machineCode[PC].hex[2], 16);
    const secondRegister = parseInt(machineCode[PC].hex[3], 16);
    const firstValue = registers[regbank][firstRegister];
    const secondValue = registers[regbank][secondRegister];
    const result = firstValue + secondValue + flagC[regbank];
    if (result % 256 === 0)
      flagZ[regbank] = 1;
    else
      flagZ[regbank] = 0;
    if (result > 255)
      flagC[regbank] = 1;
    else
      flagC[regbank] = 0;
    registers[regbank][firstRegister] = result;
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "12") {
    // ADDCY register, constant
    const firstRegister = parseInt(machineCode[PC].hex[2], 16);
    const firstValue = registers[regbank][firstRegister];
    const secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
    const result = firstValue + secondValue + flagC[regbank];
    if (result % 256 === 0)
      flagZ[regbank] = 1;
    else
      flagZ[regbank] = 0;
    if (result > 255)
      flagC[regbank] = 1;
    else
      flagC[regbank] = 0;
    registers[regbank][firstRegister] = result;
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "18") {
    // SUB register, register
    const firstRegister = parseInt(machineCode[PC].hex[2], 16);
    const secondRegister = parseInt(machineCode[PC].hex[3], 16);
    const firstValue = registers[regbank][firstRegister];
    const secondValue = registers[regbank][secondRegister];
    const result = firstValue - secondValue;
    if (result % 256 === 0)
      flagZ[regbank] = 1;
    else
      flagZ[regbank] = 0;
    if (result < 0)
      flagC[regbank] = 1;
    else
      flagC[regbank] = 0;
    registers[regbank][firstRegister] = result;
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "19") {
    // SUB register, constant
    const firstRegister = parseInt(machineCode[PC].hex[2], 16);
    const firstValue = registers[regbank][firstRegister];
    const secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
    const result = firstValue - secondValue;
    if (result % 256 === 0)
      flagZ[regbank] = 1;
    else
      flagZ[regbank] = 0;
    if (result < 0)
      flagC[regbank] = 1;
    else
      flagC[regbank] = 0;
    registers[regbank][firstRegister] = result;
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "1a") {
    // SUBCY register, register
    const firstRegister = parseInt(machineCode[PC].hex[2], 16);
    const secondRegister = parseInt(machineCode[PC].hex[3], 16);
    const firstValue = registers[regbank][firstRegister];
    const secondValue = registers[regbank][secondRegister];
    const result = firstValue - secondValue - flagC[regbank];
    if (result % 256 === 0)
      flagZ[regbank] = 1;
    else
      flagZ[regbank] = 0;
    if (result < 0)
      flagC[regbank] = 1;
    else
      flagC[regbank] = 0;
    registers[regbank][firstRegister] = result;
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "1b") {
    // SUBCY register, constant
    const firstRegister = parseInt(machineCode[PC].hex[2], 16);
    const firstValue = registers[regbank][firstRegister];
    const secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
    const result = firstValue - secondValue - flagC[regbank];
    if (result % 256 === 0)
      flagZ[regbank] = 1;
    else
      flagZ[regbank] = 0;
    if (result < 0)
      flagC[regbank] = 1;
    else
      flagC[regbank] = 0;
    registers[regbank][firstRegister] = result;
    PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "32") {
    if (flagZ[regbank])
      PC = parseInt(machineCode[PC].hex.substr(3), 16);
    else
      PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "36") {
    if (!flagZ[regbank])
      PC = parseInt(machineCode[PC].hex.substr(3), 16);
    else
      PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "3a") {
    if (flagC[regbank])
      PC = parseInt(machineCode[PC].hex.substr(3), 16);
    else
      PC++;
  } else if (machineCode[PC].hex.substr(0, 2) === "3e") {
    if (!flagC[regbank])
      PC = parseInt(machineCode[PC].hex.substr(3), 16);
    else
      PC++;
  } else {
    alert(
        'Sorry about that, the simulator currently does not support the instruction "' +
        machineCode[PC].hex + '", assembled from line #' +
        machineCode[PC].line + ".");
    stopSimulation();
  }
  displayRegistersAndFlags();
  document.getElementById("PC_label_" + formatAsAddress(PC)).innerHTML =
      "-&gt;";
}
