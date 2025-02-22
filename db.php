<?php

$GLOBALS['dbname'] = "p3379031_assembler_db";

class Database {

    private static $instance;
    private $connection;

    private function __construct() {
        $servername = "mysql-p";
        $username = "p3379031rw";
        $password = substr(file_get_contents(".env"), strlen("password="));
        if (substr($password, -1, 1) == "\n") {
            $password = substr($password, 0, strlen($password) - 1);
        }
        if (substr($password, -1, 1) == "\r") {
            $password = substr($password, 0, strlen($password) - 1);
        }
        $dbname = $GLOBALS['dbname'];

        try {
            $this->connection = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            die("Connection failed: " . $e->getMessage());
        }
    }

    public static function getInstance() {
        if (!isset(self::$instance)) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }
}

$conn = Database::getInstance()->getConnection();

if (isset($_POST['code'])) {
    $code = $_POST['code'];

    $stmt = $conn->prepare("INSERT INTO programs (code) VALUES (:code)");
    $stmt->bindParam(':code', $code);

    try {
        $stmt->execute();
        $lastInsertedId = $conn->lastInsertId();
        echo "?id=" . $lastInsertedId;
    } catch (PDOException $e) {
        echo "Error: " . $e->getMessage();
    }
}

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
        $dbname = $GLOBALS['dbname'];
        echo "Error 404:\nProgram with the ID \"$id\" not found\nin the database \"$dbname\"!";
    }
}
?>
