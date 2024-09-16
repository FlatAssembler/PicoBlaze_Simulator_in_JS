"use strict";
function isMnemonic(str) {
  if (typeof str !== "string") {
    alert(
        'Internal compiler error: The first argument of the "isMnemonic" function is not a string!');
    return false;
  }
  for (const mnemonic of mnemonics)
    if (RegExp("^" + mnemonic + "$", "i").test(str))
      return true;
  return false;
}
function makeCompilationContext(root_of_the_abstract_syntax_tree,
                                oldCompilationContext) {
  let context;
  if (typeof oldCompilationContext != "undefined")
    context = oldCompilationContext;
  else
    context = {
      constants : new Map(),
      namedRegisters : new Map(),
      labels : new Map(),
    };
  if (typeof PicoBlaze === "object") {
    context.constants.set("PicoBlaze_Simulator_for_Android", 1);
    context.constants.set("PicoBlaze_Simulator_in_JS", 0);
  } else {
    context.constants.set("PicoBlaze_Simulator_in_JS", 1);
    context.constants.set("PicoBlaze_Simulator_for_Android", 0);
  }
  if (!(root_of_the_abstract_syntax_tree instanceof TreeNode) ||
      root_of_the_abstract_syntax_tree.text != "assembly") {
    // Such an error would be impossible in C++, but there is nothing preventing
    // it in JavaScript.
    alert(
        "Internal compiler error: The input to the preprocessor doesn't appear to be the output of the parser!");
    return context;
  }
  let address;
  for (const node_of_depth_1 of root_of_the_abstract_syntax_tree.children) {
    if (typeof oldCompilationContext != "undefined" &&
        !isDirective(node_of_depth_1.text)) {
      alert(
          "Line #" + node_of_depth_1.lineNumber + ": \"" +
          node_of_depth_1.text +
          "\" appears in an if-branching or a while-loop, but it is not a preprocessor directive. Only preprocessor directives can appear in if-branching and while-loops.");
      return context;
    }
    if (isMnemonic(node_of_depth_1.text)) {
      if (typeof oldCompilationContext != "undefined") {
        alert(
            "Line #" + node_of_depth_1.lineNumber + ': A mnemonic "' +
            node_of_depth_1.text +
            '" appears in an if-branching or a while-loop, where only preprocessor directives can appear!');
        return context;
      }
      if (typeof address === "undefined") {
        alert("Line " + node_of_depth_1.lineNumber + ': The mnemonic "' +
              node_of_depth_1.text +
              '" appears before any address has been set.');
        return context;
      }
      address++; // This won't work for most assembly language dialects, but it
                 // works for PicoBlaze (where all directives have the same
                 // size: 18 bits).
    }
    if (/:$/.test(node_of_depth_1.text)) {
      console.log(
          "DEBUG: Dealing with a label, point #1..."); // Eh, those JavaScript
                                                       // debuggers are worse
                                                       // than useless, I think
                                                       // now. Logging debug
                                                       // messages is so much
                                                       // easier than trying to
                                                       // use a debugger.
      if (typeof address === "undefined") {
        alert("Line " + node_of_depth_1.lineNumber + ': The label "' +
              node_of_depth_1.text +
              '" appears before any address has been set.');
        return context;
      }
      if (!/^(_|[a-z])\w*:$/i.test(node_of_depth_1.text)) {
        alert("Line " + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.text + '" is not an allowed label name.');
        return context;
      }
      console.log("DEBUG: Dealing with a label, point #2...");
      context.labels.set(
          node_of_depth_1.text.substring(
              0,
              node_of_depth_1.text.length -
                  1), // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/30
          address);
      console.log("DEBUG: Dealing with a label, point #3...");
    }
    if (/^address$/i.test(node_of_depth_1.text) ||
        /^org$/i.test(node_of_depth_1.text)) {
      if (typeof oldCompilationContext != "undefined") {
        alert(
            "Line #" + node_of_depth_1.lineNumber +
            ': The pseudo-mnemonic "address" appears in an if-branching or a while-loop, where only preprocessor directives can appear!');
        return context;
      }
      console.log("DEBUG: Setting the address, point #1...");
      if (node_of_depth_1.children.length != 1) {
        alert(
            "Line " + node_of_depth_1.lineNumber +
            ': The "address" pseudo-mnemonic doesn\'t have exactly one argument.');
        return context;
      }
      console.log("DEBUG: Setting the address, point #2...");
      address = node_of_depth_1.children[0].interpretAsArithmeticExpression(
          context.constants);
      console.log("DEBUG: Setting the address, point #3...");
    }
    if (/^constant$/i.test(node_of_depth_1.text) ||
        /^equ$/i.test(node_of_depth_1.text)) {
      console.log("DEBUG: Setting a constant, point #1...");
      if (node_of_depth_1.children.length != 3) {
        alert(
            "Line " + node_of_depth_1.lineNumber +
            ': The AST node "constant" should have exactly three child nodes (the comma is also an AST node).');
        return context;
      }
      if (!/^(_|[a-z])\w*$/i.test(node_of_depth_1.children[0].text)) {
        alert("Line " + node_of_depth_1.lineNumber + ': "' +
              node_of_depth_1.children[0].text +
              '" is not an allowed constant name.');
        return context;
      }
      if (node_of_depth_1.children[1].text != ",") {
        alert("Line " + node_of_depth_1.lineNumber +
              ': The second child of the "' + node_of_depth_1.text +
              '" node is "' + node_of_depth_1.children[1].text +
              '" instead of a comma.');
        return context;
      }
      console.log("DEBUG: Setting a constant, point #2...");
      context.constants.set(
          node_of_depth_1.children[0].text,
          node_of_depth_1.children[2].interpretAsArithmeticExpression(
              context.constants));
      console.log("DEBUG: Setting a constant, point #3...");
    }
    if (/^namereg$/i.test(node_of_depth_1.text)) {
      console.log("DEBUG: Naming a register, point #1...");
      if (node_of_depth_1.children.length != 3) {
        alert(
            "Line " + node_of_depth_1.lineNumber +
            ': The AST node "namereg" should have exactly three child nodes (the comma is also an AST node).');
        return context;
      }
      if (context.namedRegisters.has(node_of_depth_1.children[2].text)) {
        alert("Line " + node_of_depth_1.lineNumber + ': Variable named "' +
              node_of_depth_1.children[2].text +
              '" has already been declared!');
        return context;
      }
      if (!/s([0-9]|[a-f])/i.test(node_of_depth_1.children[0].text)) {
        alert(
            "Line " + node_of_depth_1.lineNumber + ': "' +
            node_of_depth_1.children[0].text +
            "\" is supposed to be a register name, but it doesn't match the regular expression for registers.");
        return context;
      }
      if (node_of_depth_1.children[1].text != ",") {
        alert("Line " + node_of_depth_1.lineNumber +
              ': The second child of the "' + node_of_depth_1.text +
              '" node is "' + node_of_depth_1.children[1].text +
              '" instead of a comma.');
        return context;
      }
      console.log("DEBUG: Naming a register, point #2...");
      context.namedRegisters.set(node_of_depth_1.children[2].text,
                                 node_of_depth_1.children[0].text);
      console.log("DEBUG: Naming a register, point #3...");
    }
    if (/^display$/i.test(node_of_depth_1.text) &&
        (
            typeof PicoBlaze !==
            "object" // Because UART_OUTPUT is not declared in PicoBlaze
                     // Simulator for Android, which we detect by `PicoBlaze`
                     // being declared.
            )) {
      if (node_of_depth_1.children[0].text[0] == '"')
        document.getElementById("UART_OUTPUT").innerText +=
            node_of_depth_1.children[0]
                .text
                .substring( // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/30
                    1, node_of_depth_1.children[0].text.length - 2 + 1);
      else {
        const ASCIIValue =
            node_of_depth_1.children[0].interpretAsArithmeticExpression(
                context.constants);
        if (ASCIIValue != '\n'.charCodeAt(0))
          document.getElementById("UART_OUTPUT")
              .appendChild(
                  document.createTextNode(String.fromCharCode(ASCIIValue)));
        else
          document.getElementById("UART_OUTPUT")
              .appendChild(document.createElement(
                  "br")); // This doesn't appear to work in Firefox if UART is
                          // disabled while assembling, and I have opened a
                          // GitHub issue about that:
                          // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/8
      }
    } else if (/^display$/i.test(node_of_depth_1.text)) {
      if (node_of_depth_1.children[0].text[0] == '"') {
        for (let i = 0; i < node_of_depth_1.children[0].text.length; i++)
          if (node_of_depth_1.children[0].text[i] != '"')
            PicoBlaze.displayCharacterOnTerminal(
                node_of_depth_1.children[0].text.charCodeAt(
                    i)); // Right now, `displayCharacterOnTerminal` is a
                         // no-operation in PicoBlaze_Simulator_for_Android.
      } else {
        PicoBlaze.displayCharacterOnTerminal(
            node_of_depth_1.children[0].interpretAsArithmeticExpression(
                context.constants));
      }
    }
    if (/^if$/i.test(node_of_depth_1.text) &&
        node_of_depth_1.children.length == 2) {
      //"if" without "else"
      if (node_of_depth_1.children[0].interpretAsArithmeticExpression(
              context.constants)) {
        context = makeCompilationContext(node_of_depth_1.children[1], context);
      }
    } else if (/^if$/i.test(node_of_depth_1.text) &&
               node_of_depth_1.children.length == 3) {
      // if-else
      if (node_of_depth_1.children[0].interpretAsArithmeticExpression(
              context.constants))
        context = makeCompilationContext(node_of_depth_1.children[1], context);
      else
        context = makeCompilationContext(node_of_depth_1.children[2], context);
    } else if (/^if$/i.test(node_of_depth_1.text)) {
      alert(
          "Line #" + node_of_depth_1.lineNumber +
          ': The "if" node should have either 2 or 3 child nodes. This one has ' +
          node_of_depth_1.children.length + " child nodes!");
      return context;
    }
    if (/^while$/i.test(node_of_depth_1.text) &&
        node_of_depth_1.children.length == 2) {
      while (node_of_depth_1.children[0].interpretAsArithmeticExpression(
          context.constants)) {
        context = makeCompilationContext(node_of_depth_1.children[1], context);
      }
    } else if (/^while$/i.test(node_of_depth_1.text)) {
      alert("Line #" + node_of_depth_1.lineNumber +
            ': The "while" node should have 2 nodes. This one has ' +
            node_of_depth_1.children.length + " child nodes!");
    }
  }
  return context;
}
