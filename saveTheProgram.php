<?php
	session_start();
	if (!isset($_SESSION['username']))
		die("The username is not set in the session! In case you are using Firefox 52 (the last version of Firefox runnable on Windows XP), saving the programs does not work in it, and it is not supposed to work there.");
	if (!isset($_POST['code']))
		die("The client has not sent the code to be saved!");

	include 'db_helper.php';
	$conn = Database::getInstance()->getConnection();

	$stmt = $conn->prepare("SELECT id FROM usernames WHERE username = ?");
	$stmt->bind_param('s', $_SESSION['username']);
	$stmt->execute();
	$id=$stmt->get_result()->fetch_assoc()['id'];

	$stmt = $conn->prepare("UPDATE codes_belonging_to_users SET code=? WHERE id=?");
	$stmt->bind_param('si',$_POST['code'],$id);
	$stmt->execute();

	die("SUCCESS");
?>
