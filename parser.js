// I have hand-written this parser partly because I don't know of any BISON-like
// tool that supports JavaScript and partly because I am not even sure how would
// I make a parser for PicoBlaze Assembly in BISON. The keywords "enable" and
// "disable" are problematic (they can be both mnemonics and, let's say so,
// "adverbs"). I have opened a StackExchange question about that:
// https://langdev.stackexchange.com/q/1679/330
"use strict";
function parse(tokenized) {
  let report = "[";
  for (let i = 0; i < tokenized.length; i++)
    if (i < tokenized.length - 1)
      report += tokenized[i].getLispExpression() + ",";
    else
      report += tokenized[i].getLispExpression();
  report += "]";
  console.log("Parsing the expression: " + report);
  let root = new TreeNode("assembly", 0); // Value which will be returned.
  for (
      let i = 0; i < tokenized.length;
      i++ // First, let's deal with if-branching and while-loops...
  ) {
    if (/^if$/i.test(tokenized[i].text)) {
      let pointerToTheNextNewline = i + 1, condition = [];
      while (tokenized[pointerToTheNextNewline].text != "\n") {
        condition.push(tokenized[pointerToTheNextNewline]);
        if (pointerToTheNextNewline >= tokenized.length) {
          alert(
              "Line #" + tokenized[i].lineNumber +
              ': The condition after "if" doesn\'t end in a new-line character!');
          return root;
        }
        pointerToTheNextNewline++;
      }
      tokenized[i].children.push(parse(condition).children[0]);
      tokenized.splice(i + 1, pointerToTheNextNewline - i);
      let pointerToTheEndIfOrElse = i + 1, counter = 1, thenClause = [];
      while (true) {
        if (pointerToTheEndIfOrElse >= tokenized.length) {
          alert("Line #" + tokenized[i].lineNumber +
                ': The "if" directive here isn\'t closed by an "endif"!');
          return root;
        }
        if (/^if$/i.test(tokenized[pointerToTheEndIfOrElse].text))
          counter++;
        if (/^endif$/i.test(tokenized[pointerToTheEndIfOrElse].text))
          counter--;
        if (!counter ||
            (/^else$/i.test(tokenized[pointerToTheEndIfOrElse].text) &&
             counter == 1))
          break;
        thenClause.push(tokenized[pointerToTheEndIfOrElse]);
        pointerToTheEndIfOrElse++;
      }
      let lineNumberOfElseOrEndIf =
          tokenized[pointerToTheEndIfOrElse].lineNumber;
      tokenized.splice(i + 1, pointerToTheEndIfOrElse - i);
      tokenized[i].children.push(parse(thenClause));
      if (counter) {
        // If there is an "else"-clause
        let pointerToEndIf = i + 1, elseClause = [];
        while (counter) {
          if (pointerToEndIf >= tokenized.length) {
            alert("Line #" + lineNumberOfElseOrEndIf +
                  ': The "else" here is not followed by an "endif"!');
            return root;
          }
          if (/^if$/i.test(tokenized[pointerToEndIf].text))
            counter++;
          if (/^endif$/i.test(tokenized[pointerToEndIf].text))
            counter--;
          if (/^else$/i.test(tokenized[pointerToEndIf].text) && counter == 1) {
            alert("Line #" + tokenized[pointerToEndIf].lineNumber +
                  ': Found "else" when expecting "endif"!');
            return root;
          }
          elseClause.push(tokenized[pointerToEndIf]);
          pointerToEndIf++;
        }
        elseClause.splice(elseClause.length - 1, 1);
        tokenized.splice(i + 1, pointerToEndIf - i);
        tokenized[i].children.push(parse(elseClause));
      }
    } else if (/^endif$/i.test(tokenized[i].text) ||
               /^else$/i.test(tokenized[i].text)) {
      alert("Line #" + tokenized[i].lineNumber +
            ': The preprocessor directive "' + tokenized[i].text +
            '" found without the corresponding "if" directive!');
      return root;
    } else if (/^while$/i.test(tokenized[i].text)) {
      let pointerToTheNextNewline = i + 1, condition = [];
      while (tokenized[pointerToTheNextNewline].text != "\n") {
        condition.push(tokenized[pointerToTheNextNewline]);
        if (pointerToTheNextNewline >= tokenized.length) {
          alert(
              "Line #" + tokenized[i].lineNumber +
              ': The condition after "while" doesn\'t end in a new-line character!');
          return root;
        }
        pointerToTheNextNewline++;
      }
      tokenized[i].children.push(parse(condition).children[0]);
      tokenized.splice(i + 1, pointerToTheNextNewline - i);
      let pointerToEndWhile = i + 1, counter = 1, loopClause = [];
      while (counter) {
        if (pointerToEndWhile >= tokenized.length) {
          alert("Line #" + tokenized[i].lineNumber +
                ': The "while" here isn\'t being closed by an "endwhile"!');
          return root;
        }
        if (/^while$/i.test(tokenized[pointerToEndWhile].text))
          counter++;
        if (/^endwhile$/i.test(tokenized[pointerToEndWhile].text))
          counter--;
        loopClause.push(tokenized[pointerToEndWhile]);
        pointerToEndWhile++;
      }
      loopClause.splice(loopClause.length - 1, 1);
      tokenized[i].children.push(parse(loopClause));
      tokenized.splice(i + 1, pointerToEndWhile - i);
    } else if (/^endwhile$/i.test(tokenized[i].text)) {
      alert(
          "Line #" + tokenized[i].lineNumber +
          ': The preprocessor directive "endwhile" found without the corresponding "while" directive!');
      return root;
    }
  }
  for (
      let i = 0; i < tokenized.length;
      i++ // Then, let's deal with the parentheses.
  ) {
    if (tokenized[i].text == "(") {
      // As far as I know, PicoBlaze Assembly uses only this type of
      // parentheses.
      let counter = 1;
      let j = i + 1;
      while (counter) {
        if (j >= tokenized.length) {
          alert("The parenthesis on line " + tokenized[i].lineNumber +
                " isn't closed!");
          return root;
        }
        if (tokenized[j].text == "(")
          counter++;
        if (tokenized[j].text == ")")
          counter--;
        j++;
      }
      let newArray = [];
      for (let k = i + 1; k < j - 1; k++)
        newArray.push(tokenized[k]);
      tokenized.splice(i + 1, j - i - 1);
      tokenized[i].text = "()";
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
    // the next new-line character. Unfortunately, we can't use the C++ find_if
    // here...
    let j = i;
    while (true) {
      if (j >= tokenized.length) {
        alert(
            "Internal compiler error: The assembly-lanaguage expression in line " +
            tokenized[i].lineNumber + " doesn't end with a new-line token!");
        return root;
      }
      if (tokenized[j].text == "\n")
        break;
      j++;
    }
    let newArray = [];
    for (let k = i + 1; k < j; k++)
      newArray.push(tokenized[k]);
    tokenized[i].children = parse(newArray).children;
    tokenized.splice(i + 1, j - i - 1);
  }
  // Parsing arithmetic expressions...
  for (let i = 0; i < tokenized.length; i++)
    if ((tokenized[i].text == "+" || tokenized[i].text == "-") &&
        (i == 0 || tokenized[i - 1].text == "," ||
         tokenized[i - 1].text == "(" || tokenized[i - 1].text == "\n") &&
        !tokenized[i].children.length) {
      // Unary operators
      if (tokenized.length == 1 || tokenized[i + 1].text == "," ||
          tokenized[i + 1].text == "\n") {
        alert("Line #" + tokenized[i].lineNumber + ": The unary operator '" +
              tokenized[i].text + "' has zero operands!");
        return root;
      }
      tokenized[i].children = [
        new TreeNode("0", tokenized[i].lineNumber),
        tokenized[i + 1],
      ];
      tokenized.splice(i + 1, 1);
    }
  const parseBinaryOperators = (operators) => {
    for (let i = 0; i < tokenized.length; i++)
      if (operators.includes(tokenized[i].text) &&
          tokenized[i].children.length == 0) {
        if (i == 0 || tokenized[i - 1].text == "," ||
            tokenized[i - 1].text == "\n" || i == tokenized.length - 1 ||
            tokenized[i + 1].text == "," || tokenized[i + 1].text == "\n") {
          alert("Line #" + tokenized[i].lineNumber + ": The binary operator '" +
                tokenized[i].text + "' has less than two operands!");
          return root;
        }
        tokenized[i].children = [ tokenized[i - 1], tokenized[i + 1] ];
        tokenized.splice(i - 1, 1);
        tokenized.splice(i, 1);
        i--;
        continue;
      }
  };
  parseBinaryOperators([ "^" ]); // Exponentiation.
  parseBinaryOperators([ "*", "/" ]);
  parseBinaryOperators([ "+", "-" ]);
  parseBinaryOperators([ "<", ">", "=" ]);
  parseBinaryOperators([ "&" ]);
  parseBinaryOperators([ "|" ]);
  root.children = tokenized;
  if (root.checkTypes())
    return root;
  return new TreeNode("assembly", 0);
}
