<?php

$GLOBALS['dbname'] = "picoblaze-simulator-database";

class Database {

    private static $instance;
    private $connection;

    private function __construct() {
        $servername = "picoblaze-simulator-server";
        $username = "rmxsyjvmfv";
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
$this->$connection = mysqli_init();
mysqli_ssl_set($con,NULL,NULL, "/etc/ssl/certs/ca-certificates.crt", NULL, NULL);
mysqli_real_connect($conn, "picoblaze-simulator-server.mysql.database.azure.com", "rmxsyjvmfv", $password, $dbname, 3306, MYSQLI_CLIENT_SSL);
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
