"use strict";
function simulateOneInstruction() {
  try {
    PC = PC %
         4096; // If you are at the end of a program, and there is no "return"
    // there, jump to the beginning of the program. I think that's
    // how PicoBlaze behaves, though I haven't tried it.
    if (breakpoints.includes(machineCode[PC].line)) {
      alert("Reached breakpoint on the line #" + machineCode[PC].line + ".");
      if (playing)
        clearInterval(simulationThread);
      playing = false;
      document.getElementById("fastForwardButton").disabled = false;
      document.getElementById("singleStepButton").disabled = false;
      document.getElementById("UART_INPUT").disabled = false;
      document.getElementById("playImage").style.display = "inline";
      document.getElementById("pauseImage").style.display = "none";
    }
    document.getElementById("PC_label_" + formatAsAddress(PC)).innerHTML = "";
    const currentDirective = parseInt(machineCode[PC].hex, 16);
    // "bennyboy" from "atheistforums.org" thinks my program can be
    // speeded up by using a switch-case instead of the large if-else (that a
    // switch-case would compile into a more efficient assembly code), so it
    // would be interesting to investigate whether that's true:
    // https://atheistforums.org/thread-61911-post-2112817.html#pid2112817
    let port, firstRegister, secondRegister, firstValue, secondValue, result,
        value, registerIndex, registerValue;
    switch (currentDirective & 0xff000) {
    //    if ((currentDirective & 0xff000) === 0x00000) {
    case 0x00000:
      // LOAD register,register
      registers[regbank][parseInt(machineCode[PC].hex[2], 16)] =
          registers[regbank][parseInt(machineCode[PC].hex[3], 16)];
      PC++;
      //    } else if ((currentDirective & 0xff000) === 0x01000) {
      break;
    case 0x01000:
      // LOAD register,constant
      registers[regbank][parseInt(machineCode[PC].hex[2], 16)] =
          parseInt(machineCode[PC].hex.substr(3), 16);
      PC++;
      //    } else if ((currentDirective & 0xff000) === 0x17000) {
      break;
    case 0x17000:
      // STAR register,constant ;Storing a constant into an inactive register
      registers[!regbank | 0 /*That is how you convert a boolean to an integer
                                        in JavaScript.*/
      ][parseInt(machineCode[PC].hex[2], 16)] =
          parseInt(machineCode[PC].hex.substr(3), 16);
      PC++;
      //    } else if ((currentDirective & 0xff000) === 0x16000) {
      break;
    case 0x16000:
      // STAR register,register ;Copying from an active register into an
      // inactive one.
      registers[!regbank | 0][parseInt(machineCode[PC].hex[2], 16)] =
          registers[regbank][parseInt(machineCode[PC].hex[3], 16)];
      PC++;
      //    } else if ((currentDirective & 0xff000) === 0x2e000) {
      break;
    case 0x2e000:
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
      //    } else if ((currentDirective & 0xff000) === 0x2f000) {
      break;
    case 0x2f000:
      // STORE register,memory_address ;Copy a register onto a memory address.
      memory[parseInt(machineCode[PC].hex.substr(3), 16)] =
          registers[regbank][parseInt(machineCode[PC].hex[2], 16)];
      document.getElementById("memory_" + machineCode[PC].hex.substr(3))
          .innerHTML = formatAsByte(
          registers[regbank][parseInt(machineCode[PC].hex[2], 16)]);
      PC++;
      //    } else if ((currentDirective & 0xff000) === 0x0a000) {
      break;
    case 0x0a000:
      // FETCH register,(register) ;Dereference the pointer in the second
      // register.
      registers[regbank][parseInt(machineCode[PC].hex[2], 16)] =
          memory[registers[regbank][parseInt(machineCode[PC].hex[3], 16)]];
      PC++;
      //    } else if ((currentDirective & 0xff000) === 0x0b000) {
      break;
    case 0x0b000:
      // FETCH register,memory_address ;Copy the value at memory_address to the
      // register.
      registers[regbank][parseInt(machineCode[PC].hex[2], 16)] =
          memory[parseInt(machineCode[PC].hex.substr(3), 16)];
      PC++;
      //    } else if ((currentDirective & 0xff000) === 0x08000) {
      break;
    case 0x08000:
      // INPUT register,(register) ;Read a byte from a port specified by a
      // register.
      /*const*/ port = registers[regbank][parseInt(machineCode[PC].hex[3], 16)];
      if ((port === 2 || port === 3) && is_UART_enabled) {
        if (port === 3) {
          registers[regbank][parseInt(machineCode[PC].hex[2], 16)] =
              document.getElementById("UART_INPUT")
                  .value.charCodeAt(currentlyReadCharacterInUART);
          currentlyReadCharacterInUART++;
        } else
          registers[regbank][parseInt(machineCode[PC].hex[2], 16)] =
              currentlyReadCharacterInUART <
                      document.getElementById("UART_INPUT").value.length
                  ? 0b00001000 /*U_RX_D*/
                  : 0;
      } else
        registers[regbank][parseInt(machineCode[PC].hex[2], 16)] = parseInt(
            document
                .getElementById("input_" +
                                formatAsByte(registers[regbank][parseInt(
                                    machineCode[PC].hex[3], 16)]))
                .value,
            16);
      PC++;
      //    } else if ((currentDirective & 0xff000) === 0x09000) {
      break;
    case 0x09000:
      // INPUT register, port_number
      /*const*/ port = parseInt(machineCode[PC].hex.substr(3), 16);
      if ((port === 2 || port === 3) && is_UART_enabled) {
        if (port === 3) {
          // UART_RX_PORT
          registers[regbank][parseInt(machineCode[PC].hex[2], 16)] =
              document.getElementById("UART_INPUT")
                  .value.charCodeAt(currentlyReadCharacterInUART);
          currentlyReadCharacterInUART++;
        } else if (port === 2)
          // UART_STATUS_PORT
          registers[regbank][parseInt(machineCode[PC].hex[2], 16)] =
              currentlyReadCharacterInUART <
                      document.getElementById("UART_INPUT").value.length
                  ? 0b00001000 /*U_RX_D*/
                  : 0;
        else {
          alert(
              "Internal simulator error: The simulator got into a forbidden state!");
          stopSimulation();
        }
      } else
        registers[regbank][parseInt(machineCode[PC].hex[2], 16)] = parseInt(
            document.getElementById("input_" + machineCode[PC].hex.substr(3))
                .value,
            16);
      PC++;
      //    } else if ((currentDirective & 0xff000) === 0x2c000) {
      break;
    case 0x2c000:
      // OUTPUT register,(register) ;Output the result of the first register to
      // the port specified by the second register.
      /*const*/ port = registers[regbank][parseInt(machineCode[PC].hex[3], 16)];
      /*const*/ value =
          registers[regbank][parseInt(machineCode[PC].hex[2], 16)];
      if ((port === 3 || port === 4) && is_UART_enabled) {
        if (port === 3)
          // UART_TX_PORT
          document.getElementById("UART_OUTPUT").innerText +=
              String.fromCharCode(value);
        else if (port === 4)
          // UART_RESET_PORT
          document.getElementById("UART_OUTPUT").innerText = "";
        else {
          alert(
              "Internal simulator error: The simulator got into a forbidden state!");
          stopSimulation();
        }
      } else
        output[registers[regbank][parseInt(machineCode[PC].hex[3], 16)]] =
            registers[regbank][parseInt(machineCode[PC].hex[2], 16)];
      displayOutput();
      PC++;
      //    } else if ((currentDirective & 0xff000) === 0x2d000) {
      break;
    case 0x2d000:
      // OUTPUT register, port_number
      /*const*/ port = parseInt(machineCode[PC].hex.substr(3), 16);
      /*const*/ value =
          registers[regbank][parseInt(machineCode[PC].hex[2], 16)];
      if ((port === 3 || port === 4) && is_UART_enabled) {
        if (port === 3)
          // UART_TX_PORT
          document.getElementById("UART_OUTPUT").innerText +=
              String.fromCharCode(value);
        else if (port === 4)
          // UART_RESET_PORT
          document.getElementById("UART_OUTPUT").innerText = "";
        else {
          alert(
              "Internal simulator error: The simulator got into a forbidden state!");
          stopSimulation();
        }
      } else {
        output[parseInt(machineCode[PC].hex.substr(3), 16)] =
            registers[regbank][parseInt(machineCode[PC].hex[2], 16)];
        displayOutput();
      }
      PC++;
      //    } else if ((currentDirective & 0xff000) === 0x2b000) {
      break;
    case 0x2b000:
      // OUTPUTK constant, port_number
      /*const*/ value = parseInt(machineCode[PC].hex.substr(2, 2), 16);
      /*const*/ port = parseInt(machineCode[PC].hex[4], 16);
      if ((port === 3 || port === 4) && is_UART_enabled) {
        if (port === 3)
          // UART_TX_PORT
          document.getElementById("UART_OUTPUT").innerText +=
              String.fromCharCode(value);
        else if (port === 4)
          // UART_RESET_PORT
          document.getElementById("UART_OUTPUT").innerText = "";
        else {
          alert(
              "Internal simulator error: The simulator got into a forbidden state!");
          stopSimulation();
        }
      } else {
        output[parseInt(machineCode[PC].hex[4], 16)] =
            parseInt(machineCode[PC].hex.substr(2, 2), 16);
        displayOutput();
      }
      PC++;
      /*    } else if (currentDirective === 0x37000) {
            // REGBANK A
            regbank = 0;
            PC++;
          } else if (currentDirective === 0x37001) {
            // REGBANK B
            regbank = 1;
            PC++;
      */
      break;
    case 0x37000:
      if (currentDirective % 2 === 0)
        regbank = 0;
      else
        regbank = 1;
      PC++;
      //    } else if ((currentDirective & 0xff000) === 0x22000) {
      break;
    case 0x22000:
      // JUMP label
      PC = parseInt(machineCode[PC].hex.substr(2), 16);
      /*    } else if ((currentDirective & 0xff0ff) == 0x14080) {
            // HWBUILD register
            flagC[regbank] =
                1; // Have a better idea? We can't simulate all of what this
         directive
            // does, but we can simulate this part of it.
            PC++;
      */ // Moved to bit-shifting operations...
      //    } else if ((currentDirective & 0xff000) === 0x10000) {
      break;
    case 0x10000:
      // ADD register, register
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ secondRegister = parseInt(machineCode[PC].hex[3], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = registers[regbank][secondRegister];
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
      //    } else if ((currentDirective & 0xff000) === 0x11000) {
      break;
    case 0x11000:
      // ADD register, constant
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
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
      //    } else if ((currentDirective & 0xff000) === 0x12000) {
      break;
    case 0x12000:
      // ADDCY register, register
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ secondRegister = parseInt(machineCode[PC].hex[3], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = registers[regbank][secondRegister];
      /*const*/ result = firstValue + secondValue + flagC[regbank];
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
      //    } else if ((currentDirective & 0xff000) === 0x13000) {
      break;
    case 0x13000:
      // ADDCY register, constant
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
      /*const*/ result = firstValue + secondValue + flagC[regbank];
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
      //    } else if ((currentDirective & 0xff000) === 0x18000) {
      break;
    case 0x18000:
      // SUB register, register
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ secondRegister = parseInt(machineCode[PC].hex[3], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = registers[regbank][secondRegister];
      /*const*/ result = firstValue - secondValue;
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
      //    } else if ((currentDirective & 0xff000) === 0x19000) {
      break;
    case 0x19000:
      // SUB register, constant
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
      /*const*/ result = firstValue - secondValue;
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
      //    } else if ((currentDirective & 0xff000) === 0x1a000) {
      break;
    case 0x1a000:
      // SUBCY register, register
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ secondRegister = parseInt(machineCode[PC].hex[3], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = registers[regbank][secondRegister];
      /*const*/ result = firstValue - secondValue - flagC[regbank];
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
      //    } else if ((currentDirective & 0xff000) === 0x1b000) {
      break;
    case 0x1b000:
      // SUBCY register, constant
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
      /*const*/ result = firstValue - secondValue - flagC[regbank];
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
      //    } else if ((currentDirective & 0xff000) === 0x03000) {
      break;
    case 0x03000:
      // AND register, constant
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
      /*const*/ result = firstValue & secondValue;
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
      //    } else if ((currentDirective & 0xff000) === 0x02000) {
      break;
    case 0x02000:
      // AND register, register
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ secondRegister = parseInt(machineCode[PC].hex[3], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = registers[regbank][secondRegister];
      /*const*/ result = firstValue & secondValue;
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
      //    } else if ((currentDirective & 0xff000) === 0x04000) {
      break;
    case 0x04000:
      // OR register, register
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ secondRegister = parseInt(machineCode[PC].hex[3], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = registers[regbank][secondRegister];
      /*const*/ result = firstValue | secondValue;
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
      //    } else if ((currentDirective & 0xff000) === 0x05000) {
      break;
    case 0x05000:
      // OR register, constant
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
      /*const*/ result = firstValue | secondValue;
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
      //    } else if ((currentDirective & 0xff000) === 0x06000) {
      break;
    case 0x06000:
      // XOR register, register
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ secondRegister = parseInt(machineCode[PC].hex[3], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = registers[regbank][secondRegister];
      /*const*/ result = firstValue ^ secondValue;
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
      //    } else if ((currentDirective & 0xff000) === 0x07000) {
      break;
    case 0x07000:
      // XOR register, constant
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
      /*const*/ result = firstValue ^ secondValue;
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
      /*    } else if ((currentDirective & 0xff000) === 0x0c000 ||
                     (currentDirective & 0xff000) === 0x0e000) {
      */
      break;
    case 0x0c000:
    case 0x0e000:
      // TEST register, register ;The same as "AND", but does not store the
      // result (only the flags). I am not sure if there is a difference between
      // "0c" and "0e", they appear to be the same.
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ secondRegister = parseInt(machineCode[PC].hex[3], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = registers[regbank][secondRegister];
      /*const*/ result = firstValue & secondValue;
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
      /*    } else if ((currentDirective & 0xff000) === 0x0d000 ||
                     (currentDirective & 0xff000) === 0x0f000) {*/
      break;
    case 0x0d000:
    case 0x0f000:
      // TEST register, constant
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
      /*const*/ result = firstValue & secondValue;
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
      //    } else if ((currentDirective & 0xff000) === 0x1c000) {
      break;
    case 0x1c000:
      // COMPARE register, register
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ secondRegister = parseInt(machineCode[PC].hex[3], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = registers[regbank][secondRegister];
      /*const*/ result = firstValue - secondValue;
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
      //    } else if ((currentDirective & 0xff000) === 0x1d000) {
      break;
    case 0x1d000:
      // COMPARE register, constant
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
      /*const*/ result = firstValue - secondValue;
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
      //    } else if ((currentDirective & 0xff000) === 0x1e000) {
      break;
    case 0x1e000:
      // COMPARECY register, register
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ secondRegister = parseInt(machineCode[PC].hex[3], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = registers[regbank][secondRegister];
      /*const*/ result = firstValue - secondValue - flagC[regbank];
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
      //    } else if ((currentDirective & 0xff000) === 0x1f000) {
      break;
    case 0x1f000:
      // COMPARECY register, constant
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = parseInt(machineCode[PC].hex.substr(3), 16);
      /*const*/ result = firstValue - secondValue - flagC[regbank];
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
      //    } else if ((currentDirective & 0xff000) === 0x14000) {
      break;
    case 0x14000:
      // Bit-shifting operations...
      /*const*/ registerIndex = parseInt(machineCode[PC].hex[2], 16);
      /*let*/ registerValue = registers[regbank][registerIndex];
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
      case "80": // HWBUILD (not a bit-shifting operation)
        flagC[regbank] = 1;
      default:
        alert('The instruction "' + machineCode[PC].hex +
              '", assembled from line #' + machineCode[PC].line +
              ", hasn't been implemented yet, sorry about that!");
      }
      registers[regbank][registerIndex] = registerValue;
      PC++;
      //    } else if ((currentDirective & 0xff000) === 0x32000) {
      break;
    case 0x32000:
      // JUMP Z, label
      if (flagZ[regbank])
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      else
        PC++;
      //    } else if ((currentDirective & 0xff000) === 0x36000) {
      break;
    case 0x36000:
      // JUMP NZ, label
      if (!flagZ[regbank])
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      else
        PC++;
      //    } else if ((currentDirective & 0xff000) === 0x3a000) {
      break;
    case 0x3a000:
      // JUMP C, label
      if (flagC[regbank])
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      else
        PC++;
      //    } else if ((currentDirective & 0xff000) === 0x3e000) {
      break;
    case 0x3e000:
      // JUMP NC, label
      if (!flagC[regbank])
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      else
        PC++;
      //    } else if ((currentDirective & 0xff000) === 0x26000) {
      break;
    case 0x26000:
      // JUMP@ (register, register) ; Jump to the address pointed by the
      // registers (something like function pointers, except that "return" won't
      // work).
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ secondRegister = parseInt(machineCode[PC].hex[3], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = registers[regbank][secondRegister];
      PC = (firstValue % 16) * 256 + secondValue;
      //    } else if ((currentDirective & 0xff000) === 0x20000) {
      break;
    case 0x20000:
      // CALL functionName
      callStack.push(PC);
      PC = parseInt(machineCode[PC].hex.substr(2), 16);
      //    } else if ((currentDirective & 0xff000) === 0x30000) {
      break;
    case 0x30000:
      // CALL Z, functionName ; Call the function only if the Zero Flag is set.
      if (flagZ[regbank]) {
        callStack.push(PC);
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      } else
        PC++;
      //    } else if ((currentDirective & 0xff000) === 0x34000) {
      break;
    case 0x34000:
      // CALL NZ, functionName ; Call the function only if the Zero Flag is not
      // set.
      if (!flagZ[regbank]) {
        callStack.push(PC);
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      } else
        PC++;
      //    } else if ((currentDirective & 0xff000) === 0x38000) {
      break;
    case 0x38000:
      // CALL C, functionName ; Call the function only if the Carry Flag is set.
      if (flagC[regbank]) {
        callStack.push(PC);
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      } else
        PC++;
      //    } else if ((currentDirective & 0xff000) === 0x3c000) {
      break;
    case 0x3c000:
      // CALL NC, functionName ; Call the function only if the Carry Flag is not
      // set.
      if (!flagC[regbank]) {
        callStack.push(PC);
        PC = parseInt(machineCode[PC].hex.substr(2), 16);
      } else
        PC++;
      //    } else if ((currentDirective & 0xff000) === 0x24000) {
      break;
    case 0x24000:
      // CALL@ (register, register) ; Jump the function pointed by the function
      // pointer stored in the registers.
      /*const*/ firstRegister = parseInt(machineCode[PC].hex[2], 16);
      /*const*/ secondRegister = parseInt(machineCode[PC].hex[3], 16);
      /*const*/ firstValue = registers[regbank][firstRegister];
      /*const*/ secondValue = registers[regbank][secondRegister];
      callStack.push(PC);
      PC = (firstValue % 16) * 256 + secondValue;
      //    } else if ((currentDirective & 0xff000) === 0x25000) {
      break;
    case 0x25000:
      // RETURN
      if (callStack.length)
        PC = callStack.pop() + 1;
      else {
        if (playing)
          clearInterval(simulationThread);
        alert("The program exited!");
      }
      //    } else if ((currentDirective & 0xff000) === 0x31000) {
      break;
    case 0x31000:
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
      //    } else if ((currentDirective & 0xff000) === 0x35000) {
      break;
    case 0x35000:
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
      //    } else if ((currentDirective & 0xff000) === 0x39000) {
      break;
    case 0x39000:
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
      //    } else if ((currentDirective & 0xff000) === 0x3d000) {
      break;
    case 0x3d000:
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
      //    } else if ((currentDirective & 0xff000) === 0x28000) {
      break;
    case 0x28000:
      // INTERRUPT ENABLE|DISABLE
      flagIE = machineCode[PC].hex[4] | 0;
      PC++;
      //    } else if ((currentDirective & 0xff000) === 0x29000) {
      break;
    case 0x29000:
      // RETURNI ENABLE|DISABLE
      flagIE = machineCode[PC].hex[4] | 0;
      if (callStack.length)
        PC = callStack.pop() + 1;
      else {
        if (playing)
          clearInterval(simulationThread);
        alert("The program exited!");
      }
      //    } else {
      break;
    default:
      alert(
          'Sorry about that, the simulator currently does not support the instruction "' +
          machineCode[PC].hex + '" (' + currentDirective + " & " + 0xff000 +
          " = " + (currentDirective & 0xff000) + "), assembled from line #" +
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