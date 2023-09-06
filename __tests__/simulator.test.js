global.formatAsAddress = require("../headerScript.js").formatAsAddress;//referenced by simulator
const initialState = require("../state.js").initialState;

const simulator = require("../simulator.js");

const clearGlobals = () => {

    global.displayRegistersAndFlags = jest.fn();
    global.alert = (...args) => console.log(args);

    for (let i = 0; i < 30; i++){
        const td = document.createElement('td');
        td.setAttribute('id', "PC_label_" + formatAsAddress(i));
        document.body.appendChild(td);
    }

    /* UART setup*/
    const uartInputEl = document.createElement('textarea');
    uartInputEl.setAttribute('id', 'UART_INPUT');

    const uartOutputEl = document.createElement('pre');
    uartOutputEl.setAttribute('id', 'UART_OUTPUT');
    uartOutputEl.innerText = "";
    document.body.appendChild(uartOutputEl);
    document.body.appendChild(uartInputEl)
};

describe("PicoBlaze MachineCode Simulator", () => {
    beforeEach(clearGlobals)

    test("add 4 + 5 equals 9", () => {
        const machineCode = [
            {hex: '01005', line: 3}, //load s0, 5
            {hex: '11004', line: 4}, //add s0, 4
        ];

        const state = {...initialState(), machineCode};

        simulator.simulateOneInstruction(state); //load s0, 5
        simulator.simulateOneInstruction(state); //add s0, 4
        expect(state.registers[0][0]).toBe(9);
    })

    test("add 4 + 5 equals 9 using state", () => {
        const machineCode = [
            {hex: '01005', line: 3}, //load s0, 5
            {hex: '11004', line: 4}, //add s0, 4
        ];

        const state = {...initialState(), machineCode};

        simulator.simulateOneInstruction(state); //load s0, 5
        simulator.simulateOneInstruction(state); //add s0, 4

        expect(state.registers[0][0]).toBe(9);
        expect(state.PC).toBe(2)
    })

    test("SR1 shifts right adding 1", () => {
        const machineCode = [
            {hex: '01005', line: 3}, //load s0, 00000101´b
            {hex: '1400f', line: 4}, //sr1 s0
        ];

        const state = {...initialState(), machineCode};

        simulator.simulateOneInstruction(state); //load s0, 00000101´b
        simulator.simulateOneInstruction(state); //sr1 s0
        expect(state.registers[0][0].toString(2)).toBe('10000010');
    })

    test("sub 5 - 4 equals 1", () => {
        const machineCode = [{hex:"01005",line:3},{hex:"19004",line:4}]

        const state = {...initialState(), machineCode};
        simulator.simulateOneInstruction(state); //load s0, 0
        simulator.simulateOneInstruction(state); //sub s4, 4

        expect(state.registers[0][0]).toBe(1);
    })

    test("jump nz + labels work", () => {
        const machineCode = [{hex:"01000",line:4},{hex:"011ff",line:5},{hex:"11001",line:7},{hex:"19101",line:8},
            {hex:"36002",line:9}]
        const state = {...initialState(), machineCode};
        simulator.simulateOneInstruction(state); //load s0, 0
        simulator.simulateOneInstruction(state); //load s1, 255'd

        /*
        label:
        add s0, 1
        sub s1, 1
        jump nz, label
         */
        for (let i = 0; i < 255 * 3; i++) {
            //we do it a few times since it's fast :). took less than 100ms on my machine
            simulator.simulateOneInstruction(state);
        }
        expect(state.registers[0][0]).toBe(255);
    })

    test("Input UART to register", () => {
        const str = "Hello";
        const el = document.getElementById("UART_INPUT");
        el.value = str;

        const machineCode = str.split('')
            .map((c, i) => (
                //Input to Hello to s0, s1, ...sN
                {hex: '09' + i + '03', line: i+1}
                )
            );

        const state = {...initialState(), machineCode, is_UART_enabled: true};
        machineCode.forEach(() => {
            simulator.simulateOneInstruction(state);
        })

        //Reconstruct string from registers
        const actual = Array.from(state.registers[0].slice(0, str.length)) //s0 to s5
            .map(charcode => String.fromCharCode(charcode))
            .join('');

        expect(actual).toBe('Hello');
        expect(state.currentlyReadCharacterInUART).toBe(str.length);

    })

    test("Output register to UART terminal", () => {
        const machineCode = 'Hello'.split('')
            .map((c, i) => [
                //Convert every char to its codepoint and load s0
                {hex: '010' + c.charCodeAt(0).toString(16), line: i*2+1},
                //Write to port 3
                {hex: '2d003', line: i*2+2}
            ])
            .flat();

        const state = {...initialState(), machineCode, is_UART_enabled: true};
        machineCode.forEach(() => {
            simulator.simulateOneInstruction(state);
        })

        expect(document.getElementById("UART_OUTPUT").innerText).toBe('Hello')
    })

    test('return when calllstack is empty alerts that the program exited', () => {
        global.alert = jest.fn();
        const machineCode = [{hex: '25000', line: 1}] //Return

        const state = {...initialState(), machineCode};
        simulator.simulateOneInstruction(state);

        expect(global.alert).toHaveBeenCalledWith("The program exited! Tried to return without a callstack at line 1");
    })

})
