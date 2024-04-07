<?php
class Database {
    private static $instance;
    private $connection;

    private function __construct() {
        $servername = getenv("DB_SERVER");
        $username = getenv("DB_USERNAME");
        $password = getenv("DB_PASSWORD");
        $dbname = getenv("DB_NAME");

        try {
            $this->connection = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $e) {
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
    
    error_log("Received code: " . $code);
    
    $stmt = $conn->prepare("INSERT INTO programs (code) VALUES (:code)");
    $stmt->bindParam(':code', $code);
    
    try {
        $stmt->execute();
        echo "Program saved successfully!";
    } catch (PDOException $e) {
        echo "Error: " . $e->getMessage();
    }
}
?>
