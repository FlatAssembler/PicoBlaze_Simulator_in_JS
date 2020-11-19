"use strict";
function simulateOneInstruction() {
  try {
    PC = PC %
         4096; // If you are at the end of a program, and there is no "return"
    // there, jump to the beginning of the program. I think that's
    // how PicoBlaze behaves, though I haven't tried it.
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
      registers[!regbank | 0 /*That is how you convert a boolean to an integer
                                in JavaScript.*/
      ][parseInt(machineCode[PC].hex[2], 16)] =
          parseInt(machineCode[PC].hex.substr(3), 16);
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "17") {
      // STAR register,register ;Copying from an active register into an
      // inactive one.
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
          .innerHTML = formatAsByte(
          registers[regbank][parseInt(machineCode[PC].hex[2], 16)]);
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "2f") {
      // STORE register,memory_address ;Copy a register onto a memory address.
      memory[parseInt(machineCode[PC].hex.substr(3), 16)] =
          registers[regbank][parseInt(machineCode[PC].hex[2], 16)];
      document.getElementById("memory_" + machineCode[PC].hex.substr(3))
          .innerHTML = formatAsByte(
          registers[regbank][parseInt(machineCode[PC].hex[2], 16)]);
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
          document.getElementById("input_" + machineCode[PC].hex.substr(3))
              .value,
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
      PC = parseInt(machineCode[PC].hex.substr(2), 16);
    } else if (machineCode[PC].hex.substr(0, 2) === "14" &&
               machineCode[PC].hex.substr(3) == "80") {
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
    } else if (machineCode[PC].hex.substr(0, 2) === "13") {
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
    } else if (machineCode[PC].hex.substr(0, 2) === "03") {
      // AND register, constant
      const firstRegister = parseInt(machineCode[PC].hex[2], 16);
      const firstValue = registers[regbank][firstRegister];
      const secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
      const result = firstValue & secondValue;
      if (result % 256 === 0)
        flagZ[regbank] = 1;
      else
        flagZ[regbank] = 0;
      if (result % 256 === 255)
        flagC[regbank] = 1;
      else
        flagC[regbank] = 0;
      registers[regbank][firstRegister] = result;
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "02") {
      // AND register, register
      const firstRegister = parseInt(machineCode[PC].hex[2], 16);
      const secondRegister = parseInt(machineCode[PC].hex[3], 16);
      const firstValue = registers[regbank][firstRegister];
      const secondValue = registers[regbank][secondRegister];
      const result = firstValue & secondValue;
      if (result % 256 === 0)
        flagZ[regbank] = 1;
      else
        flagZ[regbank] = 0;
      if (result % 256 === 255)
        flagC[regbank] = 1;
      else
        flagC[regbank] = 0;
      registers[regbank][firstRegister] = result;
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "04") {
      // OR register, register
      const firstRegister = parseInt(machineCode[PC].hex[2], 16);
      const secondRegister = parseInt(machineCode[PC].hex[3], 16);
      const firstValue = registers[regbank][firstRegister];
      const secondValue = registers[regbank][secondRegister];
      const result = firstValue | secondValue;
      if (result % 256 === 0)
        flagZ[regbank] = 1;
      else
        flagZ[regbank] = 0;
      if (result % 256 === 255)
        flagC[regbank] = 1;
      else
        flagC[regbank] = 0;
      registers[regbank][firstRegister] = result;
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "05") {
      // OR register, constant
      const firstRegister = parseInt(machineCode[PC].hex[2], 16);
      const firstValue = registers[regbank][firstRegister];
      const secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
      const result = firstValue | secondValue;
      if (result % 256 === 0)
        flagZ[regbank] = 1;
      else
        flagZ[regbank] = 0;
      if (result % 256 === 255)
        flagC[regbank] = 1;
      else
        flagC[regbank] = 0;
      registers[regbank][firstRegister] = result;
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "06") {
      // XOR register, register
      const firstRegister = parseInt(machineCode[PC].hex[2], 16);
      const secondRegister = parseInt(machineCode[PC].hex[3], 16);
      const firstValue = registers[regbank][firstRegister];
      const secondValue = registers[regbank][secondRegister];
      const result = firstValue ^ secondValue;
      if (result % 256 === 0)
        flagZ[regbank] = 1;
      else
        flagZ[regbank] = 0;
      if (result % 256 === 255)
        flagC[regbank] = 1;
      else
        flagC[regbank] = 0;
      registers[regbank][firstRegister] = result;
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "07") {
      // XOR register, constant
      const firstRegister = parseInt(machineCode[PC].hex[2], 16);
      const firstValue = registers[regbank][firstRegister];
      const secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
      const result = firstValue ^ secondValue;
      if (result % 256 === 0)
        flagZ[regbank] = 1;
      else
        flagZ[regbank] = 0;
      if (result % 256 === 255)
        flagC[regbank] = 1;
      else
        flagC[regbank] = 0;
      registers[regbank][firstRegister] = result;
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "0c" ||
               machineCode[PC].hex.substr(0, 2) === "0e") {
      // TEST register, register ;The same as "AND", but does not store the
      // result (only the flags). I am not sure if there is a difference between
      // "0c" and "0e", they appear to be the same.
      const firstRegister = parseInt(machineCode[PC].hex[2], 16);
      const secondRegister = parseInt(machineCode[PC].hex[3], 16);
      const firstValue = registers[regbank][firstRegister];
      const secondValue = registers[regbank][secondRegister];
      const result = firstValue & secondValue;
      if (result % 256 === 0)
        flagZ[regbank] = 1;
      else
        flagZ[regbank] = 0;
      if (result % 256 === 255)
        flagC[regbank] = 1;
      else
        flagC[regbank] = 0;
      // registers[regbank][firstRegister] = result;
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "0d" ||
               machineCode[PC].hex.substr(0, 2) == "0f") {
      // TEST register, constant
      const firstRegister = parseInt(machineCode[PC].hex[2], 16);
      const firstValue = registers[regbank][firstRegister];
      const secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
      const result = firstValue & secondValue;
      if (result % 256 === 0)
        flagZ[regbank] = 1;
      else
        flagZ[regbank] = 0;
      if (result % 256 === 255)
        flagC[regbank] = 1;
      else
        flagC[regbank] = 0;
      // registers[regbank][firstRegister] = result;
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "1c") {
      // COMPARE register, register
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
      // registers[regbank][firstRegister] = result;
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "1d") {
      // COMPARE register, constant
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
      // registers[regbank][firstRegister] = result;
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "1e") {
      // COMPARECY register, register
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
      // registers[regbank][firstRegister] = result;
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "1f") {
      // COMPARECY register, constant
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
      // registers[regbank][firstRegister] = result;
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "14") {
      // Bit-shifting operations...
      const registerIndex = parseInt(machineCode[PC].hex[2], 16);
      let registerValue = registers[regbank][registerIndex];
      console.log("DEBUG: Shifting the bits in register s" +
                  registerIndex.toString(16));
      const set_flags_after_shift_left = () => {
        flagC[regbank] = (registerValue > 255) | 0;
        flagZ[regbank] = (registerValue % 256 === 0) | 0;
      };
      const set_flags_before_shift_right = () => {
        flagC[regbank] = registerValue % 2;
        flagZ[regbank] = (Math.floor(registerValue / 2) === 0) | 0;
      };
      switch (machineCode[PC].hex.substr(3)) {
      case "06": // SL0
        registerValue <<= 1;
        set_flags_after_shift_left();
        break;
      case "07": // SL1
        registerValue = (registerValue << 1) + 1;
        set_flags_after_shift_left();
        break;
      case "04": // SLX
        registerValue = (registerValue << 1) + (registerValue % 2);
        set_flags_after_shift_left();
        break;
      case "00": // SLA
        registerValue = (registerValue << 1) + flagC[regbank];
        set_flags_after_shift_left();
        break;
      case "02": // RL
        registerValue = (registerValue << 1) + Math.floor(registerValue / 128);
        set_flags_after_shift_left();
        break;
      case "0e": // SR0
        set_flags_before_shift_right();
        registerValue >>= 1;
        break;
      case "0f": // SR1
        set_flags_before_shift_right();
        registerValue = (registerValue >> 1) + 128;
        break;
      case "0a": // SRX
        set_flags_before_shift_right();
        registerValue =
            (registerValue >> 1) + Math.floor(registerValue / 128) * 128;
        break;
      case "08": // SRA
        const oldFlagC = flagC[regbank];
        set_flags_before_shift_right();
        registerValue = (registerValue >> 1) + oldFlagC;
        break;
      case "0c": // RR
        set_flags_before_shift_right();
        registerValue = (registerValue >> 1) + 128 * (registerValue % 2);
        break;
      default:
        alert('The instruction "' + machineCode[PC].hex +
              '", assembled from line #' + machineCode[PC].line +
              ", hasn't been implemented yet, sorry about that!");
      }
      registers[regbank][registerIndex] = registerValue;
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "32") {
      // JUMP Z, label
      if (flagZ[regbank])
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      else
        PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "36") {
      // JUMP NZ, label
      if (!flagZ[regbank])
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      else
        PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "3a") {
      // JUMP C, label
      if (flagC[regbank])
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      else
        PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "3e") {
      // JUMP NC, label
      if (!flagC[regbank])
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      else
        PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "26") {
      // JUMP@ (register, register) ; Jump to the address pointed by the
      // registers (something like function pointers, except that "return" won't
      // work).
      const firstRegister = parseInt(machineCode[PC].hex[2], 16);
      const secondRegister = parseInt(machineCode[PC].hex[3], 16);
      const firstValue = registers[regbank][firstRegister];
      const secondValue = registers[regbank][secondRegister];
      PC = firstValue % 16 * 256 + secondValue;
    } else if (machineCode[PC].hex.substr(0, 2) === "20") {
      // CALL functionName
      callStack.push(PC);
      PC = parseInt(machineCode[PC].hex.substr(2), 16);
    } else if (machineCode[PC].hex.substr(0, 2) === "30") {
      // CALL Z, functionName ; Call the function only if the Zero Flag is set.
      if (flagZ[regbank]) {
        callStack.push(PC);
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      } else
        PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "34") {
      // CALL NZ, functionName ; Call the function only if the Zero Flag is not
      // set.
      if (!flagZ[regbank]) {
        callStack.push(PC);
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      } else
        PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "38") {
      // CALL C, functionName ; Call the function only if the Carry Flag is set.
      if (flagC[regbank]) {
        callStack.push(PC);
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      } else
        PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "3c") {
      // CALL NC, functionName ; Call the function only if the Carry Flag is not
      // set.
      if (!flagC[regbank]) {
        callStack.push(PC);
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      } else
        PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "24") {
      // CALL@ (register, register) ; Jump the function pointed by the function
      // pointer stored in the registers.
      const firstRegister = parseInt(machineCode[PC].hex[2], 16);
      const secondRegister = parseInt(machineCode[PC].hex[3], 16);
      const firstValue = registers[regbank][firstRegister];
      const secondValue = registers[regbank][secondRegister];
      callStack.push(PC);
      PC = firstValue % 16 * 256 + secondValue;
    } else if (machineCode[PC].hex.substr(0, 2) === "25") {
      // RETURN
      if (callStack.length)
        PC = callStack.pop() + 1;
      else {
        if (playing)
          clearInterval(simulationThread);
        alert("The program exited!");
      }
    } else if (machineCode[PC].hex.substr(0, 2) === "31") {
      // RETURN Z ; Return from a function only if the Zero Flag is set.
      if (flagZ[regbank]) {
        if (callStack.length)
          PC = callStack.pop() + 1;
        else {
          if (playing)
            clearInterval(simulationThread);
          alert("The program exited!");
        }
      } else
        PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "35") {
      // RETURN NZ ; Return from a function only if the Zero Flag is not set.
      if (!flagZ[regbank]) {
        if (callStack.length)
          PC = callStack.pop() + 1;
        else {
          if (playing)
            clearInterval(simulationThread);
          alert("The program exited!");
        }
      } else
        PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "39") {
      // RETURN C ; Return from a function only if the Carry Flag is set.
      if (flagC[regbank]) {
        if (callStack.length)
          PC = callStack.pop() + 1;
        else {
          if (playing)
            clearInterval(simulationThread);
          alert("The program exited!");
        }
      } else
        PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "3d") {
      // RETURN NC ; Return from a function only if the Carry Flag is not set.
      if (!flagC[regbank]) {
        if (callStack.length)
          PC = callStack.pop() + 1;
        else {
          if (playing)
            clearInterval(simulationThread);
          alert("The program exited!");
        }
      } else
        PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "28") {
      // INTERRUPT ENABLE|DISABLE
      flagIE = machineCode[PC].hex[4] | 0;
      PC++;
    } else if (machineCode[PC].hex.substr(0, 2) === "29") {
      // RETURNI ENABLE|DISABLE
      flagIE = machineCode[PC].hex[4] | 0;
      if (callStack.length)
        PC = callStack.pop() + 1;
      else {
        if (playing)
          clearInterval(simulationThread);
        alert("The program exited!");
      }
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
  } catch (error) {
    if (playing)
      clearInterval(simulationThread);
    alert("The simulator crashed! Error: " + error.message);
  }
}
