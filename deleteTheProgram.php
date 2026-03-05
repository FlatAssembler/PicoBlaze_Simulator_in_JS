<?php

include 'db_helper.php';

if (isset($_POST["password"])) {
    if (md5($_POST["password"]) !== "68cb52b80a90723f4d45e768595e8733") {
        http_response_code(403);
        die("Wrong password!");
    }
} else {
    http_response_code(400);
    die("You did not enter your password!");
}

if (isset($_POST["id"])) {
    $conn = Database::getInstance()->getConnection();

    $conn->query(<<<SQL
        CREATE TABLE IF NOT EXISTS deleted_programs(
            id int auto_increment primary key,
            previous_id int unique
        );
    SQL);

    $stmt = $conn->prepare("INSERT INTO deleted_programs(previous_id) VALUES (?)");
    $stmt->bind_param('s', $_POST["id"]);
    $stmt->execute();

    $stmt = $conn->prepare("DELETE FROM programs WHERE id = ?");
    $stmt->bind_param('s', $_POST["id"]);
    $stmt->execute();

    $stmt = $conn->prepare("SELECT previous_id FROM deleted_programs");
    $stmt->execute();
    $stmt->bind_result($deleted_program_id);
    echo "The programs marked as deleted are: ";
    while ($stmt->fetch())
	    echo $deleted_program_id . " ";
} else {
    http_response_code(400);
    die("You did not specify the id of the program which should be deleted!");
}
