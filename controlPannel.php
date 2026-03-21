<?php
session_start();

if (!isset($_SESSION['username']) ||
       	$_SESSION['username'] != "Teo Samar&zcaron;ija") {
  header("Location: login.php");
  echo "Redirecting you to the login page...";
  exit();
}

include 'db_helper.php';
$conn = Database::getInstance()->getConnection();
$message = "";

if (isset($_GET['id']) && isset($_GET['permanent'])) {
    if ($_GET['permanent']){
	    $stmt = $conn->prepare("SELECT COUNT(*) AS counter_in_deleted_programs FROM deleted_programs WHERE previous_id = ?");
	    $stmt->bind_param('s', $_GET["id"]);
	    $stmt->execute();
	    $number_of_programs = $stmt->get_result()->fetch_assoc()['counter_in_deleted_programs'];
	    if (!$number_of_programs) {
    		$stmt = $conn->prepare("INSERT INTO deleted_programs(previous_id) VALUES (?)");
    		$stmt->bind_param('s', $_GET["id"]);
		$stmt->execute();
	    }
	    else $message="The id " . htmlspecialchars($_GET['id']) . " is already present in the table with deleted programs!";
    }
    if (!$message) {
	    $stmt = $conn->prepare("SELECT COUNT(*) AS program_counter FROM programs WHERE id = ?");
	    $stmt->bind_param('s', $_GET['id']);
	    $stmt->execute();
 	    $number_of_programs = $stmt->get_result()->fetch_assoc()['program_counter'];
	    if (!$number_of_programs) {
	    	$message = "The program with the id " . htmlspecialchars($_GET['id']) . " does not exist in the database.";
	    }
	    else
    	    {
		$stmt = $conn->prepare("DELETE FROM programs WHERE id = ?");
    		$stmt->bind_param('s', $_GET["id"]);
		$stmt->execute();
		$message = "Program successfully deleted!";
    	    }
    }
}
?>
<!doctype html>
<html lang="en">

<head>
  <title>PicoBlaze assembler and emulator in JavaScript - Control Pannel</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>

    body {
      font-family: Arial, Helvetica, sans-serif;
      background-color: #ddd;
    }

    main {
      max-width: 800px;
      margin: auto;
      background-color: whitesmoke;
    }

    @keyframes myAnimation {
      from {
	border-radius: 0;
        border-color: whitesmoke;
      }
      50% {
        border-color: darkgray;
      }
      to {
	border-radius: 15px;
        border-color: whitesmoke;
      }
    }

    @media (min-width: 850px) {
      main {
	padding: 20px;
        animation-name: myAnimation;
        animation-duration: 4s;
        animation-delay: 1s;
	animation-iteration-count: 1;
	animation-fill-mode: forwards;
        border-style: solid;
	border-width: 3px;
        border-color: whitesmoke;
      }
    }

    h1 {
      text-align: center;
    }

    .divWithCode {
      --width-of-the-line-numbers: 50px;
      position: relative;
      height: 500px;
    }

    .divWithLineNumbers {
      position: absolute;
      height: 500px;
      overflow: hidden;
      width: var(--width-of-the-line-numbers);
      left: 2px;
      top: 0;
      text-align: right;
      background-color: #aaa;
      font-family: Monospace;
      font-size: 1em;
      border-radius: 5px 0 0 5px;
    }

    pre {
      top: -1em;
      position: absolute;
      width: calc(100% - 14px - var(--width-of-the-line-numbers));
      left: calc(var(--width-of-the-line-numbers) + 2px);
      height: 500px;
      overflow: scroll;
      background-color: #eee;
      color: #111;
      padding-left: 5px;
      padding-right: 5px;
      border-radius: 0 5px 5px 0;
    }

    .string {
      color: #770000;
    }

    .number {
      color: #007777;
    }

    .directive {
      color: #770077;
      font-weight: bold;
    }

    .parenthesis {
      font-weight: bold;
    }

    .flag {
      color: #007700;
      font-weight: bold;
    }

    .label {
      color: #770077;
    }

    .comment {
      color: #333333;
      font-style: italic;
    }

    .mnemonic {
      color: #000077;
      font-weight: bold;
    }

    .register {
      color: #773300;
      font-weight: bold;
    }
  </style>
  <script src="list_of_directives.js"></script>
  <script src="headerScript.js"></script>
  <script>
      window.onload = () => {
      <?php
        if ($message)
		echo "alert(\"$message\");";
      ?>
      const divsWithCode = document.getElementsByClassName("divWithCode");
      for (const divWithCode of divsWithCode) {
        const divWithLineNumbers = divWithCode.children[0];
        const preElement = divWithCode.children[1];
        const innerText = preElement.innerText;
        const numberOfLines = (innerText.match(/\n/g) || []).length + 1;
        let resultString = "";
        for (let i = 0; i < numberOfLines; i++)
          resultString += (i + 1) + ".<br/>";
        divWithLineNumbers.innerHTML = resultString;
        preElement.onscroll = (event) => {
          event.target.parentNode.children[0].scroll(
            0, event.target.scrollTop);
        };
        if ((/[&<>]/.test(innerText)))
          continue;
        const assemblyCode = innerText;
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
              assemblyCode[i] === "/" || assemblyCode[i] === "^" ||
              assemblyCode[i] === '?') &&
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
        preElement.innerHTML = highlightedText;

      }
    };
  </script>
</head>

<body>
  <main>
  <h1>Hello, <?php echo $_SESSION['username']; ?>!</h1>
  <a href="logout.php">Logout</a>
  <?php
  $stmt = $conn->prepare("SELECT COUNT(*) AS number_of_programs FROM programs");
  $stmt->execute();

  $number_of_programs = $stmt->get_result()->fetch_assoc()['number_of_programs'];

  echo "<p>There are $number_of_programs programs in the database.</p>\n";

  $stmt = $conn->prepare("SELECT id, code, created_at FROM programs");
  $stmt->execute();
  $stmt->bind_result($id, $code, $created_at);

  while ($stmt->fetch()) {
    echo "<section><h2>Program with the id <code>$id</code></h2>\n";
    echo "<div class=\"divWithCode\"><div class=\"divWithLineNumbers\"></div><pre>" . htmlspecialchars($code) . "</pre></div>\n" . "Created at: <code>$created_at</code><br/><input id=\"input_for_example_$id\" type=\"checkbox\"><label for=\"input_for_example_$id\">Store that id into the table of recently deleted programs, so that it gets replaced</label><br/><button onclick=\"window.location.href='controlPannel.php?id=$id&permanent='+(document.getElementById('input_for_example_$id').checked | 0)\">Delete from database</button></section>\n";
  }

  $stmt = $conn->prepare("SELECT COUNT(*) AS number_of_deleted_programs FROM deleted_programs");
  $stmt->execute();

  $number_of_deleted_programs = $stmt->get_result()->fetch_assoc()['number_of_deleted_programs'];

  echo "<p>There are $number_of_deleted_programs programs that have been recently deleted from the database.</p>";

  if ($number_of_deleted_programs) {
    echo "<ul>";
    $stmt = $conn->prepare("SELECT previous_id FROM deleted_programs");
    $stmt->execute();
    $stmt->bind_result($id);
    while ($stmt->fetch())
      echo "<li>$id</li>";
    echo "</ul>";
  }
  ?>
  </main>
</body>

</html>
