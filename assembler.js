"use strict";
function formatAsByte(n) {
  n = Math.round(n);
  if (n < 0 || n > 255) {
    alert("Some part of the assembler tried to format the number " + n +
          " as a byte, which makes no sense.");
    return "ff";
  }
  let ret = n.toString(16);
  while (ret.length < 2)
    ret = "0" + ret;
  return ret;
}

function formatAsInstruction(n) {
  n = Math.round(n);
  if (n < 0 || n >= 1 << 18) {
    alert("Some part of the assembler tried to format the number " + n +
          " as a byte, which makes no sense.");
    return "ff";
  }
  let ret = n.toString(16);
  while (ret.length < 5)
    ret = "0" + ret;
  return ret;
}

function formatAs4bits(n) {
  n = Math.round(n);
  if (n < 0 || n >= 1 << 4) {
    alert("Some part of the assembler tried to format the number " + n +
          " as a 4 bits, which makes no sense.");
    return "f";
  }
  let ret = n.toString(16);
  while (ret.length < 1)
    ret = "0" + ret;
  return ret;
}

function isDirective(str) {
  if (typeof str !== "string") {
    alert(
        'Internal compiler error: The first argument of the "isDirective" function is not a string!');
    return false;
  }
  for (const directive of preprocessor)
    if (RegExp("^" + directive + "$", "i").test(str))
      return true;
  if (/:$/.test(str))
    return true;
  return false;
}

function assemble(parsed, context) {
  machineCode = [];
  for (let i = 0; i < 4096; i++)
    machineCode.push({hex : "00000", line : 0});
  let address = 0;
  for (const node of parsed.children) {
    if (/^address$/i.test(node.text))
      address =
          node.children[0].interpretAsArithmeticExpression(context.constants);
    else if (/^load$/i.test(node.text)) {
      if (node.children.length !== 3) {
        alert(
            "Line #" + node.lineNumber + ': The AST node "' + node.text +
            '" should have exactly three child nodes (a comma is also a child node).');
        return;
      }
      if (node.children[0].registerNumber(context.namedRegisters) === "none") {
        alert("Line #" + node.lineNumber + ': "' + node.children[0].text +
              '" is not a register!');
        return;
      }
      if (node.children[1].text !== ",") {
        alert("Line #" + node.lineNumber + ': Expected a comma instead of "' +
              node.children[1].text + '"!');
        return;
      }
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex = "0";
      if (node.children[2].registerNumber(context.namedRegisters) === "none")
        // If we are moving a constant to a register.
        machineCode[address].hex += "1";
      else
        machineCode[address].hex += "0";
      machineCode[address].hex +=
          node.children[0].registerNumber(context.namedRegisters);
      if (node.children[2].registerNumber(context.namedRegisters) === "none")
        machineCode[address].hex +=
            formatAsByte(node.children[2].interpretAsArithmeticExpression(
                context.constants));
      else
        machineCode[address].hex +=
            node.children[2].registerNumber(context.namedRegisters) + "0";
      address++;
    } else if (/^star$/i.test(node.text)) {
      if (node.children.length !== 3) {
        alert(
            "Line #" + node.lineNumber + ': The AST node "' + node.text +
            '" should have exactly three child nodes (a comma is also a child node).');
        return;
      }
      if (node.children[0].registerNumber(context.namedRegisters) === "none") {
        alert("Line #" + node.lineNumber + ': "' + node.children[0].text +
              '" is not a register!');
        return;
      }
      if (node.children[1].text !== ",") {
        alert("Line #" + node.lineNumber + ': Expected a comma instead of "' +
              node.children[1].text + '"!');
        return;
      }
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex = "1";
      if (node.children[2].registerNumber(context.namedRegisters) === "none")
        // If we are moving a constant to a register.
        machineCode[address].hex += "6";
      else
        machineCode[address].hex += "7";
      machineCode[address].hex +=
          node.children[0].registerNumber(context.namedRegisters);
      if (node.children[2].registerNumber(context.namedRegisters) === "none")
        machineCode[address].hex +=
            formatAsByte(node.children[2].interpretAsArithmeticExpression(
                context.constants));
      else
        machineCode[address].hex +=
            node.children[2].registerNumber(context.namedRegisters) + "0";
      address++;
    } else if (/^store$/i.test(node.text)) {
      if (node.children.length !== 3) {
        alert(
            "Line #" + node.lineNumber + ': The AST node "' + node.text +
            '" should have exactly three child nodes (a comma is also a child node).');
        return;
      }
      if (node.children[0].registerNumber(context.namedRegisters) === "none") {
        alert("Line #" + node.lineNumber + ': "' + node.children[0].text +
              '" is not a register!');
        return;
      }
      if (node.children[1].text !== ",") {
        alert("Line #" + node.lineNumber + ': Expected a comma instead of "' +
              node.children[1].text + '"!');
        return;
      }
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex = "2";
      if (node.children[2].text === "()")
        machineCode[address].hex += "e";
      else
        machineCode[address].hex += "f";
      machineCode[address].hex +=
          node.children[0].registerNumber(context.namedRegisters);
      if (node.children[2].text === "()") {
        if (node.children[2].children.length !== 1) {
          alert("Line #" + node.lineNumber +
                ": The node '()' should have exactly one child!");
          return;
        }
        if (node.children[2].children[0].registerNumber(
                context.namedRegisters) === "none") {
          alert("Line #" + node.lineNumber + ': "' +
                node.children[2].children[0].text + '" is not a register!');
          return;
        }
        machineCode[address].hex += node.children[2].children[0].registerNumber(
                                        context.namedRegisters) +
                                    "0";
      } else
        machineCode[address].hex +=
            formatAsByte(node.children[2].interpretAsArithmeticExpression(
                context.constants));
      address++;
    } else if (/^fetch$/i.test(node.text)) {
      if (node.children.length !== 3) {
        alert(
            "Line #" + node.lineNumber + ': The AST node "' + node.text +
            '" should have exactly three child nodes (a comma is also a child node).');
        return;
      }
      if (node.children[0].registerNumber(context.namedRegisters) === "none") {
        alert("Line #" + node.lineNumber + ': "' + node.children[0].text +
              '" is not a register!');
        return;
      }
      if (node.children[1].text !== ",") {
        alert("Line #" + node.lineNumber + ': Expected a comma instead of "' +
              node.children[1].text + '"!');
        return;
      }
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex = "0";
      if (node.children[2].text === "()")
        machineCode[address].hex += "a";
      else
        machineCode[address].hex += "b";
      machineCode[address].hex +=
          node.children[0].registerNumber(context.namedRegisters);
      if (node.children[2].text === "()") {
        if (node.children[2].children.length !== 1) {
          alert("Line #" + node.lineNumber +
                ": The node '()' should have exactly one child!");
          return;
        }
        if (node.children[2].children[0].registerNumber(
                context.namedRegisters) === "none") {
          alert("Line #" + node.lineNumber + ': "' +
                node.children[2].children[0].text + '" is not a register!');
          return;
        }
        machineCode[address].hex += node.children[2].children[0].registerNumber(
                                        context.namedRegisters) +
                                    "0";
      } else
        machineCode[address].hex +=
            formatAsByte(node.children[2].interpretAsArithmeticExpression(
                context.constants));
      address++;
    } else if (/^input$/i.test(node.text)) {
      if (node.children.length !== 3) {
        alert(
            "Line #" + node.lineNumber + ': The AST node "' + node.text +
            '" should have exactly three child nodes (a comma is also a child node).');
        return;
      }
      if (node.children[0].registerNumber(context.namedRegisters) === "none") {
        alert("Line #" + node.lineNumber + ': "' + node.children[0].text +
              '" is not a register!');
        return;
      }
      if (node.children[1].text !== ",") {
        alert("Line #" + node.lineNumber + ': Expected a comma instead of "' +
              node.children[1].text + '"!');
        return;
      }
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex = "0";
      if (node.children[2].text === "()")
        machineCode[address].hex += "8";
      else
        machineCode[address].hex += "9";
      machineCode[address].hex +=
          node.children[0].registerNumber(context.namedRegisters);
      if (node.children[2].text === "()") {
        if (node.children[2].children.length !== 1) {
          alert("Line #" + node.lineNumber +
                ": The node '()' should have exactly one child!");
          return;
        }
        if (node.children[2].children[0].registerNumber(
                context.namedRegisters) === "none") {
          alert("Line #" + node.lineNumber + ': "' +
                node.children[2].children[0].text + '" is not a register!');
          return;
        }
        machineCode[address].hex += node.children[2].children[0].registerNumber(
                                        context.namedRegisters) +
                                    "0";
      } else
        machineCode[address].hex +=
            formatAsByte(node.children[2].interpretAsArithmeticExpression(
                context.constants));
      address++;
    } else if (/^output$/i.test(node.text)) {
      if (node.children.length !== 3) {
        alert(
            "Line #" + node.lineNumber + ': The AST node "' + node.text +
            '" should have exactly three child nodes (a comma is also a child node).');
        return;
      }
      if (node.children[0].registerNumber(context.namedRegisters) === "none") {
        alert("Line #" + node.lineNumber + ': "' + node.children[0].text +
              '" is not a register!');
        return;
      }
      if (node.children[1].text !== ",") {
        alert("Line #" + node.lineNumber + ': Expected a comma instead of "' +
              node.children[1].text + '"!');
        return;
      }
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex = "2";
      if (node.children[2].text === "()")
        machineCode[address].hex += "c";
      else
        machineCode[address].hex += "d";
      machineCode[address].hex +=
          node.children[0].registerNumber(context.namedRegisters);
      if (node.children[2].text === "()") {
        if (node.children[2].children.length !== 1) {
          alert("Line #" + node.lineNumber +
                ": The node '()' should have exactly one child!");
          return;
        }
        if (node.children[2].children[0].registerNumber(
                context.namedRegisters) === "none") {
          alert("Line #" + node.lineNumber + ': "' +
                node.children[2].children[0].text + '" is not a register!');
          return;
        }
        machineCode[address].hex += node.children[2].children[0].registerNumber(
                                        context.namedRegisters) +
                                    "0";
      } else
        machineCode[address].hex +=
            formatAsByte(node.children[2].interpretAsArithmeticExpression(
                context.constants));
      address++;
    } else if (/^outputk$/i.test(node.text)) {
      if (node.children.length !== 3) {
        alert(
            "Line #" + node.lineNumber + ': The AST node "' + node.text +
            '" should have exactly three child nodes (a comma is also a child node).');
        return;
      }
      if (node.children[1].text !== ",") {
        alert("Line #" + node.lineNumber + ': Expected a comma instead of "' +
              node.children[1].text + '"!');
        return;
      }
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex =
          "2b" +
          formatAsByte(node.children[0].interpretAsArithmeticExpression(
              context.constants)) +
          formatAs4bits(node.children[2].interpretAsArithmeticExpression(
              context.constants));
      address++;
    } else if (/^regbank$/i.test(node.text)) {
      if (node.children.length !== 1) {
        alert("Line #" + node.lineNumber + ': The AST node "' + node.text +
              '" should have exactly one (1) child!');
        return;
      }
      machineCode[address].line = node.lineNumber;
      if (node.children[0].text === "a" || node.children[0].text === "A")
        machineCode[address].hex = "37000";
      else if (node.children[0].text === "b" || node.children[0].text === "B")
        machineCode[address].hex = "37001";
      else {
        alert("Line #" + node.lineNumber +
              ": Expected 'A' or 'B' instead of '" + node.children[0].text +
              "'!");
        return;
      }
      address++;
    } else if (/^hwbuild$/i.test(node.text)) {
      if (node.children.length !== 1) {
        alert("Line #" + node.lineNumber + ': The AST node "' + node.text +
              '" should have exactly one (1) child!');
        return;
      }
      if (node.children[0].registerNumber(context.namedRegisters) === "none") {
        alert("Line #" + node.lineNumber + ': "' + node.children[0].text +
              '" is not a register!');
        return;
      }
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex =
          "14" + node.children[0].registerNumber(context.namedRegisters) + "80";
      address++;
    } else if (/^inst$/i.test(node.text)) {
      if (node.children.length !== 1) {
        alert("Line #" + node.lineNumber + ': The AST node "' + node.text +
              '" should have exactly one (1) child!');
        return;
      }
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex = formatAsInstruction(
          node.children[0].interpretAsArithmeticExpression(constants));
      address++;
    } else if (/^jump$/i.test(node.text)) {
      machineCode[address].line = node.lineNumber;
      if (node.children.length === 1) {
        if (node.children[0].labelAddress(context.labels, context.constants) ===
            "none") {
          alert("Line #" + node.lineNumber + ": Label '" +
                node.children[0].text + "' is not declared!");
          return;
        }
        machineCode[address].hex =
            "22" + formatAsAddress(node.children[0].labelAddress(
                       context.labels, context.constants));
      } else {
        alert(
            "Line #" + node.lineNumber +
            ": Conditional jumping hasn't yet been implemented, sorry about that!");
        return;
      }
      address++;
    } else if (!isDirective(node.text)) {
      alert("Line #" + node.lineNumber + ': Sorry about that, the mnemonic "' +
            node.text + '" is not implemented.');
    }
  }
}
