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
      i++ // First, let's deal with the parentheses.
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
      if (RegExp("^" + directive + "$", "i").test(tokenized[i].text))
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
  root.children = tokenized;
  if (root.checkTypes())
    return root;
  return new TreeNode("assembly", 0);
}
