<?php

session_start();
include 'db_helper.php';

/*
 * Ako je korisnik već prijavljen,
 * nema potrebe ponovno prikazivati login.
 */
if (isset($_SESSION['username'])) {
    header('Location: index.php');
    exit();
}

$message = '';
$messageColor = '#eee';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $message = 'Please enter both username and password!';
        $messageColor = '#faa';
    } else {
        $conn = Database::getInstance()->getConnection();

        $stmt = $conn->prepare(
            'SELECT id, username, passwordHash
             FROM usernames
             WHERE username = ?
             LIMIT 1'
        );

        if (!$stmt) {
            die('Database query preparation failed: ' . $conn->error);
        }

        $stmt->bind_param('s', $username);
        $stmt->execute();

        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if (!$user) {
            $message = 'The username does not exist!';
            $messageColor = '#faa';
        } else {
            $enteredPasswordHash = md5($password);

            if ($enteredPasswordHash === $user['passwordHash']) {

                /*
                 * Zaštita od session fixation napada.
                 */
                session_regenerate_id(true);

                $_SESSION['user_id'] = (int) $user['id'];
                $_SESSION['username'] = $user['username'];

                $stmt->close();

                header('Location: index.php');
                exit();
            }

            $message = 'Wrong password!';
            $messageColor = '#faa';
        }

        $stmt->close();
    }
}
?>

<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <title>PicoBlaze Simulator - Login</title>

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <style>
        body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 20px);
            margin: 0;
            padding: 10px;
            background-color: #aaa;
            font-family: sans-serif;
        }

        form {
            display: grid;
            grid-template-areas:
                "username-label username-label"
                "username username"
                "password-label password-label"
                "password password"
                "back submit"
                "message message";
            width: 100%;
            max-width: 420px;
            padding: 15px;
            gap: 6px;
            border-radius: 5px;
            background-color: #ccc;
            box-sizing: border-box;
        }

        label[for="username"] {
            grid-area: username-label;
        }

        #username {
            grid-area: username;
        }

        label[for="password"] {
            grid-area: password-label;
        }

        #password {
            grid-area: password;
        }

        input {
            padding: 8px;
        }

        .back-button {
            grid-area: back;
            padding: 8px;
            border: 0;
            background-color: #300;
            color: white;
            text-transform: uppercase;
            cursor: pointer;
        }

        button[type="submit"] {
            grid-area: submit;
            padding: 8px;
            border: 0;
            background-color: #030;
            color: white;
            text-transform: uppercase;
            cursor: pointer;
        }

        #message {
            display: flex;
            grid-area: message;
            min-height: 3em;
            align-items: center;
            justify-content: center;
            padding: 5px;
            border-radius: 5px;
            text-align: center;
        }
    </style>
</head>

<body>

<form method="post" action="login.php">

    <label for="username">Username:</label>

    <input
        type="text"
        name="username"
        id="username"
        value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>"
        autocomplete="username"
        required
    >

    <label for="password">Password:</label>

    <input
        type="password"
        name="password"
        id="password"
        autocomplete="current-password"
        required
    >

    <button
        type="button"
        class="back-button"
        onclick="window.location.href='index.php'"
    >
        Go back
    </button>

    <button type="submit">
        Log in
    </button>

    <div
        id="message"
        style="background-color: <?php echo $messageColor; ?>"
    >
        <?php echo htmlspecialchars($message); ?>
    </div>

</form>

</body>
</html>