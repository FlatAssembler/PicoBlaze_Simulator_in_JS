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
    $stmt = $conn->prepare("DELETE FROM programs WHERE id = :id");
    $stmt->bindParam(':id', $_POST["id"]);
    $stmt->execute();

    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo $result;
} else {
    http_response_code(400);
    die("You did not specify the id of the program which should be deleted!");
}
