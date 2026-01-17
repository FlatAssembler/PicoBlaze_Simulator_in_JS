<?php
header("Content-Type: text/X-asm");

include 'db_helper.php';

$conn = Database::getInstance()->getConnection();

// WARNING: The following piece of code is AI-generated, and I don't know enough PHP to tell whether it is correct.
if (isset($_POST['code'])) {
    $code = $_POST['code'];
    
    $conn->query(<<<SQL
        CREATE TABLE IF NOT EXISTS programs (
            /* use UUID instead of INT AUTO_INCREMENT ? */
            id INT AUTO_INCREMENT PRIMARY KEY,
            code TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    SQL);

    // 1. Check if the code already exists in the database
    $stmt = $conn->prepare("SELECT id FROM programs WHERE code = ?");
    $stmt->bind_param('s', $code);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($result) {
        // 2. If exists, return the existing id
        echo "?id=" . $result['id'];
    } else {
        // 3. If not, insert the new code and return its new id
        $stmt = $conn->prepare("INSERT INTO programs (code) VALUES (?)");
        $stmt->bind_param('s', $code);

        try {
            $stmt->execute();
            $lastInsertedId = mysqli_insert_id($conn);
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

    $stmt = $conn->prepare("SELECT code FROM programs WHERE id = ?");
    $stmt->bind_param('s', $id);
    $stmt->execute();

    $result = $stmt->get_result();
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
