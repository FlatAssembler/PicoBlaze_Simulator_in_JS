<?php
session_start();

if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit();
}
?>
<!doctype html>
<html>
<head>
<title>PicoBlaze assembler and emulator in JavaScript - Control Pannel</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
.divWithCode {
  --width-of-the-line-numbers: 30px;
  position: relative;
  height: 500px;
}
.divWithLineNumbers {
  position: absolute;
  height: 500px;
  overflow: hidden;
  width: var(--width-of-the-line-numbers);
  left: 0;
  top: 0;
  text-align: right;
  background-color: #aaa;
  font-family: Monospace;
  font-size: 1em;
}
pre {
  top: -1em;
  position: absolute;
  width: calc(100% - 10px - var(--width-of-the-line-numbers));
  left: var(--width-of-the-line-numbers);
  height: 500px;
  overflow: scroll;
  background-color: #eee;
  color: #111;
  padding-left: 5px;
}
</style>
<script>
window.onload=()=>{
const divsWithCode = document.getElementsByClassName("divWithCode");
for (const divWithCode of divsWithCode) {
  const divWithLineNumbers = divWithCode.children[0];
  const preElement = divWithCode.children[1];
  const innerText = preElement.innerText;
  const numberOfLines = (innerText.match(/\n/g) || []).length + 1;
  let resultString = "";
  for (let i=0; i<numberOfLines; i++)
    resultString += (i+1)+".<br/>";
  divWithLineNumbers.innerHTML = resultString;
  preElement.onscroll = (event) => {
    event.target.parentNode.children[0].scroll(
    0, event.target.scrollTop);
  };
}
};
</script>
</head>
<body>
<h1>Hello, <?php echo $_SESSION['username']; ?>!</h1>
<a href="logout.php">Logout</a>
<?php
include 'db_helper.php';

$conn = Database::getInstance()->getConnection();

$stmt = $conn->prepare("SELECT COUNT(*) AS number_of_programs FROM programs");
$stmt->execute();

$number_of_programs = $stmt->get_result()->fetch_assoc()['number_of_programs'];

echo "<p>There are $number_of_programs programs in the database.</p>\n";

$stmt = $conn->prepare("SELECT id, code, created_at FROM programs");
$stmt->execute();
$stmt->bind_result($id, $code, $created_at);

while ($stmt->fetch()) {
echo "<section><h2>Program with the id <code>$id</code></h2>\n";
echo "<div class=\"divWithCode\"><div class=\"divWithLineNumbers\"></div><pre>" . htmlspecialchars($code) . "</pre></div>\n" . "Created at: <code>$created_at</code></section>\n";
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
</body>
</html>
