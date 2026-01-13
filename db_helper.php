<?php

$GLOBALS['dbname'] = "ruap-lv3-database";

class Database {

    private static $instance;
    private $connection;

    private function __construct() {
        $servername = "ruap-lv3-server.mysql.database.azure.com";
        $username = "ayhfdamgrt";
        $port = 3306;
        $password = substr(file_get_contents(".env"), strlen("password="));
        if (substr($password, -1, 1) == "\n") {
            $password = substr($password, 0, strlen($password) - 1);
        }
        if (substr($password, -1, 1) == "\r") {
            $password = substr($password, 0, strlen($password) - 1);
        }
        $dbname = $GLOBALS['dbname'];

        try {
            $this->connection = new PDO("mysql:host=$servername:$port;dbname=$dbname", $username, $password);
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

?>
