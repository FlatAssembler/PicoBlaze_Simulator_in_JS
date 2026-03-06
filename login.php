<?php
$message = "";
$color = "#eee";
	if (isset($_POST["password"])) {
		if (md5($_POST["password"]) == "68cb52b80a90723f4d45e768595e8733")
		{
			$message = "Login successful! Redirecting to <code>controlPannel.php</code>...";
			$color = "#afa";
			session_start();
			$_SESSION['username'] = "FlatAssembler";
			header("Location: controlPannel.php");
		}
		else {
			$message = "Incorrect password!";
			$color = "#faa";
		}
	}
?>

<!doctype html>
<html>
<head>
	<title>PicoBlaze assembler and emulator - login form</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
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
			grid-template-areas: "label label label"
					     "password password password"
					     "back . submit"
                                             "message message message";
			background-color: #ccc;
			padding: 10px;
			gap: 3px;
			border-radius: 5px;
		}
		form label {
			grid-area: label;
			display: block;
			text-align: justify;
		}
		form input {
			grid-area: password;
		}
		form button[type="submit"] {
			grid-area: submit;
			background-color: #030;
		}
		form button {
			grid-area: back;
			background-color: #120;
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
		<label for="password">Enter the password known by Teo Samar&zcaron;ija:</label>
		<input name="password" type="password">
		<button onclick="history.back()">Go back</button>
		<button type="submit">Log in</button>
		<div id="message" style="background-color: <?php echo $color; ?>"><?php echo $message; ?></div>
	</form>
</body>
</html>
