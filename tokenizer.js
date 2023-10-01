"use strict";
function tokenize(input) {
  let tokenized = [];
  let areWeInAString = false;
  let areWeInAComment = false;
  let currentLine = 1; // Don't care about columns, lines in assembly language
                       // are always short.
  let currentToken = "";
  for (let i = 0; i < input.length; i++) {
    if (areWeInAComment && areWeInAString) {
      alert(
          "Tokenizer got into a forbidden state because of some bug in it! Line " +
          currentLine);
      return [];
    }
    if (input[i] == ";" && !areWeInAString) {
      areWeInAComment = true;
      tokenized.push(new TreeNode(currentToken, currentLine));
      tokenized.push(new TreeNode("\n", currentLine));
      continue;
    }
    if (areWeInAComment && input[i] != "\n")
      continue;
    if (areWeInAComment && input[i] == "\n") {
      areWeInAComment = false;
      currentLine++;
      currentToken = "";
      continue;
    }
    if (input[i] == '"' && !areWeInAString) {
      areWeInAString = true;
      tokenized.push(new TreeNode(currentToken, currentLine));
      currentToken = '"';
      continue;
    }
    if (input[i] == "\n" && areWeInAString) {
      alert("Unterminated string literal on line " + currentLine);
      return [];
    }
    if (input[i] == '"') {
      areWeInAString = false;
      currentToken += '"';
      tokenized.push(new TreeNode(currentToken, currentLine));
      currentToken = "";
      continue;
    }
    if (input[i] == "\n") {
      tokenized.push(new TreeNode(currentToken, currentLine));
      currentToken = "";
      tokenized.push(new TreeNode(
          "\n", currentLine++)); // Because assembly language is a
                                 // whitespace-sensitive language, the new-line
                                 // characters are tokens visible to the parser.
      continue;
    }
    if (
        (input[i] == " " || input[i] == "\t") &&
        !areWeInAString // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/5
    ) {
      tokenized.push(new TreeNode(currentToken, currentLine));
      currentToken = "";
      continue;
    }
    if ((input[i] == "(" || input[i] == ")" || input[i] == "[" ||
         input[i] == "]" || input[i] == "{" || input[i] == "}" ||
         input[i] == "," || input[i] == "/" || input[i] == "*" ||
         input[i] == "-" || input[i] == "+" || input[i] == "^" ||
         input[i] == "<" || input[i] == ">" || input[i] == "=" ||
         input[i] == "&" || input[i] == "|") &&
        !areWeInAString) {
      tokenized.push(new TreeNode(currentToken, currentLine));
      tokenized.push(new TreeNode(input[i], currentLine));
      currentToken = "";
      continue;
    }
    if (input[i] == ":") {
      tokenized.push(new TreeNode(currentToken + ":", currentLine));
      currentToken = "";
      continue;
    }
    currentToken += input[i];
  }
  if (currentToken.length) {
    tokenized.push(new TreeNode(currentToken, currentLine));
    tokenized.push(new TreeNode("\n", currentLine));
  }
  if (tokenized[tokenized.length - 1].text != "\n")
    tokenized.push(new TreeNode("\n", currentLine));
  for (let i = 0; i < tokenized.length; i++) {
    if (!(tokenized[i] instanceof TreeNode)) {
      alert("Internal compiler error in tokenizer, the token #" + i +
            " is not of type TreeNode!");
      return [];
    }
    if (tokenized[i].text == "") {
      tokenized.splice(i, 1);
      i--;
    }
  }
  return tokenized;
}
