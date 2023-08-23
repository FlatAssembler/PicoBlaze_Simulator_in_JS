global.formatAsAddress = require("../headerScript.js").formatAsAddress; //referenced by simulator

const simulator = require("../simulator.js");

const clearGlobals = () => {

    global.registers = [new Array(16).fill(0), new Array(16).fill(0)];
    global.PC = 0;
    global.machineCode = [new Array(4096).fill({hex: '00000', line: 0})];
    global.regbank = 0;
    global.flagZ = [0,0];
    global.flagC = [0,0];

    global.breakpoints = [];
    global.playing = false;
    global.displayRegistersAndFlags = jest.fn();
    global.alert = (...args) => console.log(args);

    for (let i = 0; i < 10; i++){
        const td = document.createElement('td');
        td.setAttribute('id', "PC_label_" + formatAsAddress(i));
        document.body.appendChild(td);
    }
};

describe("PicoBlaze MachineCode Simulator", () => {
    beforeEach(clearGlobals)

    test("add 4 + 5 equals 9", () => {
        global.machineCode = [
            {hex: '01005', line: 3}, //load s0, 5
            {hex: '11004', line: 4}, //add s0, 4
        ];


        simulator.simulateOneInstruction(); //load s0, 5
        simulator.simulateOneInstruction(); //add s0, 4
        expect(registers[0][0]).toBe(9);
    })

    test("SR1 shifts right adding 1", () => {
        global.machineCode = [
            {hex: '01005', line: 3}, //load s0, 00000101´b
            {hex: '1400f', line: 4}, //sr1 s0
        ];


        simulator.simulateOneInstruction(); //load s0, 00000101´b
        simulator.simulateOneInstruction(); //sr1 s0
        expect(registers[0][0].toString(2)).toBe('10000010');
    })

})
