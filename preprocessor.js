"use strict";
function isMnemonic(str) {
  if (typeof str !== "string") {
    alert(
      'Internal compiler error: The first argument of the "isMnemonic" function is not a string!'
    );
    return false;
  }
  for (const mnemonic of mnemonics)
    if (RegExp("^" + mnemonic + "$", "i").test(str)) return true;
  return false;
}
function makeCompilationContext(parsed) {
  let context = {
    constants: new Map(),
    namedRegisters: new Map(),
    labels: new Map(),
  };
  if (!(parsed instanceof TreeNode) || parsed.text != "assembly") {
    // Such an error would be impossible in C++, but there is nothing preventing
    // it in JavaScript.
    alert(
      "Internal compiler error: The input to the preprocessor doesn't appear to be the output of the parser!"
    );
    return context;
  }
  let address;
  for (const node of parsed.children) {
    if (isMnemonic(node.text)) {
      if (typeof address === "undefined") {
        alert(
          "Line " +
            node.lineNumber +
            ': The mnemonic "' +
            node.text +
            '" appears before any address has been set.'
        );
        return context;
      }
      address++; // This won't work for most assembly language dialects, but it
      // works for PicoBlaze (where all directives have the same size:
      // 18 bits).
    }
    if (/:$/.test(node.text)) {
      console.log("DEBUG: Dealing with a label, point #1..."); // Eh, those JavaScript
      // debuggers are worse
      // than useless, I think
      // now. Logging debug
      // messages is so much
      // easier than trying to
      // use a debugger.
      if (typeof address === "undefined") {
        alert(
          "Line " +
            node.lineNumber +
            ': The label "' +
            node.text +
            '" appears before any address has been set.'
        );
        return context;
      }
      if (
        context.labels.has(node.text.substr(0, node.text.length - 1)) ||
        context.constants.has(node.text.substr(0, node.text.length - 1))
      ) {
        alert(
          "Line " +
            node.lineNumber +
            ': The label "' +
            node.text +
            '" has already been declared!'
        );
        return context;
      }
      if (!/^(_|[a-z])\w*:$/i.test(node.text)) {
        alert(
          "Line " +
            node.lineNumber +
            ': "' +
            node.text +
            '" is not an allowed label name.'
        );
      }
      console.log("DEBUG: Dealing with a label, point #2...");
      context.labels.set(node.text.substr(0, node.text.length - 1), address);
      console.log("DEBUG: Dealing with a label, point #3...");
    }
    if (/^address$/i.test(node.text) || /^org$/i.test(node.text)) {
      console.log("DEBUG: Setting the address, point #1...");
      if (node.children.length != 1) {
        alert(
          "Line " +
            node.lineNumber +
            ': The "address" pseudo-mnemonic doesn\'t have exactly one argument.'
        );
        return context;
      }
      console.log("DEBUG: Setting the address, point #2...");
      address = node.children[0].interpretAsArithmeticExpression(
        context.constants
      );
      console.log("DEBUG: Setting the address, point #3...");
    }
    if (/^constant$/i.test(node.text) || /^equ$/i.test(node.text)) {
      console.log("DEBUG: Setting a constant, point #1...");
      if (node.children.length != 3) {
        alert(
          "Line " +
            node.lineNumber +
            ': The AST node "constant" should have exactly three child nodes (the comma is also an AST node).'
        );
        return context;
      }
      if (
        context.constants.has(node.children[0].text) ||
        context.labels.has(node.children[0].text)
      ) {
        alert(
          "Line " +
            node.lineNumber +
            ': The constant "' +
            node.children[0].text +
            '" has already been declared.'
        );
        return context;
      }
      if (!/^(_|[a-z])\w*$/i.test(node.children[0].text)) {
        alert(
          "Line " +
            node.lineNumber +
            ': "' +
            node.children[0].text +
            '" is not an allowed constant name.'
        );
        return context;
      }
      if (node.children[1].text != ",") {
        alert(
          "Line " +
            node.lineNumber +
            ': The second child of the "' +
            node.text +
            '" node is "' +
            node.children[1].text +
            '" instead of a comma.'
        );
        return context;
      }
      console.log("DEBUG: Setting a constant, point #2...");
      context.constants.set(
        node.children[0].text,
        node.children[2].interpretAsArithmeticExpression(context.constants)
      );
      console.log("DEBUG: Setting a constant, point #3...");
    }
    if (/^namereg$/i.test(node.text)) {
      console.log("DEBUG: Naming a register, point #1...");
      if (node.children.length != 3) {
        alert(
          "Line " +
            node.lineNumber +
            ': The AST node "namereg" should have exactly three child nodes (the comma is also an AST node).'
        );
        return context;
      }
      if (context.namedRegisters.has(node.children[2].text)) {
        alert(
          "Line " +
            node.lineNumber +
            ': Variable named "' +
            node.children[2].text +
            '" has already been declared!'
        );
        return context;
      }
      if (!/s([0-9]|[a-f])/i.test(node.children[0].text)) {
        alert(
          "Line " +
            node.lineNumber +
            ': "' +
            node.children[0].text +
            "\" is supposed to be a register name, but it doesn't the regular expression for registers."
        );
        return context;
      }
      if (node.children[1].text != ",") {
        alert(
          "Line " +
            node.lineNumber +
            ': The second child of the "' +
            node.text +
            '" node is "' +
            node.children[1].text +
            '" instead of a comma.'
        );
        return context;
      }
      console.log("DEBUG: Naming a register, point #2...");
      context.namedRegisters.set(node.children[2].text, node.children[0].text);
      console.log("DEBUG: Naming a register, point #3...");
    }
  }
  return context;
}
