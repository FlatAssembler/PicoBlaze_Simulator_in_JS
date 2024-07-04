global.formatAsAddress = require("../headerScript.js").formatAsAddress; //referenced by simulator

const simulator = require("../simulator.js");

const clearGlobals = () => {
  global.registers = [new Uint8Array(16), new Uint8Array(16)];
  global.PC = 0;
  global.machineCode = [new Array(4096).fill({ hex: "00000", line: 0 })];
  global.regbank = 0;
  global.flagZ = [0, 0];
  global.flagC = [0, 0];

  global.breakpoints = [];
  global.playing = false;
  global.displayRegistersAndFlags = jest.fn();
  global.alert = (...args) => console.log(args);

  for (let i = 0; i < 10; i++) {
    const td = document.createElement("td");
    td.setAttribute("id", "PC_label_" + formatAsAddress(i));
    document.body.appendChild(td);
  }

  /* UART setup*/
  global.is_UART_enabled = false;
  global.currentlyReadCharacterInUART = 0;
  const uartInputEl = document.createElement("textarea");
  uartInputEl.setAttribute("id", "UART_INPUT");

  const uartOutputEl = document.createElement("pre");
  uartOutputEl.setAttribute("id", "UART_OUTPUT");
  uartOutputEl.innerText = "";
  document.body.appendChild(uartOutputEl);
  document.body.appendChild(uartInputEl);
};

describe("PicoBlaze MachineCode Simulator", () => {
  beforeEach(clearGlobals);

  test("add 4 + 5 equals 9", () => {
    global.machineCode = [
      { hex: "01005", line: 3 }, //load s0, 5
      { hex: "11004", line: 4 }, //add s0, 4
    ];

    simulator.simulateOneInstruction(); //load s0, 5
    simulator.simulateOneInstruction(); //add s0, 4
    expect(registers[0][0]).toBe(9);
  });

  test("SR1 shifts right adding 1", () => {
    global.machineCode = [
      { hex: "01005", line: 3 }, //load s0, 00000101´b
      { hex: "1400f", line: 4 }, //sr1 s0
    ];

    simulator.simulateOneInstruction(); //load s0, 00000101´b
    simulator.simulateOneInstruction(); //sr1 s0
    expect(registers[0][0].toString(2)).toBe("10000010");
  });

  test("sub 5 - 4 equals 1", () => {
    global.machineCode = [
      { hex: "01005", line: 3 },
      { hex: "19004", line: 4 },
    ];
    console.time("test"); // @agustiza, what does this do?
    simulator.simulateOneInstruction(); //load s0, 5
    simulator.simulateOneInstruction(); //sub s0, 4

    expect(registers[0][0]).toBe(1);
  });

  test("sub 0 - 1 equals 0xff", () => {
    // This once crashed the simulator: https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/pull/15#issuecomment-1696714640
    global.machineCode = [
      { hex: "01000", line: 3 },
      { hex: "19001", line: 4 },
    ];
    simulator.simulateOneInstruction(); //load s0, 0
    simulator.simulateOneInstruction(); //sub s0, 1

    expect(registers[0][0]).toBe(0xff);
  });

  test("sra works properly when the c flag is set", () => {
    // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/9
    global.machineCode = [
      { hex: "01041", line: 2 },
      { hex: "01101", line: 3 },
      { hex: "1410e", line: 4 },
      { hex: "14008", line: 5 },
    ];
    simulator.simulateOneInstruction(); // load s0, 41
    simulator.simulateOneInstruction(); // load s1, 1
    simulator.simulateOneInstruction(); // sr0 s1
    simulator.simulateOneInstruction(); // sra s0
    expect(registers[0][0]).toBe(0b10100000);
  });

  test("jump nz + labels work", () => {
    global.machineCode = [
      { hex: "01000", line: 4 },
      { hex: "011ff", line: 5 },
      { hex: "11001", line: 7 },
      { hex: "19101", line: 8 },
      { hex: "36002", line: 9 },
    ];
    simulator.simulateOneInstruction(); //load s0, 0
    simulator.simulateOneInstruction(); //load s1, 255'd

    /*
        label:
        add s0, 1
        sub s1, 1
        jump nz, label
         */
    for (let i = 0; i < 255 * 3; i++) {
      //we do it a few times since it's fast :). took less than 100ms on my machine
      simulator.simulateOneInstruction();
    }
    expect(registers[0][0]).toBe(255);
  });

  test("Input UART to register", () => {
    global.is_UART_enabled = true;

    const str = "Hello";
    const el = document.getElementById("UART_INPUT");
    el.value = str;

    global.machineCode = str.split("").map((c, i) =>
      //Input to Hello to s0, s1, ...sN
      ({ hex: "09" + i + "03", line: i + 1 }),
    );

    global.machineCode.forEach(() => {
      simulator.simulateOneInstruction();
    });

    //Reconstruct string from registers
    const actual = Array.from(registers[0])
      .slice(0, str.length) //s0 to s5
      .map((charcode) => String.fromCharCode(charcode))
      .join("");

    expect(actual).toBe("Hello");
    expect(global.currentlyReadCharacterInUART).toBe(str.length);
  });

  test("Output register to UART terminal", () => {
    global.is_UART_enabled = true;

    const machineCode = "Hello"
      .split("")
      .map((c, i) => [
        //Convert every char to its codepoint and load s0
        { hex: "010" + c.charCodeAt(0).toString(16), line: i * 2 + 1 },
        //Write to port 3
        { hex: "2d003", line: i * 2 + 2 },
      ])
      .flat();

    global.machineCode = machineCode;
    machineCode.forEach(() => {
      simulator.simulateOneInstruction();
    });

    expect(document.getElementById("UART_OUTPUT").innerText).toBe("Hello");
  });
});
