<?php

require_once 'db_helper.php';

$conn = Database::getInstance()->getConnection();

echo "Uspješno povezivanje s bazom: " . $GLOBALS['dbname'];