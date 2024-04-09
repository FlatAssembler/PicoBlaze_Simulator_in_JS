<?php

ini_set('display_errors', 1);

require_once 'db.php';

// view a program

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

        $htmlContent = file_get_contents("PicoBlaze.html");

        $renderedHtml = str_replace("{{PROGRAM_CODE}}", $programCode, $htmlContent);

        echo $renderedHtml;
    } else {
        echo "Program not found!";
    }
} else {
    header("Location: PicoBlaze.html");
    exit;
}
?>
Click <a href="PicoBlaze.html">here</a> in case your browser does not automatically redirect you.
