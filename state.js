function initialState() {
    return {
        registers: [
            new Array(16).fill(0),
            new Array(16).fill(0)
        ], //STATE (stop sim)
        PC: 0, //STATE (stop sim)

        //not state
        machineCode: initialMachineCode(),

        regbank: 0, //STATE (stop sim)
        flagZ: [0, 0], //STATE (stop sim)
        flagC: [0, 0], //STATE (stop sim)
        flagIE: 1, //STATE (stop sim)

        //TODO: maybe should be extracted
        breakpoints: [],
        playing: false,

        memory: new Array(256),
        callStack: [], //STATE (stop sim)
        output: new Array(256).fill(0), //STATE (stop sim)
        is_UART_enabled: false, //readonly boolean primitive
        currentlyReadCharacterInUART: 0 //STATE (stop sim) TODO:extract to ports
    }
}

function initialMachineCode() {
    return new Array(4096).fill({hex: '00000', line: 0})
}