<?php
if (array_key_exists("HTTP_USER_AGENT", $_SERVER)) {
    $browser = $_SERVER['HTTP_USER_AGENT'];
} else {
    $browser = "none";
}
if (substr($browser, 0, strlen("Opera")) !== "Opera" &&
        substr($browser, 0, strlen("Mozilla/5.0")) !== "Mozilla/5.0") {
    exit("Please access this URL with a proper browser! As far as I know, no browser in which you can actually play that PacMan has User Agent that does not start either with \"Opera\" or with \"Mozilla/5.0\". Your browser identified itself to this server as \"$browser\".\n");
}
$pacman_url = ((empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off') ? 'http://' : 'https://') . $_SERVER['SERVER_NAME'] . "/pacman.php";
if (!array_key_exists('HTTP_REFERER', $_SERVER) || $_SERVER['HTTP_REFERER'] != $pacman_url) {
    exit("Your browser did not set the HTTP referer header to the URL of the PacMan game, so we cannot save your highscore. Sorry about that! The expected HTTP referer header was \"$pacman_url\", whereas your browser sent \"" . (!array_key_exists('HTTP_REFERER', $_SERVER) ? "" : $_SERVER['HTTP_REFERER']) . "\".\n");
}
session_start();
include 'db_helper.php';
if (!array_key_exists('first_random_number', $_SESSION) || !array_key_exists('second_random_number', $_SESSION) || !array_key_exists('sumOfRandomNumbers', $_GET) || $_GET['sumOfRandomNumbers'] != $_SESSION['first_random_number'] + $_SESSION['second_random_number']) {
    session_destroy();
    exit("The session does not seem to be properly set! It can be both a server error or a misconfiguration of your browser. " .
            (
            (array_key_exists('first_random_number', $_SESSION) && array_key_exists('second_random_number', $_SESSION) && array_key_exists('sumOfRandomNumbers', $_GET)) ?
                    "The random numbers sent to JavaScript in \"<code>pacman.php</code>\" were"
                    . $_SESSION['first_random_number'] . " and "
                    . $_SESSION['second_random_number'] .
                    ", and your browser claims the sum of them is " . $_GET['sumOfRandomNumbers'] . ". " :
                    "") .
            "Unfortunately, we cannot set the new highscore!");
}
session_destroy();
?>
<html>
    <head>
        <title>Saving the highscore for PacMan in JavaScript</title>
    </head>
    <body>
        Attempting to save a highscore...<br>
        <?php
        $player = $_GET['player'];
        if (strpos($player, " ") !== FALSE || strpos($player, "<") !== FALSE || strpos($player, ">") !== FALSE || strpos($player, "&") !== FALSE || strlen($player) == 0)
            $player = "anonymous";
	$score = intval($_GET['score']);
	$conn = Database::getInstance()->getConnection();
	$stmt = $conn->prepare("SELECT id FROM usernames WHERE username = ?");
	$stmt->bind_param('s', $player);
	$stmt->execute();
	$id = $stmt->get_result()->fetch_assoc()['id'];
	$stmt = $conn->prepare("SELECT highscore FROM highscores_in_pacman WHERE user_id = ?");
	$stmt->bind_param('i', $id);
	$stmt->execute();
	$current_highscore = $stmt->get_result()->fetch_assoc()['highscore'];
        if ($score <= $current_highscore) {
            ?>Sorry about that, but higher highscore has already been submitted!<?php
        } else {
            $hash1 = $_GET['hash'];
            if (is_numeric($score) && $score < 100000) {
                $hash = 7;
                for ($i = 0; $i < $score / 127; $i++) {
                    $hash += $i;
                    $hash %= 907;
                }
                if ($hash - $hash1) {
                    ?>Invalid hash!<?php
                } else {
			$stmt = $conn->prepare("UPDATE highscores_in_pacman SET highscore = ? WHERE user_id = ?");
			$stmt->bind_param('ii', $score, $id);
			$stmt->execute();
                        ?>
                        Successfully saved the new highscore!
                        <script type="text/javascript">
                            window.close();
                        </script>
                        <?php
                    }
                }
            } else {
                ?>
                Server error!
                <?php
            }
        }
        ?>
    </body>
</html>
