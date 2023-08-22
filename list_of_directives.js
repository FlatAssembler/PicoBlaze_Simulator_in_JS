const mnemonics = [
  "ADD",     "ADDCY",   "ADDC",    "AND",    "CALL",  "CALL@",       "COMPARE",
  "COMP",    "DISABLE", "ENABLE",  "FETCH",  "INPUT", "IN",          "JUMP",
  "JUMP@",   "LOAD",    "OR",      "OUTPUT", "OUT",   "RETURN",      "RET",
  "RETURNI", "RETI",    "RL",      "RR",     "SL0",   "SL1",         "SLA",
  "SLX",     "SR0",     "SR1",     "SRA",    "SRX",   "STORE",       "SUB",
  "SUBCY",   "SUBC",    "TEST",    "XOR",    "INST",  "LOAD&RETURN", "HWBUILD",
  "STAR",    "OUTPUTK", "REGBANK", "TESTCY", "TESTC", "COMPARECY",   "COMPCY",
];
const preprocessor = [
  "ADDRESS",
  "ORG",
  "VHDL",
  "EQU",
  "NAMEREG",
  "CONSTANT",
  "DISPLAY",
  "IF",
  "ELSE",
  "ENDIF",
  "WHILE",
  "ENDWHILE",
];

if (typeof module != undefined) { // In case we are testing with JEST...
  module.exports = {mnemonics : mnemonics, preprocessor : preprocessor}
}
