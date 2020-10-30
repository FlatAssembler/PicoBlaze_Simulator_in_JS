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
}
