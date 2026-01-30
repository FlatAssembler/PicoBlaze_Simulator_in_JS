/*
 * An integration test testing tokenizer, parser, and the arithmetic expressions
 * evaluator together. Previously, it was written as a set of arrange-and-assert
 * tests, but now I used GitHub Copilot to rewrite it into the data provider
 * form.
 * */

const tree = require("../TreeNode.js");
global.TreeNode = tree.TreeNode; // referenced by tokenizer

const tokenizer = require("../tokenizer.js"); // The parser depends on the tokenizer to work...
const list_of_directives = require("../list_of_directives.js"); // ... and it also depends on the list of directives (preprocessor directives and mnemonics) being already loaded.
global.mnemonics = list_of_directives.mnemonics;
global.preprocessor = list_of_directives.preprocessor;

const parser = require("../parser.js");

const cases = [
  ["Simple addition", "5+5", 5 + 5],
  ["Addition of three numbers", "1+2+3", 1 + 2 + 3],
  ["Subtraction", "5-2", 5 - 2],
  ["Parentheses", "5-(5-2)", 5 - (5 - 2)],
  ["Multiplication", "5*5", 5 * 5],
  ["Division", "6/2", 6 / 2],
  ["Exponentiation", "5^2", 5 ** 2],
  ["Logical operators", "1 & 1 | 0", (1 && 1) || 0],
  ["Decimal numbers", "10'd / 2", 10 / 2],
  ["Binary numbers", "1010'b / 2", 0b1010 / 2],
  ["Octal numbers", "252'o", 0o252],
  ["Hexadecimal numbers", "a / 2", 0xa / 2],
  ["Hexadecimal numbers composed entirely of decimal digits", "10 / 2", 0x10 / 2],
  ["ASCII", '"A"', "A".charCodeAt(0)],
  ["Unary operators", "5 + + 1", 5 + +1],
  ["Fake unary operator", "(1 + 2) + 3", 1 + 2 + 3],
  ["Unary minus", "5*-1", 5 * -1],
  [
    "Ternary conditional operator 1",
    '(2+2>5?3+3<7?1:-2:2+2-4<1?0:2+2<4?-1:-3)+("A"+2="C"?0:-1)',
    0,
  ],
  [
    "Ternary conditional operator 2",
    "1 ? 2 ? 3 : 4 : 5",
    3,
  ],
  [
    "The modulo operator",
    "mod(5, 2)",
    5 % 2,
  ],
  [
    "The bitwise operators",
    "bitand(invertBits(a),f)",
    ~0xa & 0xf,
  ],
  [
    "The logical operators have higher precedence than the ternary conditional operator",
    "2+2<5 | 3-2>2 ? 5 : 3",
    2+2<5 || 3-2>2 ? 5 : 3,
  ]
];

describe("Evaluation of Arithmetic Expressions", () => {
  test.each(cases)("%s", (_name, code, expected) => {
    const AST = parser.parse(tokenizer.tokenize(code));
    expect(AST.children[0].interpretAsArithmeticExpression(new Map())).toEqual(expected);
  });
});
