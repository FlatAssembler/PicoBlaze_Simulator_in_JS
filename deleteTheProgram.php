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
            http_response_code(500);
            die("Connection to the database failed: " . $e->getMessage());
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