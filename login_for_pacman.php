<?php
 	include 'db_helper.php';
	$message = "";
	$messageColor = "white";
	
	if (isset($_POST['username'])) {
		$conn = Database::getInstance()->getConnection();
		$stmt = $conn->prepare("SELECT COUNT(*) AS counter FROM usernames WHERE username = ?");
		$stmt->bind_param('s', $_POST['username']);
		$stmt->execute();
		$counter = $stmt->get_result()->fetch_assoc()['counter'];
		if ($counter == 0) {
			$messageColor = "lightred";
			$message = "Username does not exist!";
		}
		else {
			$stmt = $conn->prepare("SELECT passwordHash FROM usernames WHERE username = ?");
			$stmt->bind_param('s', $_POST['username']);
			$stmt->execute();
			$passwordHash = $stmt->->get_result()->fetch_assoc()['passwordHash'];
			if ($passwordHash != md5($_POST['password'])) {
				$messageColor = "lightyellow";
				$message = "Wrong password!";
			}
			else
			{
				header("Location: pacman.php");
				$messageColor = "lightgreen";
				$message = "Redirecting you to PacMan...";
				start_session();
				$_SESSION['username'] = $_POST['username'];
			}
		}
	}
?>
<!doctype html>
<html>
<head>
<title>PicoBlaze Simulator - Login to play PacMan</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
body {
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #aaa;
	padding: 10px;
	height: calc(100vh - 20px);
	font-family: sans-serif;
}
form {
	display: grid;
	grid-template-areas:
		"label1 label1 ."
		"username username username"
		"label2 label2 ."
		"password password password"
		"backbutton . registerbutton"
		"message message message";
	background-color: #ccc;
	padding: 10px;
	gap: 3px;
	border-radius: 5px;
}
form label:nth-of-type(1) {
	grid-area: label1;
}
form label:nth-of-type(2) {
	grid-area: label2;
}
form input:nth-of-type(1) {
	grid-area: username;
}
form input:nth-of-type(2) {
	grid-area: password;
}
form button:nth-of-type(1) {
	grid-area: backbutton;
	background-color: #300;
}
form button:nth-of-type(2) {
	grid-area: registerbutton;
	background-color: #030;
}
form button {
	color: white;
	text-transform: uppercase;
}
#message {
	display: flex;
	grid-area: message;
	height: 3em;
	justify-content: center;
	align-items: center;
	padding: 5px;
	border-radius: 5px;
}
#notice {
	grid-area: notice;
	max-width: 500px;
	text-align: justify;
	font-size: small;
}
</style>
</head>
<body>
<form method="post">
<label for="username">Enter your username:</label>
<input name="username" id="username" value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username']) : ""; ?>"/>
<label for="password">Enter your password:</label>
<input type="password" name="password" id="password" />
<button onclick="history.back()">Go back</button>
<button type="submit">Log in</button>
<div id="message" style="background-color: <?php echo $messageColor; ?>"><?php echo htmlspecialchars($message); ?></div>
</form>
</body>
</html>
