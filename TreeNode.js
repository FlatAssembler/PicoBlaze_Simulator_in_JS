"use strict";
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
      else ret += this.children[i].getLispExpression() + ")";
    return ret;
  }
  interpretAsArithmeticExpression(constants) {
    if (!(constants instanceof Map)) {
      alert(
        'Internal compiler error: The "constants" argument is not of the type "Map"!'
      );
    }
    if (constants.has(this.text)) return constants.get(this.text);
    if (
      this.children.length != 2 &&
      (this.text == "*" ||
        this.text == "/" ||
        this.text == "+" ||
        this.text == "-")
    ) {
      alert(
        "Line #" +
          this.lineNumber +
          ": The binary operator " +
          this.text +
          " has less than two operands."
      );
      return NaN;
    }
    if (this.text == "^")
      return (
        this.children[0].interpretAsArithmeticExpression(constants) **
        this.children[1].interpretAsArithmeticExpression(constants)
      );
    if (this.text == "*")
      return (
        this.children[0].interpretAsArithmeticExpression(constants) *
        this.children[1].interpretAsArithmeticExpression(constants)
      );
    if (this.text == "/")
      return (
        this.children[0].interpretAsArithmeticExpression(constants) /
        this.children[1].interpretAsArithmeticExpression(constants)
      );
    if (this.text == "+")
      return (
        this.children[0].interpretAsArithmeticExpression(constants) +
        this.children[1].interpretAsArithmeticExpression(constants)
      );
    if (this.text == "-")
      return (
        this.children[0].interpretAsArithmeticExpression(constants) -
        this.children[1].interpretAsArithmeticExpression(constants)
      );
    if (this.text == "()") {
      if (this.children.length != 1) {
        alert(
          "Line #" +
            this.lineNumber +
            ": The node '()' doesn't have exactly 1 child."
        );
        return NaN;
      }
      return this.children[0].interpretAsArithmeticExpression(constants);
    }
    if (/\'d/.test(this.text))
      return parseInt(this.text.substr(0, this.text.length - 2));
    if (/\'b/.test(this.text))
      return parseInt(this.text.substr(0, this.text.length - 2), 2);
    if (/^([a-f]|[0-9])*$/i.test(this.text)) return parseInt(this.text, 16);
    if (this.text[0] === '"' && this.text.length === 3)
      return this.text.charCodeAt(1);
    alert(
      'Some part of the assembler tried to interpret the token "' +
        this.text +
        '" in the line #' +
        this.lineNumber +
        " as a part of an arithmetic expression, which makes no sense."
    );
    return NaN;
  }
  checkTypes() {
    // Let's check for inconsistencies that would be impossible in C++, but are
    // possible in JavaScript.
    if (typeof this.text !== "string") {
      alert(
        "Internal compiler error: For some token in the line #" +
          this.lineNumber +
          ', the "text" property is not of type "string"'
      );
      return false;
    }
    if (!(this.children instanceof Array)) {
      alert(
        'Internal compiler error: The "children" property of the "' +
          this.text +
          '" token in the line #' +
          this.lineNumber +
          " is not an array!"
      );
      return false;
    }
    for (const child of this.children)
      if (!(child instanceof TreeNode)) {
        alert(
          'Internal compiler error: The node "this.text" in the line #' +
            this.lineNumber +
            " has a child that is not an instance of TreeNode!"
        );
        return false;
      }
    return true;
  }
  getRegisterNumber(registers) {
    if (registers.has(this.text))
      return registers.get(this.text).substr(1).toLowerCase();
    if (/^s(\d|[a-f])$/i.test(this.text))
      return this.text.substr(1).toLowerCase();
    return "none";
  }
  getLabelAddress(labels, constants) {
    if (labels.has(this.text)) return formatAsAddress(labels.get(this.text));
    if (constants.has(this.text))
      return formatAsAddress(constants.get(this.text));
    if (
      /^(\d|[a-f])*$/i.test(this.text) ||
      ["+", "-", "*", "/"].includes(this.text)
    )
      // Must not detect "()" as a label.
      return formatAsAddress(this.interpretAsArithmeticExpression(constants));
    return "none";
  }
}
