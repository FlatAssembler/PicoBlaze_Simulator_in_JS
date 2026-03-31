// I have hand-written this parser partly because I don't know of any BISON-like
// tool that supports JavaScript and partly because I am not even sure how would
// I make a parser for PicoBlaze Assembly in BISON. The keywords "enable" and
// "disable" are problematic (they can be both mnemonics and, let's say so,
// "adverbs"). I have opened a StackExchange question about that:
// https://langdev.stackexchange.com/q/1679/330
"use strict";

/*
 * In most assemblers, the parser returns a two-dimensional array of trees,
 * many of those trees containing only a single node (and only arithmetic
 * expressions being represented with a multiple-node tree). The parser of
 * this assembler works differently, more like a parser for higher-level
 * programming languages. The parser of this assembler returns one big
 * tree, with the root being a node containing the text "assembly". Labels,
 * preprocessor directives and mnemonics are nodes of depth equal to 1, and
 * their operands are their children.
 */

function parse(tokenized) {

  // This function is recursive, so we are going to print the argument to
  // make it easier to debug it.
  let report =
      "[" +
      tokenized.map((node) => {return node.getLispExpression()}).join(',') +
      "]";
  console.log("Parsing the expression: " + report);

  let root_of_abstract_syntax_tree = new TreeNode(
      "assembly", 0); // Value which will be returned from the parser.

  for (
      let i = 0; i < tokenized.length;
      i++ // First, let's deal with if-branching and while-loops...
  ) {
    if (/^if$/i.test(tokenized[i].text)) {
      const pointerToTheNextNewline =
          tokenized.findIndex((node, index) => index > i && node.text == '\n');
      if (pointerToTheNextNewline == -1) {
        alert(
            "Line #" + tokenized[i].lineNumber +
            ': The condition after "if" doesn\'t end in a new-line character!');
        return root_of_abstract_syntax_tree;
      }
      const condition = tokenized.slice(i + 1, pointerToTheNextNewline);
      tokenized[i].children.push(parse(condition).children[0]);
      tokenized.splice(i + 1, pointerToTheNextNewline - i);
      let counter = 1;
      const pointerToTheEndIfOrElse = tokenized.findIndex((node, index) => {
        if (index <= i)
          return false;
        if (/^if$/i.test(node.text))
          counter++;
        if (/^endif$/i.test(node.text))
          counter--;
        if (!counter || (/^else$/i.test(node.text) && counter == 1))
          return true;
        return counter == 0;
      });
      if (pointerToTheEndIfOrElse == -1) {
        alert("Line #" + tokenized[i].lineNumber +
              ': The "if" directive here isn\'t closed by an "endif"!');
        return root_of_abstract_syntax_tree;
      }

      const thenClause = tokenized.slice(i + 1, pointerToTheEndIfOrElse);
      let lineNumberOfElseOrEndIf =
          tokenized[pointerToTheEndIfOrElse].lineNumber;
      tokenized.splice(i + 1, pointerToTheEndIfOrElse - i);
      tokenized[i].children.push(parse(thenClause));
      if (counter) {
        // If there is an "else"-clause
        const pointerToEndIf = tokenized.findIndex((node, index) => {
          if (index <= i)
            return false;
          if (/^if$/i.test(node.text))
            counter++;
          if (/^endif$/i.test(node.text))
            counter--;
          if (/^else$/i.test(node.text) && counter == 1) {
            alert("Line #" + node.lineNumber +
                  ': Found "else" when expecting "endif"!');
            return true;
          }
          return counter == 0;
        });
        if (pointerToEndIf == -1) {
          alert("Line #" + lineNumberOfElseOrEndIf +
                ': The "else" here is not followed by an "endif"!');
          return root_of_abstract_syntax_tree;
        }
        const elseClause = tokenized.slice(i + 1, pointerToEndIf);
        tokenized.splice(i + 1, pointerToEndIf - i);
        tokenized[i].children.push(parse(elseClause));
      }
    } else if (/^endif$/i.test(tokenized[i].text) ||
               /^else$/i.test(tokenized[i].text)) {
      alert("Line #" + tokenized[i].lineNumber +
            ': The preprocessor directive "' + tokenized[i].text +
            '" found without the corresponding "if" directive!');
      return root_of_abstract_syntax_tree;
    } else if (/^while$/i.test(tokenized[i].text)) {
      let pointerToTheNextNewline = tokenized.findIndex(
          (node, index) => (index >= i && node.text == '\n'));
      if (pointerToTheNextNewline == -1) {
        alert(
            "Line #" + tokenized[i].lineNumber +
            ': The condition after "while" doesn\'t end in a new-line character!');
        return root_of_abstract_syntax_tree;
      }
      const condition = tokenized.slice(i + 1, pointerToTheNextNewline);
      tokenized[i].children.push(parse(condition).children[0]);
      tokenized.splice(i + 1, pointerToTheNextNewline - i);
      let counter = 1;
      const pointerToEndWhile = tokenized.findIndex((node, index) => {
        if (index <= i)
          return false;
        if (/^while$/i.test(node.text))
          counter++;
        if (/^endwhile$/i.test(node.text))
          counter--;
        return counter == 0;
      }) + 1;
      if (pointerToEndWhile == 0) {
        alert("Line #" + tokenized[i].lineNumber +
              ': The "while" here isn\'t being closed by an "endwhile"!');
        return root_of_abstract_syntax_tree;
      }
      const loopClause = tokenized.slice(i + 1, pointerToEndWhile - 1);
      tokenized[i].children.push(parse(loopClause));
      tokenized.splice(i + 1, pointerToEndWhile - i);
    } else if (/^endwhile$/i.test(tokenized[i].text)) {
      alert(
          "Line #" + tokenized[i].lineNumber +
          ': The preprocessor directive "endwhile" found without the corresponding "while" directive!');
      return root_of_abstract_syntax_tree;
    }
  }

  for (
      let i = 0; i < tokenized.length;
      i++ // Then, let's deal with the parentheses.
  ) {
    if (/\($/.test(tokenized[i].text)) {
      // As far as I know, PicoBlaze Assembly uses only this type of
      // parentheses.
      let counter = 1; // When JavaScript supports no static variables.
      const j = tokenized.findIndex((node, index) => {
        if (index <= i)
          return false;
        if (/\($/.test(node.text))
          counter++;
        if (node.text == ")")
          counter--;
        return counter == 0;
      }) + 1;
      console.log("The parenthesis on the index " + i +
                  " is closed at the index " + j + ".");
      if (j == 0) {
        alert("The parenthesis on line " + tokenized[i].lineNumber +
              " isn't closed!");
        return root_of_abstract_syntax_tree;
      }
      const newArray = tokenized.slice(i + 1, j - 1);
      tokenized.splice(i + 1, j - i - 1);
      tokenized[i].text += ")";
      tokenized[i].children = parse(newArray).children;
    }
  }

  // Dealing with mnemonics and preprocessor directives...
  for (let i = 0; i < tokenized.length; i++) {
    if (tokenized[i].text == "\n") {
      // Delete the new-line characters when you pass over them.
      tokenized.splice(i, 1);
      i--;
      continue;
    }
    // Check if the current token is a mnemonic or a preprocessor directive...
    let isMnemonicOrPreprocessorDirective = false;
    for (const mnemonic of mnemonics)
      if (RegExp("^" + mnemonic + "$", "i").test(tokenized[i].text))
        isMnemonicOrPreprocessorDirective = true;
    for (const directive of preprocessor)
      if (RegExp("^" + directive + "$", "i").test(tokenized[i].text) &&
          !/^while$/i.test(tokenized[i].text) &&
          !/^if$/i.test(tokenized[i].text))
        isMnemonicOrPreprocessorDirective = true;
    if (!isMnemonicOrPreprocessorDirective ||
        (tokenized.length === 1 && (/^enable$/i.test(tokenized[0].text) ||
                                    /^disable$/i.test(tokenized[0].text))))
      continue;
    // If the current token is a mnemonic or a preprocessor directive, seek for
    // the next new-line character. The solution to use `findIndex` is not as
    // nice as using the C++'es `find_if` template function, but it is still
    // way nicer than using a `while` loop for that.
    const j =
        tokenized.findIndex((node, index) => (index >= i && node.text == '\n'));
    if (j == -1) {
      alert(
          "Internal compiler error: The assembly-lanaguage expression in line " +
          tokenized[i].lineNumber + " doesn't end with a new-line token!\n" +
          "Did you try writing something like `load (load s0, s1), s2`? That's invalid assembly code, assembly language doesn't support linguistic recursion. You need to write this:\n" +
          "load s1, s2\n" +
          "load s0, s1\n" +
          "instead."); // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/17
      return root_of_abstract_syntax_tree;
    }
    const newArray = tokenized.slice(i + 1, j);
    tokenized[i].children = parse(newArray).children;
    tokenized.splice(i + 1, j - i - 1);
  }

  // Parsing arithmetic expressions...
  for (let i = tokenized.length - 1; i >= 0;
       i--) // We need to iterate backward rather than forward in order to parse
            // tthe expressions such as "inst --5" correctly.
    if ((tokenized[i].text == "+" || tokenized[i].text == "-") &&
        (i == 0 || tokenized[i - 1].text == "," ||
         tokenized[i - 1].text.substring(tokenized[i - 1].length - 1) == "(" ||
         tokenized[i - 1].text == "\n" ||
         ([
           "+", "-", "*", "/", "^", "&", "|", "=", "<", ">", "?", ":"
         ].includes(tokenized[i - 1].text) &&
          !tokenized[i - 1].children.length)) &&
        !tokenized[i].children.length) {
      // Unary operators
      if (tokenized.length == 1 ||
          i >=
              tokenized.length -
                  1 || // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/42
          tokenized[i + 1].text == "," ||
          tokenized[i + 1].text == "\n") {
        alert("Line #" + tokenized[i].lineNumber + ": The unary operator '" +
              tokenized[i].text + "' has zero operands!");
        return root_of_abstract_syntax_tree;
      }
      tokenized[i].children = [
        new TreeNode("0", tokenized[i].lineNumber),
        tokenized[i + 1],
      ];
      tokenized.splice(i + 1, 1);
    }

  /*
   * To better understand how the following code (for parsing arithmetic
   * expressions) works, I'd suggest you to study the task "Izraz" from Infokup
   * 2013: https://informatika.azoo.hr/natjecanje/dogadjaj/235/rezultati
   */

  const parseBinaryOperators = (operators) => {
    for (let i = 0; i < tokenized.length; i++)
      if (operators.includes(tokenized[i].text) &&
          tokenized[i].children.length == 0) {
        if (i == 0 || tokenized[i - 1].text == "," ||
            tokenized[i - 1].text == "\n" || i == tokenized.length - 1 ||
            tokenized[i + 1].text == "," || tokenized[i + 1].text == "\n") {
          alert("Line #" + tokenized[i].lineNumber + ": The binary operator '" +
                tokenized[i].text + "' has less than two operands!");
          return false;
        }
        tokenized[i].children = [ tokenized[i - 1], tokenized[i + 1] ];
        tokenized.splice(i - 1, 1);
        tokenized.splice(i, 1);
        i--;
        continue;
      }
    return true;
  };

  const binaryOperators = [
    [ "^" ], // Exponentiation (has the highest priority).
    [
      "*", "/"
    ], // Multiplication and division have the same priority, that's why they
       // are in the same row in the 2-dimensional array.
    [ "+", "-" ], // So do addition and subtraction have the same priority...
    [ "<", ">", "=" ], [ "&" ],
    [ "|" ] // Logical "or" (has the lowest priority).
  ];
  for (const operators of binaryOperators)
    if (!parseBinaryOperators(operators))
      return root_of_abstract_syntax_tree;

  // Ternary conditional operator...
  /*
   * What is the best way of parsing right-associative operators, such as the
   * ternary conditional `?:` operator? In both my AEC-to-WebAssembly compiler
   * and the following code in my PicoBlaze assembler, I was using the "scan
   * backwards" method. However, I received some comments that it is considered
   * to be an anti-pattern. So, I opened a StackExchange question about that:
   * https://langdev.stackexchange.com/q/4071/330
   */
  if (!Array.prototype
           .findLastIndex) // Firefox 52 (the last version of Firefox to run on
                           // Windows XP) does not support the findLastIndex
                           // directive on an array.
    Array.prototype.findLastIndex = function(lambda) {
      for (let i = this.length - 1; i >= 0; i--)
        if (lambda(this[i], i))
          return i;
      return -1;
    };

  let lastColon;
  while ((lastColon = tokenized.findLastIndex((node, index) => {
           if (index > tokenized.length - 2)
             return false;
           if (node.text == ':' && tokenized[index + 1].text != '\n')
             return true;
           return false;
         })) != -1) {
    console.log(
        "DEBUG: Parsing the ternary conditional operator. The colon is at the index: " +
        lastColon);
    let counter = 1;
    const questionMarkCorrespondingToTheLastColon =
        tokenized.findLastIndex((node, index) => {
          if (index >= lastColon)
            return false;
          if (node.text == '?')
            counter--;
          else if (node.text == ':')
            counter++;
          return counter == 0;
        });
    if (questionMarkCorrespondingToTheLastColon == -1) {
      alert("Line #" + tokenized[lastColon].lineNumber +
            ": There is a colon without a matching question mark before it!");
      return root_of_abstract_syntax_tree;
    }
    console.log("DEBUG: The corresponding question mark is at the index: " +
                questionMarkCorrespondingToTheLastColon);
    if (questionMarkCorrespondingToTheLastColon == 0) {
      alert(
          "Line #" +
          tokenized[questionMarkCorrespondingToTheLastColon].lineNumber +
          ": The ternary conditional operator has no first argument (the condition).");
      return root_of_abstract_syntax_tree;
    }
    let nodesThatRecursionDealsWith =
        tokenized.slice(questionMarkCorrespondingToTheLastColon + 1, lastColon);
    tokenized[questionMarkCorrespondingToTheLastColon].text = "?:";
    tokenized[questionMarkCorrespondingToTheLastColon].children.push(
        tokenized[questionMarkCorrespondingToTheLastColon - 1]);
    const whatTheRecursionReturned = parse(nodesThatRecursionDealsWith);
    if (whatTheRecursionReturned.children.length > 1) {
      alert("Line #" + whatTheRecursionReturned.children[1].lineNumber +
            ": Unexpected token `" + whatTheRecursionReturned.children[1].text +
            "`!");
      return root_of_abstract_syntax_tree;
    }
    tokenized[questionMarkCorrespondingToTheLastColon].children.push(
        whatTheRecursionReturned.children[0]);
    tokenized[questionMarkCorrespondingToTheLastColon].children.push(
        tokenized[lastColon + 1]);
    console.log(
        "DEBUG: The ternary conditional operator converted to LISP is: " +
        tokenized[questionMarkCorrespondingToTheLastColon].getLispExpression());
    tokenized.splice(questionMarkCorrespondingToTheLastColon + 1,
                     lastColon - questionMarkCorrespondingToTheLastColon + 1);
    tokenized.splice(questionMarkCorrespondingToTheLastColon - 1, 1);
  }

  root_of_abstract_syntax_tree.children = tokenized;
  if (root_of_abstract_syntax_tree.checkTypes())
    return root_of_abstract_syntax_tree;

  return new TreeNode("assembly", 0);
}
