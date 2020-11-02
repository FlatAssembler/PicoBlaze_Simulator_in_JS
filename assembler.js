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
    const check_if_the_only_argument_is_register = () => {
      // Let's reduce the code repetition a bit by using lambda functions...
      if (node.children.length !== 1) {
        alert("Line #" + node.lineNumber + ': The AST node "' + node.text +
              '" should have exactly 1 child node!');
        return;
      }
      if (node.children[0].registerNumber(context.namedRegisters) === "none") {
        alert("Line #" + node.lineNumber + ': "' + node.children[0].text +
              '" is not a valid register name!');
        return;
      }
    };
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
            "22" +
            node.children[0].labelAddress(context.labels, context.constants);
      } else {
        if (node.children.length !== 3) {
          alert(
              "Line #" + node.lineNumber + ": The '" + node.text +
              "' node should have either exactly one child node (unconditional jumping) or exactly three (3) child nodes (comma counts as a child node)!");
          return;
        }
        if (node.children[1].text !== ",") {
          alert("Line #" + node.lineNumber +
                ": Expected a comma (',') instead of '" + node.text + "'!");
          return;
        }
        if (node.children[2].labelAddress(context.labels, context.constants) ===
            "none") {
          alert("Line #" + node.lineNumber + ": Label '" +
                node.children[2].text + "' is not declared!");
          return;
        }
        if (/^z$/i.test(node.children[0].text))
          machineCode[address].hex =
              "32" +
              node.children[2].labelAddress(context.labels, context.constants);
        else if (/^nz$/i.test(node.children[0].text))
          machineCode[address].hex =
              "36" +
              node.children[2].labelAddress(context.labels, context.constants);
        else if (/^c$/i.test(node.children[0].text))
          machineCode[address].hex =
              "3a" +
              node.children[2].labelAddress(context.labels, context.constants);
        else if (/^nc$/i.test(node.children[0].text))
          machineCode[address].hex =
              "3e" +
              node.children[2].labelAddress(context.labels, context.constants);
        else {
          alert("Line #" + node.lineNumber + ": Invalid flag name '" +
                node.children[0].text + "'!");
          return;
        }
      }
      address++;
    } else if (/^jump@$/i.test(node.text)) {
      if (node.children.length !== 1 || node.children[0].text !== "()") {
        alert("Line #" + node.lineNumber + ": The '" + node.text +
              "' node should have exactly one (1) child, and that is '()'");
        return;
      }
      if (node.children[0].children.length !== 3) {
        alert(
            "Line #" + node.lineNumber +
            ": The '()' node should have exactly three children (now it has " +
            node.children[0].children.length + ")!");
        return;
      }
      if (node.children[0].children[1].text !== ",") {
        alert("Line #" + node.lineNumber +
              ": Expected a comma (',') instead of '" +
              node.children[0].children[1].text + "'!");
        return;
      }
      if (node.children[0].children[0].registerNumber(
              context.namedRegisters) === "none") {
        alert("Line #" + node.lineNumber + ": '" +
              node.children[0].children[0].text + "' is not a register name!");
        return;
      }
      if (node.children[0].children[2].registerNumber(
              context.namedRegisters) === "none") {
        alert("Line #" + node.lineNumber + ": '" +
              node.children[0].children[2].text + "' is not a register name!");
        return;
      }
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex =
          "26" +
          node.children[0].children[0].registerNumber(context.namedRegisters) +
          node.children[0].children[2].registerNumber(context.namedRegisters) +
          "0";
      address++;
    } else if (/^call@$/i.test(node.text)) {
      if (node.children.length !== 1 || node.children[0].text !== "()") {
        alert("Line #" + node.lineNumber + ": The '" + node.text +
              "' node should have exactly one (1) child, and that is '()'");
        return;
      }
      if (node.children[0].children.length !== 3) {
        alert(
            "Line #" + node.lineNumber +
            ": The '()' node should have exactly three children (now it has " +
            node.children[0].children.length + ")!");
        return;
      }
      if (node.children[0].children[1].text !== ",") {
        alert("Line #" + node.lineNumber +
              ": Expected a comma (',') instead of '" +
              node.children[0].children[1].text + "'!");
        return;
      }
      if (node.children[0].children[0].registerNumber(
              context.namedRegisters) === "none") {
        alert("Line #" + node.lineNumber + ": '" +
              node.children[0].children[0].text + "' is not a register name!");
        return;
      }
      if (node.children[0].children[2].registerNumber(
              context.namedRegisters) === "none") {
        alert("Line #" + node.lineNumber + ": '" +
              node.children[0].children[2].text + "' is not a register name!");
        return;
      }
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex =
          "24" +
          node.children[0].children[0].registerNumber(context.namedRegisters) +
          node.children[0].children[2].registerNumber(context.namedRegisters) +
          "0";
      address++;
    } else if (/^call$/i.test(node.text)) {
      machineCode[address].line = node.lineNumber;
      if (node.children.length === 1) {
        if (node.children[0].labelAddress(context.labels, context.constants) ===
            "none") {
          alert("Line #" + node.lineNumber + ": Label '" +
                node.children[0].text + "' is not declared!");
          return;
        }
        machineCode[address].hex =
            "20" +
            node.children[0].labelAddress(context.labels, context.constants);
      } else {
        if (node.children.length !== 3) {
          alert(
              "Line #" + node.lineNumber + ": The '" + node.text +
              "' node should have either exactly one child node (unconditional jumping) or exactly three (3) child nodes (comma counts as a child node)!");
          return;
        }
        if (node.children[1].text !== ",") {
          alert("Line #" + node.lineNumber +
                ": Expected a comma (',') instead of '" + node.text + "'!");
          return;
        }
        if (node.children[2].labelAddress(context.labels, context.constants) ===
            "none") {
          alert("Line #" + node.lineNumber + ": Label '" +
                node.children[2].text + "' is not declared!");
          return;
        }
        if (/^z$/i.test(node.children[0].text))
          machineCode[address].hex =
              "30" +
              node.children[2].labelAddress(context.labels, context.constants);
        else if (/^nz$/i.test(node.children[0].text))
          machineCode[address].hex =
              "34" +
              node.children[2].labelAddress(context.labels, context.constants);
        else if (/^c$/i.test(node.children[0].text))
          machineCode[address].hex =
              "38" +
              node.children[2].labelAddress(context.labels, context.constants);
        else if (/^nc$/i.test(node.children[0].text))
          machineCode[address].hex =
              "3c" +
              node.children[2].labelAddress(context.labels, context.constants);
        else {
          alert("Line #" + node.lineNumber + ": Invalid flag name '" +
                node.children[0].text + "'!");
          return;
        }
      }
      address++;
    } else if (/^return$/i.test(node.text)) {
      machineCode[address].line = node.lineNumber;
      if (!node.children.length)
        machineCode[address].hex = "25000";
      else if (node.children.length === 1) {
        if (/^z$/i.test(node.children[0].text))
          machineCode[address].hex = "31000";
        else if (/^nz$/i.test(node.children[0].text))
          machineCode[address].hex = "35000";
        else if (/^c$/i.test(node.children[0].text))
          machineCode[address].hex = "39000";
        else if (/^nc$/i.test(node.children[0].text))
          machineCode[address].hex = "3d000";
        else {
          alert("Line #" + node.lineNumber + ": Invalid flag name '" +
                node.children[0].text + "'");
          return;
        }
      } else {
        alert(
            "Line #" + node.lineNumber + ": The '" + node.text +
            "' node should have either exactly zero (0) child nodes or exactly one (1) child node!");
        return;
      }
      address++;
    } else if (/^add$/i.test(node.text)) {
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
        // If we are adding a constant to a register.
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
    } else if (/^addcy?$/i.test(node.text)) {
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
        // If we are adding a constant to a register.
        machineCode[address].hex += "3";
      else
        machineCode[address].hex += "2";
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
    } else if (/^sub$/i.test(node.text)) {
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
        // If we are subtracting a constant from a register.
        machineCode[address].hex += "9";
      else
        machineCode[address].hex += "8";
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
    } else if (/^subcy?$/i.test(node.text)) {
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
        // If we are subtracting a constant from a register.
        machineCode[address].hex += "b";
      else
        machineCode[address].hex += "a";
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
    } else if (/^and$/i.test(node.text)) {
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
        machineCode[address].hex += "3";
      else
        machineCode[address].hex += "2";
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
    } else if (/^or$/i.test(node.text)) {
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
        machineCode[address].hex += "5";
      else
        machineCode[address].hex += "4";
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
    } else if (/^xor$/i.test(node.text)) {
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
        machineCode[address].hex += "7";
      else
        machineCode[address].hex += "6";
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
    } else if (/^test$/i.test(node.text)) {
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
        machineCode[address].hex += "d";
      else
        machineCode[address].hex += "c";
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
    } else if (/^testcy?$/i.test(node.text)) {
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
        machineCode[address].hex += "f";
      else
        machineCode[address].hex += "e";
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
    } else if (/^comp(are)?$/i.test(node.text)) {
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
        machineCode[address].hex += "d";
      else
        machineCode[address].hex += "c";
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
    } else if (/^comp(are)?cy$/i.test(node.text)) {
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
        machineCode[address].hex += "f";
      else
        machineCode[address].hex += "e";
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
    } else if (/^sl0$/i.test(node.text)) {
      check_if_the_only_argument_is_register();
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex =
          "14" + node.children[0].registerNumber(context.namedRegisters) + "06";
      address++;
    } else if (/^sl1$/i.test(node.text)) {
      check_if_the_only_argument_is_register();
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex =
          "14" + node.children[0].registerNumber(context.namedRegisters) + "07";
      address++;
    } else if (/^slx$/i.test(node.text)) {
      check_if_the_only_argument_is_register();
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex =
          "14" + node.children[0].registerNumber(context.namedRegisters) + "04";
      address++;
    } else if (/^sla$/i.test(node.text)) {
      check_if_the_only_argument_is_register();
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex =
          "14" + node.children[0].registerNumber(context.namedRegisters) + "00";
      address++;
    } else if (/^rl$/i.test(node.text)) {
      check_if_the_only_argument_is_register();
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex =
          "14" + node.children[0].registerNumber(context.namedRegisters) + "02";
      address++;
    } else if (/^sr0$/i.test(node.text)) {
      check_if_the_only_argument_is_register();
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex =
          "14" + node.children[0].registerNumber(context.namedRegisters) + "0e";
      address++;
    } else if (/^sr1$/i.test(node.text)) {
      check_if_the_only_argument_is_register();
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex =
          "14" + node.children[0].registerNumber(context.namedRegisters) + "0f";
      address++;
    } else if (/^srx$/i.test(node.text)) {
      check_if_the_only_argument_is_register();
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex =
          "14" + node.children[0].registerNumber(context.namedRegisters) + "0a";
      address++;
    } else if (/^sra$/i.test(node.text)) {
      check_if_the_only_argument_is_register();
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex =
          "14" + node.children[0].registerNumber(context.namedRegisters) + "08";
      address++;
    } else if (/^rr$/i.test(node.text)) {
      check_if_the_only_argument_is_register();
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex =
          "14" + node.children[0].registerNumber(context.namedRegisters) + "0c";
      address++;
    } else if (/^disable$/i.test(node.text)) {
      if (node.children.length !== 1 ||
          !/interrupt/i.test(node.children[0].text)) {
        alert("Line #" + node.lineNumber + ': The AST node "' + node.text +
              '" should have exactly one child node, and that is "interrupt"!');
        return;
      }
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex = "28000";
      address++;
    } else if (/^enable$/i.test(node.text)) {
      if (node.children.length !== 1 ||
          !/interrupt/i.test(node.children[0].text)) {
        alert("Line #" + node.lineNumber + ': The AST node "' + node.text +
              '" should have exactly one child node, and that is "interrupt"!');
        return;
      }
      machineCode[address].line = node.lineNumber;
      machineCode[address].hex = "28001";
      address++;
    } else if (!isDirective(node.text)) {
      alert("Line #" + node.lineNumber + ': Sorry about that, the mnemonic "' +
            node.text + '" is not implemented.');
    }
  }
}
