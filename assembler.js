/*
 * This code (the core of the assembler) is rather hard-to-follow due to
 * many if-branchings. I don't know how good assemblers solve that problem.
 * I have asked that question on r/learnprogramming:
 * https://www.reddit.com/r/learnprogramming/comments/17dwo2m/what_do_the_cores_of_good_assemblers_the_things/?utm_source=share&utm_medium=web2x&context=3
 * I have also asked that on CodeReview StackExchange:
 * https://codereview.stackexchange.com/q/287582/219010
 * And on r/EngineeringStudents:
 * https://www.reddit.com/r/EngineeringStudents/s/oIB7jzfBlj
 * So, maybe it would be a good idea to try to apply the suggestions I
 * received there.
 */

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
          " as an instruction, which makes no sense.");
    return "fffff";
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
          " as a single hexadecimal digit, which makes no sense.");
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
  if (/:$/.test(str) && str.length > 1) // To the core of the assembler, labels
                                        // are preprocessor directives.
    return true;
  return false;
}

function assemble(root_of_abstract_syntax_tree, output_of_preprocessor) {
  if (!(root_of_abstract_syntax_tree instanceof TreeNode) ||
      root_of_abstract_syntax_tree.text !== "assembly") {
    alert(
        "Internal assembler error: The first argument of the \"assemble\" function is not the root of the abstract syntax tree (AST)!");
    return;
  }
  machineCode = [];
  for (let i = 0; i < 4096; i++)
    machineCode.push({hex : "00000", line : 0, disableBreakpoint : false});
  if (typeof PicoBlaze == "object" &&
      typeof PicoBlaze.resetDisabledBreakpoints == "function")
    PicoBlaze.resetDisabledBreakpoints();
  let address = 0;
  default_base_of_literals_in_assembly = 16;
  for (const node_of_depth_1 of root_of_abstract_syntax_tree.children) {
    const check_if_the_only_argument_is_register = () => {
      // Let's reduce the code repetition a bit by using lambda functions...
      if (node_of_depth_1.children.length !== 1) {
        alert("Line #" + node_of_depth_1.lineNumber + ': The AST node "' +
              node_of_depth_1.text + '" should have exactly 1 child node!');
        return 0;
      }
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text +
              '" is not a valid register name!');
        return 0;
      }
      return 1;
    };
    const check_if_there_are_three_child_nodes_and_the_second_one_is_comma = () => {
      if (node_of_depth_1.children.length !== 3) {
        alert(
            "Line #" + node_of_depth_1.lineNumber + ': The AST node "' +
            node_of_depth_1.text +
            '" should have exactly three child nodes (a comma is also a child node).');
        return 0; // If we just `return` (not `return 0`), it will cause this
                  // bug:
                  // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/18
      }
      if (node_of_depth_1.children[1].text !== ",") {
        alert("Line #" + node_of_depth_1.lineNumber +
              ': Expected a comma instead of "' +
              node_of_depth_1.children[1].text + '"!');
        return 0;
      }
      return 1;
    };
    if (/^BASE_HEXADECIMAL$/i.test(node_of_depth_1.text)) {
      default_base_of_literals_in_assembly = 16;
      if (node_of_depth_1.children.length == 1) {
        default_base_of_literals_in_assembly =
            node_of_depth_1.children[0].interpretAsArithmeticExpression(
                output_of_preprocessor.constants);
      } else if (
          node_of_depth_1.children.length !=
          0) { // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/35
        alert(
            "Line " + node_of_depth_1.lineNumber +
            ': The "BASE_HEXADECIMAL" pseudo-mnemonic should have 0 or 1 arguments.');
        return;
      }
    } else if (/^BASE_DECIMAL$/i.test(node_of_depth_1.text)) {
      default_base_of_literals_in_assembly = 10;
      if (node_of_depth_1.children.length == 1) {
        default_base_of_literals_in_assembly =
            node_of_depth_1.children[0].interpretAsArithmeticExpression(
                output_of_preprocessor.constants);
      } else if (node_of_depth_1.children.length != 0) {
        alert(
            "Line " + node_of_depth_1.lineNumber +
            ': The "BASE_DECIMAL" pseudo-mnemonic should have 0 or 1 arguments.');
        return;
      }
    }
    // TODO: What if there is a BASE_DECIMAL or BASE_DECIMAL inside an
    // if-statement or a while-loop? You can see a discussion on that here:
    // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/34
    else if (/^address$/i.test(node_of_depth_1.text))
      address = node_of_depth_1.children[0].interpretAsArithmeticExpression(
          output_of_preprocessor.constants);
    else if (/^print_string$/i.test(node_of_depth_1.text)) {
      if (node_of_depth_1.children.length !== 5) {
        alert(
            "Line #" + node_of_depth_1.lineNumber +
            ": The 'print_string' node should have exactly five (5) child nodes!");
        return;
      }
      if (node_of_depth_1.children[1].text !== ",") {
        alert("Line #" + node_of_depth_1.lineNumber +
              ": Expected a comma (',') instead of '" +
              node_of_depth_1.children[1].text + "'!");
        return;
      }
      if (node_of_depth_1.children[3].text !== ",") {
        alert("Line #" + node_of_depth_1.lineNumber +
              ": Expected a comma (',') instead of '" +
              node_of_depth_1.children[3].text + "'!");
        return;
      }
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[2].text + '" is not a register!');
        return;
      }
      if (node_of_depth_1.children[4].getLabelAddress(
              output_of_preprocessor.labels,
              output_of_preprocessor.constants) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ": Label '" +
              node_of_depth_1.children[4].text + "' is not declared!");
        return;
      }
      for (let i = 1; i < node_of_depth_1.children[0].text.length - 1; i++) {
        if (node_of_depth_1.children[0].text.charCodeAt(i) > 255) {
          alert("Line #" + node_of_depth_1.lineNumber + ": The character '" +
                node_of_depth_1.text[i] + "' is not a valid ASCII character!");
          return;
        }
        if (node_of_depth_1.children[0].text.charCodeAt(i) < 0) {
          alert("Line #" + node_of_depth_1.lineNumber + ": The character '" +
                node_of_depth_1.text[i] + "' is not a valid ASCII character!");
          return;
        }
        machineCode[address].hex = "01";
        machineCode[address].hex +=
            node_of_depth_1.children[2].getRegisterNumber(
                output_of_preprocessor.namedRegisters);
        if (node_of_depth_1.children[0].text.substring(i, i + 2) == '\\n') {
          console.log(
              "DEBUG: Found a newline character in the string literal at line #" +
              node_of_depth_1.lineNumber);
          machineCode[address].hex += "0a";
          i++; // Because "\n" is a single character, but it takes two
               // characters in the source code. This is a hack, but it works
               // for PicoBlaze (where all instructions have the same size), and
               // I don't care about other assembly languages.
        } else
          machineCode[address].hex +=
              formatAsByte(node_of_depth_1.children[0].text.charCodeAt(i));
        machineCode[address].line =
            node_of_depth_1
                .lineNumber; // Is this actually a good idea? I've asked a
                             // question about that at StackExchange:
                             // https://langdev.stackexchange.com/q/4378/330
        if (i > 1) {
          machineCode[address].disableBreakpoint = true;
          if (typeof PicoBlaze == "object" &&
              typeof PicoBlaze.setDisabledBreakpoint == "function")
            PicoBlaze.setDisabledBreakpoint(address);
        } else {
          machineCode[address].disableBreakpoint = false;
        }
        address++;
        machineCode[address].hex = "20";
        machineCode[address].hex += node_of_depth_1.children[4].getLabelAddress(
            output_of_preprocessor.labels, output_of_preprocessor.constants);
        machineCode[address].line = node_of_depth_1.lineNumber;
        machineCode[address].disableBreakpoint = true;
        if (typeof PicoBlaze == "object" &&
            typeof PicoBlaze.setDisabledBreakpoint == "function") {
          PicoBlaze.setDisabledBreakpoint(address);
        }
        address++;
      }
    } else if (/^load$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        // TODO: "bennyboy" from "atheistforums.org" thinks that
        // doing this check (whether an argument is a register) again and again
        // slows down the assembler significantly, it would be good to
        // investigate whether that is true:
        // https://atheistforums.org/thread-61911-post-2112572.html#pid2112572
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "0";
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        // If we are moving a constant to a register.
        machineCode[address].hex += "1";
      else
        machineCode[address].hex += "0";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      else
        machineCode[address].hex +=
            node_of_depth_1.children[2].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      address++;
    } else if (/^star$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "1";
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        // If we are moving a constant to a register.
        machineCode[address].hex += "7";
      else
        machineCode[address].hex += "6";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      else
        machineCode[address].hex +=
            node_of_depth_1.children[2].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      address++;
    } else if (/^store$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "2";
      if (node_of_depth_1.children[2].text === "()")
        machineCode[address].hex += "e";
      else
        machineCode[address].hex += "f";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].text === "()") {
        if (node_of_depth_1.children[2].children.length !== 1) {
          alert("Line #" + node_of_depth_1.lineNumber +
                ": The node '()' should have exactly one child!");
          return;
        }
        if (node_of_depth_1.children[2].children[0].getRegisterNumber(
                output_of_preprocessor.namedRegisters) === "none") {
          alert("Line #" + node_of_depth_1.lineNumber + ': "' +
                node_of_depth_1.children[2].children[0].text +
                '" is not a register!');
          return;
        }
        machineCode[address].hex +=
            node_of_depth_1.children[2].children[0].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      } else
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      address++;
    } else if (/^fetch$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "0";
      if (node_of_depth_1.children[2].text === "()")
        machineCode[address].hex += "a";
      else
        machineCode[address].hex += "b";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].text === "()") {
        if (node_of_depth_1.children[2].children.length !== 1) {
          alert("Line #" + node_of_depth_1.lineNumber +
                ": The node '()' should have exactly one child!");
          return;
        }
        if (node_of_depth_1.children[2].children[0].getRegisterNumber(
                output_of_preprocessor.namedRegisters) === "none") {
          alert("Line #" + node_of_depth_1.lineNumber + ': "' +
                node_of_depth_1.children[2].children[0].text +
                '" is not a register!');
          return;
        }
        machineCode[address].hex +=
            node_of_depth_1.children[2].children[0].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      } else
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      address++;
    } else if (/^input$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "0";
      if (node_of_depth_1.children[2].text === "()")
        machineCode[address].hex += "8";
      else
        machineCode[address].hex += "9";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].text === "()") {
        if (node_of_depth_1.children[2].children.length !== 1) {
          alert("Line #" + node_of_depth_1.lineNumber +
                ": The node '()' should have exactly one child!");
          return;
        }
        if (node_of_depth_1.children[2].children[0].getRegisterNumber(
                output_of_preprocessor.namedRegisters) === "none") {
          alert("Line #" + node_of_depth_1.lineNumber + ': "' +
                node_of_depth_1.children[2].children[0].text +
                '" is not a register!');
          return;
        }
        machineCode[address].hex +=
            node_of_depth_1.children[2].children[0].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      } else
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      address++;
    } else if (/^output$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "2";
      if (node_of_depth_1.children[2].text === "()")
        machineCode[address].hex += "c";
      else
        machineCode[address].hex += "d";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].text === "()") {
        if (node_of_depth_1.children[2].children.length !== 1) {
          alert("Line #" + node_of_depth_1.lineNumber +
                ": The node '()' should have exactly one child!");
          return;
        }
        if (node_of_depth_1.children[2].children[0].getRegisterNumber(
                output_of_preprocessor.namedRegisters) === "none") {
          alert("Line #" + node_of_depth_1.lineNumber + ': "' +
                node_of_depth_1.children[2].children[0].text +
                '" is not a register!');
          return;
        }
        machineCode[address].hex +=
            node_of_depth_1.children[2].children[0].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      } else
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      address++;
    } else if (/^outputk$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex =
          "2b" +
          formatAsByte(
              node_of_depth_1.children[0].interpretAsArithmeticExpression(
                  output_of_preprocessor.constants)) +
          formatAs4bits(
              node_of_depth_1.children[2].interpretAsArithmeticExpression(
                  output_of_preprocessor.constants));
      address++;
    } else if (/^regbank$/i.test(node_of_depth_1.text)) {
      if (node_of_depth_1.children.length !== 1) {
        alert("Line #" + node_of_depth_1.lineNumber + ': The AST node "' +
              node_of_depth_1.text + '" should have exactly one (1) child!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      if (node_of_depth_1.children[0].text === "a" ||
          node_of_depth_1.children[0].text === "A")
        machineCode[address].hex = "37000";
      else if (node_of_depth_1.children[0].text === "b" ||
               node_of_depth_1.children[0].text === "B")
        machineCode[address].hex = "37001";
      else {
        alert("Line #" + node_of_depth_1.lineNumber +
              ": Expected 'A' or 'B' instead of '" +
              node_of_depth_1.children[0].text + "'!");
        return;
      }
      address++;
    } else if (/^hwbuild$/i.test(node_of_depth_1.text)) {
      if (node_of_depth_1.children.length !== 1) {
        alert("Line #" + node_of_depth_1.lineNumber + ': The AST node "' +
              node_of_depth_1.text + '" should have exactly one (1) child!');
        return;
      }
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "14" +
                                 node_of_depth_1.children[0].getRegisterNumber(
                                     output_of_preprocessor.namedRegisters) +
                                 "80";
      address++;
    } else if (/^inst$/i.test(node_of_depth_1.text)) {
      if (node_of_depth_1.children.length !== 1) {
        alert("Line #" + node_of_depth_1.lineNumber + ': The AST node "' +
              node_of_depth_1.text + '" should have exactly one (1) child!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = formatAsInstruction(
          node_of_depth_1.children[0].interpretAsArithmeticExpression(
              output_of_preprocessor.constants));
      address++;
    } else if (/^jump$/i.test(node_of_depth_1.text)) {
      machineCode[address].line = node_of_depth_1.lineNumber;
      if (node_of_depth_1.children.length === 1) {
        if (node_of_depth_1.children[0].getLabelAddress(
                output_of_preprocessor.labels,
                output_of_preprocessor.constants) === "none") {
          alert("Line #" + node_of_depth_1.lineNumber + ": Label '" +
                node_of_depth_1.children[0].text + "' is not declared!");
          return;
        }
        machineCode[address].hex =
            "22" + node_of_depth_1.children[0].getLabelAddress(
                       output_of_preprocessor.labels,
                       output_of_preprocessor.constants);
      } else {
        if (node_of_depth_1.children.length !== 3) {
          alert(
              "Line #" + node_of_depth_1.lineNumber + ": The '" +
              node_of_depth_1.text +
              "' node should have either exactly one child node (unconditional jumping) or exactly three (3) child nodes (comma counts as a child node)!");
          return;
        }
        if (node_of_depth_1.children[1].text !== ",") {
          alert(
              "Line #" + node_of_depth_1.lineNumber +
              ": Expected a comma (',') instead of '" +
              node_of_depth_1.children[1]
                  .text + // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/21
              "'!");
          return;
        }
        if (node_of_depth_1.children[2].getLabelAddress(
                output_of_preprocessor.labels,
                output_of_preprocessor.constants) === "none") {
          alert("Line #" + node_of_depth_1.lineNumber + ": Label '" +
                node_of_depth_1.children[2].text + "' is not declared!");
          return;
        }
        if (/^z$/i.test(node_of_depth_1.children[0].text))
          machineCode[address].hex =
              "32" + node_of_depth_1.children[2].getLabelAddress(
                         output_of_preprocessor.labels,
                         output_of_preprocessor.constants);
        else if (/^nz$/i.test(node_of_depth_1.children[0].text))
          machineCode[address].hex =
              "36" + node_of_depth_1.children[2].getLabelAddress(
                         output_of_preprocessor.labels,
                         output_of_preprocessor.constants);
        else if (/^c$/i.test(node_of_depth_1.children[0].text))
          machineCode[address].hex =
              "3a" + node_of_depth_1.children[2].getLabelAddress(
                         output_of_preprocessor.labels,
                         output_of_preprocessor.constants);
        else if (/^nc$/i.test(node_of_depth_1.children[0].text))
          machineCode[address].hex =
              "3e" + node_of_depth_1.children[2].getLabelAddress(
                         output_of_preprocessor.labels,
                         output_of_preprocessor.constants);
        else {
          alert("Line #" + node_of_depth_1.lineNumber +
                ": Invalid flag name '" + node_of_depth_1.children[0].text +
                "'!");
          return;
        }
      }
      address++;
    } else if (/^jump@$/i.test(node_of_depth_1.text)) {
      if (node_of_depth_1.children.length !== 1 ||
          node_of_depth_1.children[0].text !== "()") {
        alert("Line #" + node_of_depth_1.lineNumber + ": The '" +
              node_of_depth_1.text +
              "' node should have exactly one (1) child, and that is '()'");
        return;
      }
      if (node_of_depth_1.children[0].children.length !== 3) {
        alert(
            "Line #" + node_of_depth_1.lineNumber +
            ": The '()' node should have exactly three children (now it has " +
            node_of_depth_1.children[0].children.length + ")!");
        return;
      }
      if (node_of_depth_1.children[0].children[1].text !== ",") {
        alert("Line #" + node_of_depth_1.lineNumber +
              ": Expected a comma (',') instead of '" +
              node_of_depth_1.children[0].children[1].text + "'!");
        return;
      }
      if (node_of_depth_1.children[0].children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ": '" +
              node_of_depth_1.children[0].children[0].text +
              "' is not a register name!");
        return;
      }
      if (node_of_depth_1.children[0].children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ": '" +
              node_of_depth_1.children[0].children[2].text +
              "' is not a register name!");
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex =
          "26" +
          node_of_depth_1.children[0].children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) +
          node_of_depth_1.children[0].children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) +
          "0";
      address++;
    } else if (/^call@$/i.test(node_of_depth_1.text)) {
      if (node_of_depth_1.children.length !== 1 ||
          node_of_depth_1.children[0].text !== "()") {
        alert("Line #" + node_of_depth_1.lineNumber + ": The '" +
              node_of_depth_1.text +
              "' node should have exactly one (1) child, and that is '()'");
        return;
      }
      if (node_of_depth_1.children[0].children.length !== 3) {
        alert(
            "Line #" + node_of_depth_1.lineNumber +
            ": The '()' node should have exactly three children (now it has " +
            node_of_depth_1.children[0].children.length + ")!");
        return;
      }
      if (node_of_depth_1.children[0].children[1].text !== ",") {
        alert("Line #" + node_of_depth_1.lineNumber +
              ": Expected a comma (',') instead of '" +
              node_of_depth_1.children[0].children[1].text + "'!");
        return;
      }
      if (node_of_depth_1.children[0].children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ": '" +
              node_of_depth_1.children[0].children[0].text +
              "' is not a register name!");
        return;
      }
      if (node_of_depth_1.children[0].children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ": '" +
              node_of_depth_1.children[0].children[2].text +
              "' is not a register name!");
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex =
          "24" +
          node_of_depth_1.children[0].children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) +
          node_of_depth_1.children[0].children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) +
          "0";
      address++;
    } else if (/^call$/i.test(node_of_depth_1.text)) {
      machineCode[address].line = node_of_depth_1.lineNumber;
      if (node_of_depth_1.children.length === 1) {
        if (node_of_depth_1.children[0].getLabelAddress(
                output_of_preprocessor.labels,
                output_of_preprocessor.constants) === "none") {
          alert("Line #" + node_of_depth_1.lineNumber + ": Label '" +
                node_of_depth_1.children[0].text + "' is not declared!");
          return;
        }
        machineCode[address].hex =
            "20" + node_of_depth_1.children[0].getLabelAddress(
                       output_of_preprocessor.labels,
                       output_of_preprocessor.constants);
      } else {
        if (node_of_depth_1.children.length !== 3) {
          alert(
              "Line #" + node_of_depth_1.lineNumber + ": The '" +
              node_of_depth_1.text +
              "' node should have either exactly one child node (unconditional jumping) or exactly three (3) child nodes (comma counts as a child node)!");
          return;
        }
        if (node_of_depth_1.children[1].text !== ",") {
          alert("Line #" + node_of_depth_1.lineNumber +
                ": Expected a comma (',') instead of '" + node_of_depth_1.text +
                "'!");
          return;
        }
        if (node_of_depth_1.children[2].getLabelAddress(
                output_of_preprocessor.labels,
                output_of_preprocessor.constants) === "none") {
          alert("Line #" + node_of_depth_1.lineNumber + ": Label '" +
                node_of_depth_1.children[2].text + "' is not declared!");
          return;
        }
        if (/^z$/i.test(node_of_depth_1.children[0].text))
          machineCode[address].hex =
              "30" + node_of_depth_1.children[2].getLabelAddress(
                         output_of_preprocessor.labels,
                         output_of_preprocessor.constants);
        else if (/^nz$/i.test(node_of_depth_1.children[0].text))
          machineCode[address].hex =
              "34" + node_of_depth_1.children[2].getLabelAddress(
                         output_of_preprocessor.labels,
                         output_of_preprocessor.constants);
        else if (/^c$/i.test(node_of_depth_1.children[0].text))
          machineCode[address].hex =
              "38" + node_of_depth_1.children[2].getLabelAddress(
                         output_of_preprocessor.labels,
                         output_of_preprocessor.constants);
        else if (/^nc$/i.test(node_of_depth_1.children[0].text))
          machineCode[address].hex =
              "3c" + node_of_depth_1.children[2].getLabelAddress(
                         output_of_preprocessor.labels,
                         output_of_preprocessor.constants);
        else {
          alert("Line #" + node_of_depth_1.lineNumber +
                ": Invalid flag name '" + node_of_depth_1.children[0].text +
                "'!");
          return;
        }
      }
      address++;
    } else if (/^return$/i.test(node_of_depth_1.text)) {
      machineCode[address].line = node_of_depth_1.lineNumber;
      if (!node_of_depth_1.children.length)
        machineCode[address].hex = "25000";
      else if (node_of_depth_1.children.length === 1) {
        if (/^z$/i.test(node_of_depth_1.children[0].text))
          machineCode[address].hex = "31000";
        else if (/^nz$/i.test(node_of_depth_1.children[0].text))
          machineCode[address].hex = "35000";
        else if (/^c$/i.test(node_of_depth_1.children[0].text))
          machineCode[address].hex = "39000";
        else if (/^nc$/i.test(node_of_depth_1.children[0].text))
          machineCode[address].hex = "3d000";
        else {
          alert("Line #" + node_of_depth_1.lineNumber +
                ": Invalid flag name '" + node_of_depth_1.children[0].text +
                "'");
          return;
        }
      } else {
        alert(
            "Line #" + node_of_depth_1.lineNumber + ": The '" +
            node_of_depth_1.text +
            "' node should have either exactly zero (0) child nodes or exactly one (1) child node!");
        return;
      }
      address++;
    } else if (/^add$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "1";
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        // If we are adding a constant to a register.
        machineCode[address].hex += "1";
      else
        machineCode[address].hex += "0";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      else
        machineCode[address].hex +=
            node_of_depth_1.children[2].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      address++;
    } else if (/^addcy?$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "1";
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        // If we are adding a constant to a register.
        machineCode[address].hex += "3";
      else
        machineCode[address].hex += "2";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      else
        machineCode[address].hex +=
            node_of_depth_1.children[2].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      address++;
    } else if (/^sub$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "1";
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        // If we are subtracting a constant from a register.
        machineCode[address].hex += "9";
      else
        machineCode[address].hex += "8";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      else
        machineCode[address].hex +=
            node_of_depth_1.children[2].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      address++;
    } else if (/^subcy?$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "1";
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        // If we are subtracting a constant from a register.
        machineCode[address].hex += "b";
      else
        machineCode[address].hex += "a";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      else
        machineCode[address].hex +=
            node_of_depth_1.children[2].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      address++;
    } else if (/^and$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "0";
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += "3";
      else
        machineCode[address].hex += "2";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      else
        machineCode[address].hex +=
            node_of_depth_1.children[2].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      address++;
    } else if (/^or$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "0";
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += "5";
      else
        machineCode[address].hex += "4";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      else
        machineCode[address].hex +=
            node_of_depth_1.children[2].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      address++;
    } else if (/^xor$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "0";
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += "7";
      else
        machineCode[address].hex += "6";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      else
        machineCode[address].hex +=
            node_of_depth_1.children[2].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      address++;
    } else if (/^test$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "0";
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += "d";
      else
        machineCode[address].hex += "c";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      else
        machineCode[address].hex +=
            node_of_depth_1.children[2].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      address++;
    } else if (/^testcy?$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "0";
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += "f";
      else
        machineCode[address].hex += "e";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      else
        machineCode[address].hex +=
            node_of_depth_1.children[2].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      address++;
    } else if (/^comp(are)?$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "1";
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += "d";
      else
        machineCode[address].hex += "c";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      else
        machineCode[address].hex +=
            node_of_depth_1.children[2].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      address++;
    } else if (/^comp(are)?cy$/i.test(node_of_depth_1.text)) {
      if (!check_if_there_are_three_child_nodes_and_the_second_one_is_comma())
        return;
      if (node_of_depth_1.children[0].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none") {
        alert("Line #" + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text + '" is not a register!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "1";
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += "f";
      else
        machineCode[address].hex += "e";
      machineCode[address].hex += node_of_depth_1.children[0].getRegisterNumber(
          output_of_preprocessor.namedRegisters);
      if (node_of_depth_1.children[2].getRegisterNumber(
              output_of_preprocessor.namedRegisters) === "none")
        machineCode[address].hex += formatAsByte(
            node_of_depth_1.children[2].interpretAsArithmeticExpression(
                output_of_preprocessor.constants));
      else
        machineCode[address].hex +=
            node_of_depth_1.children[2].getRegisterNumber(
                output_of_preprocessor.namedRegisters) +
            "0";
      address++;
    } else if (/^sl0$/i.test(node_of_depth_1.text)) {
      if (!check_if_the_only_argument_is_register())
        return;
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "14" +
                                 node_of_depth_1.children[0].getRegisterNumber(
                                     output_of_preprocessor.namedRegisters) +
                                 "06";
      address++;
    } else if (/^sl1$/i.test(node_of_depth_1.text)) {
      if (!check_if_the_only_argument_is_register())
        return;
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "14" +
                                 node_of_depth_1.children[0].getRegisterNumber(
                                     output_of_preprocessor.namedRegisters) +
                                 "07";
      address++;
    } else if (/^slx$/i.test(node_of_depth_1.text)) {
      if (!check_if_the_only_argument_is_register())
        return;
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "14" +
                                 node_of_depth_1.children[0].getRegisterNumber(
                                     output_of_preprocessor.namedRegisters) +
                                 "04";
      address++;
    } else if (/^sla$/i.test(node_of_depth_1.text)) {
      if (!check_if_the_only_argument_is_register())
        return;
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "14" +
                                 node_of_depth_1.children[0].getRegisterNumber(
                                     output_of_preprocessor.namedRegisters) +
                                 "00";
      address++;
    } else if (/^rl$/i.test(node_of_depth_1.text)) {
      if (!check_if_the_only_argument_is_register())
        return;
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "14" +
                                 node_of_depth_1.children[0].getRegisterNumber(
                                     output_of_preprocessor.namedRegisters) +
                                 "02";
      address++;
    } else if (/^sr0$/i.test(node_of_depth_1.text)) {
      if (!check_if_the_only_argument_is_register())
        return;
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "14" +
                                 node_of_depth_1.children[0].getRegisterNumber(
                                     output_of_preprocessor.namedRegisters) +
                                 "0e";
      address++;
    } else if (/^sr1$/i.test(node_of_depth_1.text)) {
      if (!check_if_the_only_argument_is_register())
        return;
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "14" +
                                 node_of_depth_1.children[0].getRegisterNumber(
                                     output_of_preprocessor.namedRegisters) +
                                 "0f";
      address++;
    } else if (/^srx$/i.test(node_of_depth_1.text)) {
      if (!check_if_the_only_argument_is_register())
        return;
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "14" +
                                 node_of_depth_1.children[0].getRegisterNumber(
                                     output_of_preprocessor.namedRegisters) +
                                 "0a";
      address++;
    } else if (/^sra$/i.test(node_of_depth_1.text)) {
      if (!check_if_the_only_argument_is_register())
        return;
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "14" +
                                 node_of_depth_1.children[0].getRegisterNumber(
                                     output_of_preprocessor.namedRegisters) +
                                 "08";
      address++;
    } else if (/^rr$/i.test(node_of_depth_1.text)) {
      if (!check_if_the_only_argument_is_register())
        return;
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "14" +
                                 node_of_depth_1.children[0].getRegisterNumber(
                                     output_of_preprocessor.namedRegisters) +
                                 "0c";
      address++;
    } else if (/^disable$/i.test(node_of_depth_1.text)) {
      if (node_of_depth_1.children.length !== 1 ||
          !/interrupt/i.test(node_of_depth_1.children[0].text)) {
        alert("Line #" + node_of_depth_1.lineNumber + ': The AST node "' +
              node_of_depth_1.text +
              '" should have exactly one child node, and that is "interrupt"!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "28000";
      address++;
    } else if (/^enable$/i.test(node_of_depth_1.text)) {
      if (node_of_depth_1.children.length !== 1 ||
          !/interrupt/i.test(node_of_depth_1.children[0].text)) {
        alert("Line #" + node_of_depth_1.lineNumber + ': The AST node "' +
              node_of_depth_1.text +
              '" should have exactly one child node, and that is "interrupt"!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      machineCode[address].hex = "28001";
      address++;
    } else if (/^ret(urn)?i$/i.test(node_of_depth_1.text)) {
      if (node_of_depth_1.children.length !== 1) {
        alert("Line #" + node_of_depth_1.lineNumber + ': The AST node "' +
              node_of_depth_1.text + '" should have exactly one child node!');
        return;
      }
      if (/^enable$/i.test(node_of_depth_1.children[0].text))
        machineCode[address].hex = "29001";
      else if (/^disable$/i.test(node_of_depth_1.children[0].text))
        machineCode[address].hex = "29000";
      else {
        alert("Line #" + node_of_depth_1.lineNumber +
              ': Expected "ENABLE" or "DISABLE" instead of "' +
              node_of_depth_1.children[0].text + '"!');
        return;
      }
      machineCode[address].line = node_of_depth_1.lineNumber;
      address++;
    } else if (!isDirective(node_of_depth_1.text)) {
      alert("Line #" + node_of_depth_1.lineNumber +
            ': Sorry about that, the mnemonic "' + node_of_depth_1.text +
            '" is not implemented.');
    }
  }
}
