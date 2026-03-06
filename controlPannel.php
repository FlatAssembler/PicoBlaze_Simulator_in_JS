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
pre {
  width: 100%;
  overflow-x: scroll;
  background-color: #aaa;
  color: #111;
}
<style>
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
echo "<pre>" . htmlspecialchars($code) . "</pre>\n" . "Created at: <code>$created_at</code></section>\n";
}
?>
</body>
</html>
