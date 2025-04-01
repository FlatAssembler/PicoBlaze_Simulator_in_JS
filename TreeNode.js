"use strict";

function LevenshtainDistance(A, B) {
  // Will be used to find the closest label to the one that the user has.
  // Adapted from:
  // https://github.com/royalpranjal/Interview-Bit/blob/master/DynamicProgramming/EditDistance.cpp

  const row = A.length;
  const col = B.length;

  const temp = [];
  for (let i = 0; i < row + 1; i++) {
    let tmp = [];
    for (let j = 0; j < col + 1; j++) {
      tmp.push(0);
    }
    temp.push(tmp);
  }

  const min =
      (a, b) => {
        if (a < b)
          return a;
        else
          return b;
      }

  for (let i = 0; i < temp.length; i++) {
    for (let j = 0; j < temp[0].length; j++) {
      if (j == 0) {
        temp[i][j] = i;
      } else if (i == 0) {
        temp[i][j] = j;
      } else if (A[i - 1] == B[j - 1]) {
        temp[i][j] = temp[i - 1][j - 1];
      } else {
        temp[i][j] = min(temp[i - 1][j - 1], temp[i - 1][j]);
        temp[i][j] = min(temp[i][j - 1], temp[i][j]);
        temp[i][j] = temp[i][j] + 1;
      }
    }
  }

  return temp[row][col];
}

class TreeNode {
  constructor(text, lineNumber) {
    this.text = text;
    this.lineNumber = lineNumber;
    this.children = [];
  }
  getLispExpression() {
    if (!this.children.length)
      return '"' + (this.text == "\n" ? "\\n" : this.text) + '"';
    let ret = '("' + this.text + '" ';
    for (let i = 0; i < this.children.length; i++)
      if (i < this.children.length - 1)
        ret += this.children[i].getLispExpression() + " ";
      else
        ret += this.children[i].getLispExpression() + ")";
    return ret;
  }
  interpretAsArithmeticExpression(constants) {
    if (!(constants instanceof Map)) {
      alert(
          'Internal compiler error: The "constants" argument is not of the type "Map"!');
    }
    if (constants.has(this.text))
      return constants.get(this.text);
    if (this.children.length != 2 &&
        (this.text == "*" || this.text == "/" || this.text == "+" ||
         this.text == "-" || this.text == "<" || this.text == "=" ||
         this.text == ">" || this.text == "&" || this.text == "|")) {
      alert("Line #" + this.lineNumber + ": The binary operator " + this.text +
            " has less than two operands.");
      return NaN;
    }
    if (this.text == "^")
      return (this.children[0].interpretAsArithmeticExpression(constants) **
              this.children[1].interpretAsArithmeticExpression(constants));
    if (this.text == "*")
      return (this.children[0].interpretAsArithmeticExpression(constants) *
              this.children[1].interpretAsArithmeticExpression(constants));
    if (this.text == "/")
      return (this.children[0].interpretAsArithmeticExpression(constants) /
              this.children[1].interpretAsArithmeticExpression(constants));
    if (this.text == "+")
      return (this.children[0].interpretAsArithmeticExpression(constants) +
              this.children[1].interpretAsArithmeticExpression(constants));
    if (this.text == "-")
      return (this.children[0].interpretAsArithmeticExpression(constants) -
              this.children[1].interpretAsArithmeticExpression(constants));
    if (this.text == "<")
      return (this.children[0].interpretAsArithmeticExpression(constants) <
              this.children[1].interpretAsArithmeticExpression(constants));
    if (this.text == ">")
      return (this.children[0].interpretAsArithmeticExpression(constants) >
              this.children[1].interpretAsArithmeticExpression(constants));
    if (this.text == "=")
      return (this.children[0].interpretAsArithmeticExpression(constants) ==
              this.children[1].interpretAsArithmeticExpression(constants));
    if (this.text == "&")
      return (this.children[0].interpretAsArithmeticExpression(constants) &&
              this.children[1].interpretAsArithmeticExpression(constants));
    if (this.text == "|")
      return (this.children[0].interpretAsArithmeticExpression(constants) ||
              this.children[1].interpretAsArithmeticExpression(constants));
    if (this.text == "?:")
      return (
          this.children[0].interpretAsArithmeticExpression(constants)
              ? this.children[1].interpretAsArithmeticExpression(constants)
              : this.children[2].interpretAsArithmeticExpression(constants));
    if (this.text == "()") {
      if (this.children.length != 1) {
        alert("Line #" + this.lineNumber +
              ": The node '()' doesn't have exactly 1 child.");
        return NaN;
      }
      return this.children[0].interpretAsArithmeticExpression(constants);
    }
    if (this.text == "invertBits()") {
      if (this.children.length != 1) {
        alert("Line #" + this.lineNumber +
              ": The node 'invertBits()' doesn't have exactly 1 child.");
        return NaN;
      }
      return ~this.children[0].interpretAsArithmeticExpression(constants);
    }
    if (this.text == "bitand()") {
      if (this.children.length != 3 || this.children[1].text != ',') {
        alert(
            "Line #" + this.lineNumber +
            ": The node 'bitand()' doesn't have exactly 3 children (a comma is also a child node).");
        return NaN;
      }
      return this.children[0].interpretAsArithmeticExpression(constants) &
             this.children[2].interpretAsArithmeticExpression(constants);
    }
    if (this.text == "bitor()") {
      if (this.children.length != 3 || this.children[1].text != ',') {
        alert(
            "Line #" + this.lineNumber +
            ": The node 'bitor()' doesn't have exactly 3 children (a comma is also a child node).");
        return NaN;
      }
      return this.children[0].interpretAsArithmeticExpression(constants) |
             this.children[2].interpretAsArithmeticExpression(constants);
    }
    if (this.text == "mod()") {
      if (this.children.length != 3 || this.children[1].text != ',') {
        alert(
            "Line #" + this.lineNumber +
            ": The node 'mod()' doesn't have exactly 3 children (a comma is also a child node).");
        return NaN;
      }
      return this.children[0].interpretAsArithmeticExpression(constants) %
             this.children[2].interpretAsArithmeticExpression(constants);
    }
    if (/\'d$/.test(this.text)) {
      for (let i = 0; i < this.text.length - 2; i++)
        if (this.text.charCodeAt(i) < '0'.charCodeAt(0) ||
            this.text.charCodeAt(i) > '9'.charCodeAt(0)) {
          alert(
              "Line #" + this.lineNumber + ": `" + this.text +
              "` is not a valid decimal constant!"); // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/27
          return NaN;
        }
      return parseInt(this.text.substring(
          0,
          this.text.length -
              2)); // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/30
    }
    if (/\'o$/.test(this.text)) {
      for (let i = 0; i < this.text.length - 2; i++)
        if (this.text.charCodeAt(i) < '0'.charCodeAt(0) ||
            this.text.charCodeAt(i) > '7'.charCodeAt(0)) {
          alert(
              "Line #" + this.lineNumber + ": `" + this.text +
              "` is not a valid octal constant!"); // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/27
          return NaN;
        }
      return parseInt(
          this.text.substring(0, this.text.length - 2),
          8); // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/30
    }
    if (/\'b$/.test(this.text)) {
      for (let i = 0; i < this.text.length - 2; i++)
        if (!(this.text[i] == '0' || this.text[i] == '1')) {
          alert("Line #" + this.lineNumber + ": `" + this.text +
                "` is not a valid binary constant!");
          return NaN;
        }
      return parseInt(
          this.text.substring(0, this.text.length - 2),
          2); // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/30
    }
    if (/\'x$/.test(this.text)) {
      if (!(/^([a-f]|[0-9])*\'x$/i.test(this.text))) {
        alert("Line #" + this.lineNumber + ": `" + this.text +
              "` is not a valid hexadecimal constant!");
        return NaN;
      }
      return parseInt(
          this.text.substring(0, this.text.length - 2),
          16); // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/30
    }
    if (/^([a-f]|[0-9])*$/i.test(this.text))
      return parseInt(
          this.text,
          ((typeof default_base_of_literals_in_assembly) == "undefined")
              ? 16
              : default_base_of_literals_in_assembly);
    if (this.text[0] === '"' && this.text.length === 3)
      return this.text.charCodeAt(1);
    let keys = [];
    constants.forEach((value, key) => { keys.push(key); });
    let smallest_Levenshtain_distance = keys[0];
    for (const key of keys) {
      if (LevenshtainDistance(key, this.text) <
          LevenshtainDistance(smallest_Levenshtain_distance, this.text)) {
        smallest_Levenshtain_distance = key;
      }
    }
    if (confirm("Instead of \"" + this.text + "\", in the line #" +
                this.lineNumber + ", did you perhaps mean \"" +
                smallest_Levenshtain_distance + "\"?")) {
      if (constants.has(smallest_Levenshtain_distance)) {
        constants.set(this.text, constants.get(smallest_Levenshtain_distance));
        return constants.get(this.text);
      }
    }
    alert('Some part of the assembler tried to interpret the token "' +
          this.text + '" in the line #' + this.lineNumber +
          " as a part of an arithmetic expression, which makes no sense.");
    return NaN;
  }
  checkTypes() {
    // Let's check for inconsistencies that would be impossible in C++, but are
    // possible in JavaScript.
    if (typeof this.text !== "string") {
      alert("Internal compiler error: For some token in the line #" +
            this.lineNumber + ', the "text" property is not of type "string"');
      return false;
    }
    if (!(this.children instanceof Array)) {
      alert('Internal compiler error: The "children" property of the "' +
            this.text + '" token in the line #' + this.lineNumber +
            " is not an array!");
      return false;
    }
    for (const child of this.children)
      if (!(child instanceof TreeNode)) {
        alert('Internal compiler error: The node "this.text" in the line #' +
              this.lineNumber +
              " has a child that is not an instance of TreeNode!");
        return false;
      }
    return true;
  }
  getRegisterNumber(registers) {
    if (registers.has(this.text))
      return registers.get(this.text)
          .substring(1)
          .toLowerCase(); // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/30
    if (/^s(\d|[a-f])$/i.test(this.text))
      return this.text.substring(1)
          .toLowerCase(); // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/30
    return "none";
  }
  getLabelAddress(labels, constants) {
    if (labels.has(this.text))
      return formatAsAddress(labels.get(this.text));
    if (constants.has(this.text))
      return formatAsAddress(constants.get(this.text));
    if (/^(\d|[a-f])*$/i.test(this.text) ||
        [ "+", "-", "*", "/" ].includes(this.text))
      // Must not detect "()" as a label.
      return formatAsAddress(this.interpretAsArithmeticExpression(constants));
    let keys = [];
    labels.forEach((value, key) => { keys.push(key); });
    constants.forEach((value, key) => { keys.push(key); });
    let smallest_Levenshtain_distance = keys[0];
    for (const key of keys) {
      if (LevenshtainDistance(key, this.text) <
          LevenshtainDistance(smallest_Levenshtain_distance, this.text)) {
        smallest_Levenshtain_distance = key;
      }
    }
    if (confirm("Instead of \"" + this.text + "\", in the line #" +
                this.lineNumber + ", did you perhaps mean \"" +
                smallest_Levenshtain_distance + "\"?")) {
      if (labels.has(smallest_Levenshtain_distance)) {
        labels.set(this.text, labels.get(smallest_Levenshtain_distance));
        return formatAsAddress(labels.get(smallest_Levenshtain_distance));
      }
      if (constants.has(smallest_Levenshtain_distance)) {
        constants.set(this.text, constants.get(smallest_Levenshtain_distance));
        return formatAsAddress(constants.get(smallest_Levenshtain_distance));
      }
    }
    return "none";
  }
}
