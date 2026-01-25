<?php
header("Content-Type: text/X-asm");

include 'db_helper.php';

$conn = Database::getInstance()->getConnection();

// The following code is AI-generated, and I do not know enough PHP to tell if it is right...

// Enable MySQLi exceptions so we can catch mysqli_sql_exception on errors
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

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

    if ($result && $result->num_rows > 0) {
        // 2. If exists, return the existing id
        $row = $result->fetch_assoc();
        echo "?id=" . $row['id'];
    } else {
        // 3. If not, insert the new code and return its new id
        $stmt = $conn->prepare("INSERT INTO programs (code) VALUES (?)");
        $stmt->bind_param('s', $code);

        try {
            $stmt->execute();
            $lastInsertedId = $conn->insert_id;
            echo "?id=" . $lastInsertedId;
        } catch (mysqli_sql_exception $e) {
            http_response_code(500);
            echo "Error: " . $e->getMessage();
        }
    }
}
//End of the AI-generated code.

if (isset($_GET['id'])) {
    $id = $_GET['id'];

    if ($id === "" || !is_numeric($id)) {
	    http_response_code(400);
	    die("Error 400: The requested ID of the program does not seem to be a number!");
            return;
    }

    // Cast to int and bind as integer for safety
    $id = (int) $id;
    $stmt = $conn->prepare("SELECT code FROM programs WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();

    $result = $stmt->get_result();
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $programCode = $row['code'];
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
