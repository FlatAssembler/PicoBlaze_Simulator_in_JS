const tree = require("../TreeNode.js");
global.TreeNode = tree.TreeNode; // referenced by tokenizer

const tokenizer =
    require("../tokenizer.js"); // Parser depends on the tokenizer to work...

const list_of_directives = require(
    "../list_of_directives.js"); //...as well as on the list of directives.
global.mnemonics = list_of_directives.mnemonics;
global.preprocessor = list_of_directives.preprocessor;

const parser = require("../parser.js");

describe("PicoBlaze Parser", () => {
test("Simple addition", () => {
  const AST = parser.parse(tokenizer.tokenize("5+5"));
  expect(AST.getLispExpression()).toEqual('("assembly" ("+" "5" "5"))');
})
test("Adding three numbers", () => {
  const AST = parser.parse(tokenizer.tokenize("1+2+3"));
  expect(AST.getLispExpression())
      .toEqual('("assembly" ("+" ("+" "1" "2") "3"))');
})
test("Operations with different priority", () => {
  const AST = parser.parse(tokenizer.tokenize("1+2*3"));
  expect(AST.getLispExpression())
      .toEqual('("assembly" ("+" "1" ("*" "2" "3")))');
})
test("Parentheses", () => {
  const AST = parser.parse(tokenizer.tokenize("(1+2)*3"));
  expect(AST.getLispExpression())
      .toEqual('("assembly" ("*" ("()" ("+" "1" "2")) "3"))');
})
test("Instruction with one operand", () => {
  const AST = parser.parse(tokenizer.tokenize("sra s0"));
  expect(AST.getLispExpression()).toEqual('("assembly" ("sra" "s0"))');
})
test("Instruction with two operands", () => {
  const AST = parser.parse(tokenizer.tokenize("load s0, s1"));
  expect(AST.getLispExpression())
      .toEqual('("assembly" ("load" "s0" "," "s1"))');
})
test("A simple if statement", () => {
  const AST = parser.parse(tokenizer.tokenize(`
if 2+2=4
  display "Correct!"
endif
`));
  expect(AST.getLispExpression())
      .toEqual(
          '("assembly" ("if" ("=" ("+" "2" "2") "4") ("assembly" ("display" ""Correct!""))))');
})
test("An if-else statement", () => {
  const AST = parser.parse(tokenizer.tokenize(`
if 2+2=4
  display "Correct!"
else
  display "Incorrect!"
endif
`));
  expect(AST.getLispExpression())
      .toEqual(
          '("assembly" ("if" ("=" ("+" "2" "2") "4") ("assembly" ("display" ""Correct!"")) ("assembly" ("display" ""Incorrect!""))))');
})
test("An simple while statement", () => {
  const AST = parser.parse(tokenizer.tokenize(`
while i < 10'd
  constant i, i + 1
  display "0"+i
  display a
endwhile
`));
  expect(AST.getLispExpression())
      .toEqual(
          "(\"assembly\" (\"while\" (\"<\" \"i\" \"10'd\") (\"assembly\" (\"constant\" \"i\" \",\" (\"+\" \"i\" \"1\")) (\"display\" (\"+\" \"\"0\"\" \"i\")) (\"display\" \"a\"))))");
})
test("An if-else statement inside a while statement", () => {
  const AST = parser.parse(tokenizer.tokenize(`
while b > 0
  if a > b
    constant a, a - b
  else
    constant b, b - a
  endif
endwhile
`));
  expect(AST.getLispExpression())
      .toEqual(
          "(\"assembly\" (\"while\" (\">\" \"b\" \"0\") (\"assembly\" (\"if\" (\">\" \"a\" \"b\") (\"assembly\" (\"constant\" \"a\" \",\" (\"-\" \"a\" \"b\"))) (\"assembly\" (\"constant\" \"b\" \",\" (\"-\" \"b\" \"a\")))))))");
})
test("An while statement inside an if statement", () => {
  const AST = parser.parse(tokenizer.tokenize(`
if i > 0 & i < 10'd
  while i < 10'd
    constant i, i + 1
    display "0"+i
    display a
  endwhile
endif
`));
  expect(AST.getLispExpression())
      .toEqual(
          "(\"assembly\" (\"if\" (\"&\" (\">\" \"i\" \"0\") (\"<\" \"i\" \"10'd\")) (\"assembly\" (\"while\" (\"<\" \"i\" \"10'd\") (\"assembly\" (\"constant\" \"i\" \",\" (\"+\" \"i\" \"1\")) (\"display\" (\"+\" \"\"0\"\" \"i\")) (\"display\" \"a\"))))))");
})
test("Enabling and disabling interrupts", () => {
  const AST = parser.parse(tokenizer.tokenize(`
enable interrupts
returni enable
`));
  expect(AST.getLispExpression())
      .toEqual('("assembly" ("enable" "interrupts") ("returni" "enable"))');
})
test("Unary operands", () => {
  const AST = parser.parse(tokenizer.tokenize("-1 + 2"));
  expect(AST.getLispExpression())
      .toEqual('("assembly" ("+" ("-" "0" "1") "2"))');
})
}
);
