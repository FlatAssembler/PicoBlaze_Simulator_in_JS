const tree = require("../TreeNode.js");
global.TreeNode = tree.TreeNode; // referenced by tokenizer

const tokenizer =
    require("../tokenizer.js"); // Parser depends on the tokenizer to work...

const list_of_directives = require(
    "../list_of_directives.js"); //...as well as on the list of directives.
global.mnemonics = list_of_directives.mnemonics;
global.preprocessor = list_of_directives.preprocessor;

const parser = require("../parser.js");

const preprocessor = require("../preprocessor.js");

const headerScript = require("../headerScript.js");
global.machineCode = headerScript.machineCode;
global.formatAsAddress =
    headerScript.formatAsAddress; // Or else labels won't work.

global.default_base_of_literals_in_assembly = 16;

const assembler = require("../assembler.js");

describe("Assembler tests", () => {
  test("`inst` works", () => {
    const assembly = `
address 0
inst 1 + 2 * 3
`;
    const abstract_syntax_tree = parser.parse(tokenizer.tokenize(assembly));
    const compilation_context =
        preprocessor.makeCompilationContext(abstract_syntax_tree);
    assembler.assemble(abstract_syntax_tree, compilation_context);
    expect(machineCode[0].hex).toBe("00007");
  });

  test("Loading a constant into a register works", () => {
    const assembly = `
address 0
load s1, (1 + 2) * 3
`;
    const abstract_syntax_tree = parser.parse(tokenizer.tokenize(assembly));
    const compilation_context =
        preprocessor.makeCompilationContext(abstract_syntax_tree);
    assembler.assemble(abstract_syntax_tree, compilation_context);
    expect(machineCode[0].hex).toBe("01109");
  });

  test("Moving values between registers works", () => {
    const assembly = `
address 0
load s0, s1
`;
    const abstract_syntax_tree = parser.parse(tokenizer.tokenize(assembly));
    const compilation_context =
        preprocessor.makeCompilationContext(abstract_syntax_tree);
    assembler.assemble(abstract_syntax_tree, compilation_context);
    expect(machineCode[0].hex).toBe("00010");
  });

  test("Labels work", () => {
    const assembly = `
address 0
jump label
load s0, 1
label:
add s0, s0
`;
    const abstract_syntax_tree = parser.parse(tokenizer.tokenize(assembly));
    const compilation_context =
        preprocessor.makeCompilationContext(abstract_syntax_tree);
    assembler.assemble(abstract_syntax_tree, compilation_context);
    expect(machineCode[0].hex).toBe("22002");
  });

  test("Pointers and namereg work", () => {
    const assembly = `
address 0
namereg sf, pointer
store s0, (pointer)
`;
    const abstract_syntax_tree = parser.parse(tokenizer.tokenize(assembly));
    const compilation_context =
        preprocessor.makeCompilationContext(abstract_syntax_tree);
    assembler.assemble(abstract_syntax_tree, compilation_context);
    expect(machineCode[0].hex).toBe("2e0f0");
  });

  test("Conditional jumps work", () => {
    const assembly = `
address 0
input s0, 0
compare s0, 200'd
jump c, less_than_200
sub s0, 200'd
load s1, 2
less_than_200:
compare s0, 100'd
`;
    const abstract_syntax_tree = parser.parse(tokenizer.tokenize(assembly));
    const compilation_context =
        preprocessor.makeCompilationContext(abstract_syntax_tree);
    assembler.assemble(abstract_syntax_tree, compilation_context);
    expect(machineCode[2].hex).toBe("3a005");
  });

  test("Changing the bases of the constant literals works", () => {
    const assembly = `
		address 0
		inst 10
		base_decimal
		inst 10
		base_hexadecimal
		inst 10
		`;
    const abstract_syntax_tree = parser.parse(tokenizer.tokenize(assembly));
    const compilation_context =
        preprocessor.makeCompilationContext(abstract_syntax_tree);
    assembler.assemble(abstract_syntax_tree, compilation_context);
    expect(machineCode[0].hex).toBe("00010");
    expect(machineCode[1].hex).toBe("0000a");
    expect(machineCode[2].hex).toBe("00010");
  });
  
  test("Function pointers are assembled correctly", () => {
    const assembly = `
address 0
call@(s1, s2)
`;
    const abstract_syntax_tree = parser.parse(tokenizer.tokenize(assembly));
    const compilation_context =
        preprocessor.makeCompilationContext(abstract_syntax_tree);
    assembler.assemble(abstract_syntax_tree, compilation_context);
    expect(machineCode[0].hex).toBe("24120");
  });

  test("The ternary conditional operator inside JUMP works correctly", () => { // This was once crashing the assembler: https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/38
    const assembly = `
;This is an example program demonstrating
;how the \`?:\` operator in jumps, supposedly
;enabled in v5.2.1, doesn't really work as
;intended.

address 0
jump PicoBlaze_Simulator_in_JS ? code_that_should_run_in_browser : code_that_should_run_on_mobile
load s0, 0
code_that_should_run_on_mobile:
load s0, 1
jump end_of_branching
code_that_should_run_in_browser:
load s0, 2
jump end_of_branching
end_of_branching:

;The 7th line doesn't assemble. The assembler
;asks the user \`Instead of 
;"code_that_should_run_in_browser", in the
;line #7, did you perhaps mean 
;"PicoBlaze_Simulator_in_JS"?\`. It has to do
;with the way the assembler is structured
;internally. Namely, when the core of the
;assembler sees the "jump" instruction, it
;invokes the "getLabelAddress" method of the
;"TreeNode" class. However, when that method
;sees that it's being invoked on an \`?:\`
;operator, it wrongly assumes that all of its
;operands are arithmetic expressions, so
;it invokes the 
;"interpretAsArithmeticExpression" method.
;That method takes as the only argument the
;"constants" argument, and it has no access
;to the labels. There doesn't seem to be
;a simple solution.
    `;
    const abstract_syntax_tree = parser.parse(tokenizer.tokenize(assembly));
    const compilation_context =
        preprocessor.makeCompilationContext(abstract_syntax_tree);
    assembler.assemble(abstract_syntax_tree, compilation_context);
    expect(machineCode[0].hex).toBe("22004");
  });
});
