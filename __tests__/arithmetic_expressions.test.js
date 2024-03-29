const tree = require("../TreeNode.js");
global.TreeNode = tree.TreeNode; // referenced by tokenizer

const tokenizer =
    require("../tokenizer.js"); // Parser depends on the tokenizer to work...

const list_of_directives = require(
    "../list_of_directives.js"); //...as well as on the list of directives.
global.mnemonics = list_of_directives.mnemonics;
global.preprocessor = list_of_directives.preprocessor;

const parser = require("../parser.js");

describe("Evaluation of Arithmetic Expressions", () => {
test("Simple addition", () => {
  const AST = parser.parse(tokenizer.tokenize("5+5"));
  expect(AST.children[0].interpretAsArithmeticExpression(new Map()))
      .toEqual(5 + 5);
})
test("Addition of three numbers", () => {
  const AST = parser.parse(tokenizer.tokenize("1+2+3"));
  expect(AST.children[0].interpretAsArithmeticExpression(new Map()))
      .toEqual(1 + 2 + 3);
})
test("Subtraction", () => {
  const AST = parser.parse(tokenizer.tokenize("5-2"));
  expect(AST.children[0].interpretAsArithmeticExpression(new Map()))
      .toEqual(5 - 2);
})
test("Parentheses", () => {
  const AST = parser.parse(tokenizer.tokenize("5-(5-2)"));
  expect(AST.children[0].interpretAsArithmeticExpression(new Map()))
      .toEqual(5 - (5 - 2));
})
test("Multiplication", () => {
  const AST = parser.parse(tokenizer.tokenize("5*5"));
  expect(AST.children[0].interpretAsArithmeticExpression(new Map()))
      .toEqual(5 * 5);
})
test("Division", () => {
  const AST = parser.parse(tokenizer.tokenize("6/2"));
  expect(AST.children[0].interpretAsArithmeticExpression(new Map()))
      .toEqual(6 / 2);
})
test("Exponentiation", () => {
  const AST = parser.parse(tokenizer.tokenize("5^2"));
  expect(AST.children[0].interpretAsArithmeticExpression(new Map()))
      .toEqual(5 ** 2);
})
test("Logical operators", () => {
  const AST = parser.parse(tokenizer.tokenize("1 & 1 | 0"));
  expect(AST.children[0].interpretAsArithmeticExpression(new Map()))
      .toEqual(1 && 1 || 0);
})
test("Decimal numbers", () => {
  const AST = parser.parse(tokenizer.tokenize("10'd / 2"));
  expect(AST.children[0].interpretAsArithmeticExpression(new Map()))
      .toEqual(10 / 2);
})
test("Binary numbers", () => {
  const AST = parser.parse(tokenizer.tokenize("1010'b / 2"));
  expect(AST.children[0].interpretAsArithmeticExpression(new Map()))
      .toEqual(0b1010 / 2);
})
test("Hexadecimal numbers", () => {
  const AST = parser.parse(tokenizer.tokenize("a / 2"));
  expect(AST.children[0].interpretAsArithmeticExpression(new Map()))
      .toEqual(0xa / 2);
})
test("Hexadecimal numbers composed entirely of decimal digits", () => {
  const AST = parser.parse(tokenizer.tokenize("10 / 2"));
  expect(AST.children[0].interpretAsArithmeticExpression(new Map()))
      .toEqual(0x10 / 2);
})
test("ASCII", () => {
  const AST = parser.parse(tokenizer.tokenize('"A"'));
  expect(AST.children[0].interpretAsArithmeticExpression(new Map()))
      .toEqual('A'.charCodeAt(0));
})
}
);
