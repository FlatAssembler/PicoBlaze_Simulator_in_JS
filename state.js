function initialState() {
    return {
        registers: [
            new Uint8Array(16),
            new Uint8Array(16)
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

        memory: new Uint8Array(256),
        callStack: [], //STATE (stop sim)
        output: new Uint8Array(256).fill(0), //STATE (stop sim)
        is_UART_enabled: false, //readonly boolean primitive
        currentlyReadCharacterInUART: 0 //STATE (stop sim) TODO:extract to ports
    }
}


/**
 * We don't want to reset the full state. For example machineCode and uart enabled flag.
 */
function resetState(prevState) {
    return {...initialState(),
        machineCode: prevState.machineCode,
        is_UART_enabled: prevState.is_UART_enabled,
    }
}

function initialMachineCode() {
    const machineCode = new Array(4096);
    for (let i = 0; i < machineCode.length; i++) {
        machineCode[i] = {hex: '00000', line: 0};
    }
    return machineCode;
}