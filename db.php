<?php
header("Content-Type: text/X-asm");

include 'db_helper.php';

$conn = Database::getInstance()->getConnection();

// WARNING: The following piece of code is AI-generated, and I don't know enough PHP to tell whether it is correct.
if (isset($_POST['code'])) {
    $code = $_POST['code'];

    // 1. Check if the code already exists in the database
    $stmt = $conn->prepare("SELECT id FROM programs WHERE code = :code");
    $stmt->bindParam(':code', $code);
    $stmt->execute();

    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        // 2. If exists, return the existing id
        echo "?id=" . $result['id'];
    } else {
        // 3. If not, insert the new code and return its new id
        $stmt = $conn->prepare("INSERT INTO programs (code) VALUES (:code)");
        $stmt->bindParam(':code', $code);

        try {
            $stmt->execute();
            $lastInsertedId = $conn->lastInsertId();
            echo "?id=" . $lastInsertedId;
        } catch (PDOException $e) {
            http_response_code(500);
            echo "Error: " . $e->getMessage();
        }
    }
}
//End of the AI-generated code.

if (isset($_GET['id'])) {
    $id = $_GET['id'];

    if ($id == "") {
        echo "NO";
        return;
    }

    $stmt = $conn->prepare("SELECT code FROM programs WHERE id = :id");
    $stmt->bindParam(':id', $id);
    $stmt->execute();

    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($result) {
        $programCode = $result['code'];
        // mysql uses \r\n, the browser uses \n
        $programCode = str_replace("\r\n", "\n", $programCode);
        echo $programCode;
    } else {
	    http_response_code(404);
        $dbname = $GLOBALS['dbname'];
        echo "Error 404:\nProgram with the ID \"$id\" not found\nin the database \"$dbname\"!";
    }
}
?>
