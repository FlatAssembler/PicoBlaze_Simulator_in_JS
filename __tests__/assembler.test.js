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
});
