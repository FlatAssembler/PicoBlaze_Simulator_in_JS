<?php
class Database {
    private static $instance;
    private $connection;

    private function __construct() {
        $servername = getenv("DB_SERVER");
        $username = getenv("DB_USERNAME");
        $password = getenv("DB_PASSWORD");
        $dbname = getenv("DB_NAME");

        $this->connection = new mysqli($servername, $username, $password, $dbname);

        if ($this->connection->connect_error) {
            die("Connection failed: " . $this->connection->connect_error);
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

if (isset($_POST)) {
    var_dump($_POST);
}

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['code'])) {
    $code = $_POST['code'];
    
    var_dump($code);

    $stmt = $conn->prepare("INSERT INTO programs (code) VALUES (?)");
    $stmt->bind_param("s", $code);
    
    if ($stmt->execute()) {
        echo "Program saved successfully!";
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
}

if ($_SERVER["REQUEST_METHOD"] == "GET" && isset($_GET['id'])) {
    $id = $_GET['id'];
    
    $stmt = $conn->prepare("SELECT code FROM programs WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        echo $row['code'];
    } else {
        echo "Program not found!";
    }
    $stmt->close();
}
?>