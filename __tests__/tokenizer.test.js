/*
Hackish way to import TreeNode using a babel plugin to export all without modifying the actual code.
Ideally the project should be using ES modules or a bundler like webpack.
 */
const tree = require("../TreeNode.js");
global.TreeNode = tree.TreeNode; //referenced by tokenizer

const tokenizer = require("../tokenizer.js");

describe("PicoBlaze Tokenizer", () => {
  test("ignores comments", () => {
    const tokens = tokenizer.tokenize(`
        load s0, 123 ;this is a comment
        `);
    expect(tokens.map((t) => t.text)).toEqual([
      "\n",
      "load",
      "s0",
      ",",
      "123",
      "\n",
      "\n",
    ]);
  });

  test("includes binary literals", () => {
    const tokens = tokenizer.tokenize("load s0, 10100000'b");
    expect(tokens.map((t) => t.text)).toEqual([
      "load",
      "s0",
      ",",
      "10100000'b",
      "\n",
    ]);
  });

  test("is whitespace insensitive", () => {
    const tokens = tokenizer.tokenize("load s0,        0");
    expect(tokens.map((t) => t.text)).toEqual(["load", "s0", ",", "0", "\n"]);
  });

  test("is newline sensitive", () => {
    const tokens = tokenizer.tokenize("addr\ness 0");
    expect(tokens.map((t) => t.text)).toEqual(["addr", "\n", "ess", "0", "\n"]);
  });

  test('" " is a single token', () => {
    const tokens = tokenizer.tokenize(
      'load s9, " " ; https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/5',
    );
    expect(tokens.map((t) => t.text)).toEqual(["load", "s9", ",", '" "', "\n"]);
  });

  test("Labels are tokenized correctly 1", () => {
    const tokens = tokenizer.tokenize(
      `inst 2+2<5?1:0
            label:
            jump label`,
    );
    expect(tokens.map((t) => t.text)).toEqual([
      "inst",
      "2",
      "+",
      "2",
      "<",
      "5",
      "?",
      "1",
      ":",
      "0",
      "\n",
      "label:",
      "\n",
      "jump",
      "label",
      "\n",
    ]);
  });
  test("Labels are tokenized correctly 2",() => { // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/31
    const tokens=tokenizer.tokenize(
      `address 0
      label1:
      load s0, s1
      label2: load s1, 1`
    );
    expect(tokens.map((t) => t.text)).toEqual(
      [
        "address",
        "0",
        "\n",
        "label1:",
        "\n",
        "load",
        "s0",
        ",",
        "s1",
        "\n",
        "label2:",
        "load",
        "s1",
        ",",
        "1",
        "\n",
      ]
    )
  })
});
