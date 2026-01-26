const tree = require("../TreeNode.js");
global.TreeNode = tree.TreeNode; // referenced by tokenizer

const tokenizer = require("../tokenizer.js"); // Parser depends on the tokenizer to work...
const list_of_directives = require("../list_of_directives.js");
global.mnemonics = list_of_directives.mnemonics;
global.preprocessor = list_of_directives.preprocessor;

const parser = require("../parser.js");

const cases = [
  ["Simple addition", "5+5", '("assembly" ("+" "5" "5"))'],
  ["Adding three numbers", "1+2+3", '("assembly" ("+" ("+" "1" "2") "3"))'],
  ["Operations with different priority", "1+2*3",
    '("assembly" ("+" "1" ("*" "2" "3")))'],
  ["Parentheses", "(1+2)*3", '("assembly" ("*" ("()" ("+" "1" "2")) "3"))'],
  ["Instruction with one operand", "sra s0", '("assembly" ("sra" "s0"))'],
  ["Instruction with two operands", "load s0, s1", '("assembly" ("load" "s0" "," "s1"))'],
  [
    "A simple if statement",
    `
if 2+2=4
  display "Correct!"
endif
`,
    '("assembly" ("if" ("=" ("+" "2" "2") "4") ("assembly" ("display" ""Correct!""))))'
  ],
  [
    "An if-else statement",
    `
if 2+2=4
  display "Correct!"
else
  display "Incorrect!"
endif
`,
    '("assembly" ("if" ("=" ("+" "2" "2") "4") ("assembly" ("display" ""Correct!"")) ("assembly" ("display" ""Incorrect!""))))'
  ],
  [
    "An simple while statement",
    `
while i < 10'd
  constant i, i + 1
  display "0"+i
  display a
endwhile
`,
    '("assembly" ("while" ("<" "i" "10\'d") ("assembly" ("constant" "i" "," ("+" "i" "1")) ("display" ("+" ""0"" "i")) ("display" "a"))))'
  ],
  [
    "An if-else statement inside a while statement",
    `
while b > 0
  if a > b
    constant a, a - b
  else
    constant b, b - a
  endif
endwhile
`,
    '("assembly" ("while" (">" "b" "0") ("assembly" ("if" (">" "a" "b") ("assembly" ("constant" "a" "," ("-" "a" "b"))) ("assembly" ("constant" "b" "," ("-" "b" "a")))))))'
  ],
  [
    "An while statement inside an if statement",
    `
if i > 0 & i < 10'd
  while i < 10'd
    constant i, i + 1
    display "0"+i
    display a
  endwhile
endif
`,
    '("assembly" ("if" ("&" (">" "i" "0") ("<" "i" "10\'d")) ("assembly" ("while" ("<" "i" "10\'d") ("assembly" ("constant" "i" "," ("+" "i" "1")) ("display" ("+" ""0"" "i")) ("display" "a")))))'
  ],
  [
    "Enabling and disabling interrupts",
    `
enable interrupts
returni enable
`,
    '("assembly" ("enable" "interrupts") ("returni" "enable"))'
  ],
  ["Unary operators", "-1 + 2", '("assembly" ("+" ("-" "0" "1") "2"))'],
  ["Second unary operators test", "--5", '("assembly" ("-" "0" ("-" "0" "5")))'],
  ["Ternary conditional operator", "2+2<5?1:0", '("assembly" ("?:" ("<" ("+" "2" "2") "5") "1" "0"))'],
];

describe("PicoBlaze Parser", () => {
  test.each(cases)("%s", (_name, code, expected) => {
    const AST = parser.parse(tokenizer.tokenize(code));
    expect(AST.getLispExpression()).toEqual(expected);
  });
});