let areWeHighlighting = false; //Only purpose is to prevent multiple
function syntaxHighlighter(/*edit*/) {
    //"edit" should contain the cursor position, but that seems not to work.
    // I have opened a StackOverflow question about that:
    // https://stackoverflow.com/q/76566400/8902065
    if (areWeHighlighting)
        return;
    areWeHighlighting = true;
    const assemblyCodeDiv = document.getElementById("assemblyCode");
    const assemblyCode =
        assemblyCodeDiv.innerText.replace(/&/g, "&amp;")
            .replace(
                /</g,
                "&lt;") // This appears to cause this bug:
            // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/7
            .replace(/>/g, "&gt;");
    // const start=edit.selectionStart,
    //  end=edit.selectionEnd; //Cursor position.
    if (assemblyCode.indexOf("&") != -1) {
        alert(
            "Sorry about that, but syntax highlighting of the programs containing `<`, `&`, and `>` is not supported yet.");
        areWeHighlighting = false;
        return;
    }
    let areWeInAString = false;
    let areWeInAComment = false;
    let currentToken = "";
    let highlightedText = "";
    for (let i = 0; i < assemblyCode.length; i++) {
        if (assemblyCode[i] === ";" && !areWeInAString) {
            highlightedText += highlightToken(currentToken);
            currentToken = ";";
            areWeInAComment = true;
            continue;
        }
        if (areWeInAComment && assemblyCode[i] !== "\n") {
            currentToken += assemblyCode[i];
            continue;
        }
        if (assemblyCode[i] === "\n") {
            areWeInAString = false;
            areWeInAComment = false;
            highlightedText += highlightToken(currentToken) + "<br/>";
            currentToken = "";
            continue;
        }
        if (assemblyCode[i] === ":" && !areWeInAString) {
            highlightedText += highlightToken(currentToken + assemblyCode[i]);
            currentToken = "";
            continue;
        }
        if ((assemblyCode[i] === " " || assemblyCode[i] === "\t" ||
                assemblyCode[i] === "," || assemblyCode[i] === "+" ||
                assemblyCode[i] === "-" || assemblyCode[i] === "*" ||
                assemblyCode[i] === "/" || assemblyCode[i] === "^") &&
            !areWeInAString) {
            highlightedText += highlightToken(currentToken) + assemblyCode[i];
            currentToken = "";
            continue;
        }
        if (assemblyCode[i] === '"' && !areWeInAString) {
            highlightedText += highlightToken(currentToken);
            currentToken = '"';
            areWeInAString = true;
            continue;
        }
        if ((assemblyCode[i] === "(" || assemblyCode[i] === ")" ||
                assemblyCode[i] === "[" || assemblyCode[i] === "]" ||
                assemblyCode[i] === "{" || assemblyCode[i] === "}") &&
            !areWeInAString) {
            highlightedText += highlightToken(currentToken) +
                '<span class="parenthesis">' + assemblyCode[i] +
                "</span>";
            currentToken = "";
            continue;
        }
        if (assemblyCode[i] !== '"') {
            currentToken += assemblyCode[i];
            continue;
        }
        if (assemblyCode[i] === '"' && areWeInAString) {
            highlightedText += highlightToken(currentToken + '"');
            currentToken = "";
            areWeInAString = false;
        }
    }
    highlightedText += highlightToken(currentToken);
    assemblyCodeDiv.innerHTML = highlightedText;
    // The following code is supposed to move the cursor to the correct
    // position, but it doesn't work.
    /*
    const range=document.createRange();
    range.setStart(assemblyCodeDiv,start);
    range.setEnd(assemblyCodeDiv,end);
    const selection=window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    */
    areWeHighlighting = false;
}

function highlightToken(token) {
    if (token[0] === ";")
        return `<span class="comment">${token}</span>`;
    for (const mnemonic of mnemonics)
        if (RegExp("^" + mnemonic + "$", "i").test(token) ||
            /^interrupt$/i.test(token))
            return `<span class="mnemonic">${token}</span>`;
    for (const directive of preprocessor)
        if (RegExp("^" + directive + "$", "i").test(token))
            return `<span class="directive">${token}</span>`;
    if (/^s(\d|[a-f])$/i.test(token))
        return `<span class="register">${token}</span>`;
    if (/^N?[CZAB]$/i.test(token))
        // TODO: This actually sometimes incorrectly highlights "a" as
        // a flag, when it is in fact a hexadecimal constant. You can
        // read more about it here:
        // https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/issues/6
        return `<span class="flag">${token}</span>`;
    if (/:$/.test(token))
        return `<span class="label">${token}</span>`;
    if (token[0] === '"')
        return `<span class="string">${token}</span>`;
    if (/^(\d|[a-f])+$/i.test(token) || /\'d$/.test(token) || /\'b$/.test(token))
        return `<span class="number">${token}</span>`;
    return token;
}