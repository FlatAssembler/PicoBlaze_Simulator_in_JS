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
      else
        ret += this.children[i].getLispExpression() + ")";
    return ret;
  }
  interpretAsArithmeticExpression(constants) {
    if (constants.has(this.text))
      return constants.get(this.text);
    if (this.children.size() != 2 && (this.text == "*" || this.text == "/" ||
                                      this.text == "+" || this.text == "-")) {
      alert("Line #" + this.lineNumber + ": The binary operator " + this.text +
            " has less than two operands.");
      return NaN;
    }
    if (this.text == "*")
      return (children[0].interpretAsArithmeticExpression(constants) *
              children[1].interpretAsArithmeticExpression(constants));
    if (this.text == "/")
      return (children[0].interpretAsArithmeticExpression(constants) /
              children[1].interpretAsArithmeticExpression(constants));
    if (this.text == "+")
      return (children[0].interpretAsArithmeticExpression(constants) +
              children[1].interpretAsArithmeticExpression(constants));
    if (this.text == "-")
      return (children[0].interpretAsArithmeticExpression(constants) -
              children[1].interpretAsArithmeticExpression(constants));
    if (this.text == "()") {
      if (this.children.length != 1) {
        alert("Line #" + this.lineNumber +
              ": The node '()' doesn't have exactly 1 child.");
        return NaN;
      }
      return this.children[0].interpretAsArithmeticExpression(constants);
    }
    if (/\'d/.test(this.text))
      return parseInt(this.text.substr(0, this.text.length - 2));
    if (/\'b/.test(this.text))
      return parseInt(this.text.substr(0, this.text.length - 2), 2);
    if (/^([a-f]|[0-9])*$/i.test(this.text))
      return parseInt(this.text, 16);
    alert('Some part of the assembler tried to interpret the token "' +
          this.text + '" in the line #' + this.lineNumber +
          " as a part of an arithmetic expression, which makes no sense.");
    return NaN;
  }
  checkTypes() {
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
}
