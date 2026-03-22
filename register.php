<?php
	function consists_only_of_digits($string) {
		for ($i=0; $i<strlen($string); $i++)
			if (!IntlChar::isdigit(substr($string, $i, 1)))
				return false;
		return true;
	}
	include 'db_helper.php';
	$message = "";
	$messageColor = "white";
	
	if (isset($_POST['username'])) {
		$conn = Database::getInstance()->getConnection();

		$stmt = $conn->prepare("SELECT COUNT(*) AS counter FROM usernames WHERE username = ?");
		$stmt->bind_param('s', $_POST['username']);
		$stmt->execute();
		$counter = $stmt->get_result()->fetch_assoc()['counter'];
		if ($counter > 0)
		{
			$message="The username is already taken!";
			$messageColor="#faa";
		}
		else {
			if (consists_only_of_digits($_POST['password'])) {
				$message = "The password must not consist solely of digits!";
				$messageColor="#fda";
			}
			else if (strlen($_POST['password']) < 8) {
				$message = "The password must be at least 8 characters long!";
				$messageColor="#ffa";
			}
			else if ($_POST['password'] != $_POST['repeatedPassword'])
			{
				$message = "The entered passwords do not match!";
				$messageColor="#faa";
			}
			else if (htmlspecialchars($_POST['username'])!=$_POST['username'])
			{
				$message = "Your username contains special HTML characters!";
				$messageColor="#faa";
			}
			else {
				$message = "Registration successful!";
				$messageColor="#afa";
				
				$stmt = $conn->prepare("INSERT INTO usernames(username,passwordHash) VALUES(?, ?)");
				$stmt->bind_param('ss',$_POST['username'],md5($_POST['password'])); // Ideally, we should add some salt here to the hash, but this is not a seriuous project anyway.
				$stmt->execute();
			}
		}
	}
?>
<!doctype html>
<html>
<head>
<title>PicoBlaze Simulator - Register a new user</title>
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
		"label3 label3 ."
		"repeated repeated repeated"
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
form label:nth-of-type(3) {
	grid-area: label3;
}
form input:nth-of-type(1) {
	grid-area: username;
}
form input:nth-of-type(2) {
	grid-area: password;
}
form input:nth-of-type(3) {
	grid-area: repeated;
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
</style>
</head>
<body>
<form method="post">
<label for="username">Enter your username:</label>
<input name="username" id="username" value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username']) : ""; ?>"/>
<label for="password">Enter your password:</label>
<input type="password" name="password" id="password" />
<label for="repeatedPassword">Repeat your password:</label>
<input type="password" name="repeatedPassword" id="repeatedPassword" />
<button onclick="history.back()">Go back</button>
<button type="submit">Register</button>
<div id="message" style="background-color: <?php echo $messageColor; ?>"><?php echo htmlspecialchars($message); ?></div>
</form>
</body>
</html>
