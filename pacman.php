<?php
if (array_key_exists("HTTP_USER_AGENT", $_SERVER)) {
    $browser = $_SERVER['HTTP_USER_AGENT'];
} else {
    $browser = "none";
}
if (substr($browser, 0, strlen("Opera")) !== "Opera" && substr($browser, 0, strlen("Mozilla/5.0")) !== "Mozilla/5.0") {
    exit("Please access this URL with a proper browser! As far as I know, no browser in which you can actually play that PacMan has User Agent that does not start either with \"<code>Opera</code>\" or with \"<code>Mozilla/5.0</code>\". The user agent of your browser appears to be <code>$browser</code>.\n");
}
session_start();
if (!isset($_SESSION['username']))
{
	header("Location: login_for_pacman.php");
	echo "You appear not to be logged in. Please log in <a href=\"login_for_pacman.php\">here</a>.";
	exit;
}
include 'db_helper.php';
$_SESSION['first_random_number'] = rand(0, 50);
$_SESSION['second_random_number'] = rand(0, 50);
$conn = Database::getInstance()->getConnection();
$conn->query(<<<SQL
	CREATE TABLE IF NOT EXISTS highscores_in_pacman(
           user_id INTEGER PRIMARY KEY,
           highscore INTEGER
        );
SQL);

	$stmt = $conn->prepare("SELECT id FROM usernames WHERE username = ?");
	$stmt->bind_param('s', $_SESSION['username']);
	$stmt->execute();
	$id=$stmt->get_result()->fetch_assoc()['id'];

	$stmt = $conn->prepare("SELECT COUNT(highscore) AS counter FROM highscores_in_pacman WHERE user_id = ?");
	$stmt->bind_param('i', $id);
	$stmt->execute();
	$counter=$stmt->get_result()->fetch_assoc()['counter'];

	if ($counter == 0) {
	   $stmt = $conn->prepare("INSERT INTO highscores_in_pacman(user_id, highscore) VALUES (?, 0)");
	   $stmt->bind_param('i', $id);
	   $stmt->execute();
	}
?>
<!--
Koristeni programski jezici i preporuceni materijali za ucenje:
JavaScript - https://www.w3schools.com/js/default.asp
SVG - https://www.w3schools.com/graphics/svg_intro.asp
PHP (vrti se na serveru) - https://www.w3schools.com/php/default.asp
HTML - https://www.w3schools.com/html/default.asp
CSS - https://www.w3schools.com/css/default.asp
-->
<html lang="en">
    <head>
        <title>PacMan in JavaScript</title>
        <meta name="author" content="Teo Samarzija">
        <meta name="description"
              content="A PacMan game made using SVG and JavaScript, playable on most smartphones.">
        <meta name="keywords"
              content="Retrocomputing, HTML5, PacMan, SVG, JavaScript">
        <meta name="viewport"
              content="width=device-width, initial-scale=1.0, user-scalable=0">
        <!-- Sprijeci zoomiranje na smartphonima (ako netko slucajno dodirne neko mjesto u labirintu dvaput umjesto jedanput). -->
        <style type="text/css">
            #natpis { /*CSS od natpisa za novi level.*/
                position: absolute;
                background-color: #AAFFFF;
                color: red;
                top: 180px;
                width: 200px;
                height: 50px;
                border-radius: 100%; /*Neka bude u obliku elipse.*/
                text-align: center;
                font-family: Arial;
                font-size: 24px;
                line-height: 50px;
            }

            #startButton {
                background-color: red;
                top: 275px;
                color: yellow;
                font-size: 36px;
                width: 200px;
                position: absolute;
                left: -webkit-calc(50% - ( 200px / 2));
                /*Za Android Stock Browser 4 i Safari 6, oni nece parsirati "calc" ako ne stavimo prefiks.*/
                left: calc(50% - ( 200px / 2));
            }

            #zaslon {
                background: black;
                display: block;
                width: 300px;
                height: 450px;
                border: 0px;
                margin-bottom: 0px;
                overflow: hidden;
                /*Inace ce u Internet Exploreru 11 duhovi doci na bijelu pozadinu
                 kad prolaze kroz onaj prolaz sa strane.*/
            }

            #bodovi { /*Zuti pravokutnik na kojem pise highscore.*/
                position: absolute;
                top: 458px;
                width: 300px;
                line-height: 50px;
                font-family: Lucida;
                background-color: yellow;
                text-align: center;
                margin-bottom: 5px;
                margin-top: 0px;
                left: -webkit-calc(50% - ( 300px / 2));
                left: calc(50% - ( 300px / 2));
            }

            #instructions {
                position: absolute;
                top: -webkit-calc(458px + 50px + 50px + 5px);
                top: calc(458px + 50px + 50px + 5px);
                width: -webkit-calc(100% - 2 * 16px);
                width: calc(100% - 2 * 16px);
                left: 16px;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <?php
	$stmt=$conn->prepare("SELECT highscore AS local_highscore FROM highscores_in_pacman WHERE user_id=?");
	$stmt->bind_param('i', $id);
	$stmt->execute();
	$local_highscore = $stmt->get_result()->fetch_assoc()['local_highscore'];
	$stmt=$conn->prepare("SELECT MAX(highscore) AS global_highscore FROM highscores_in_pacman");
	$stmt->execute();
	$global_highscore = $stmt->get_result()->fetch_assoc()['global_highscore'];
	$stmt=$conn->prepare("SELECT username FROM usernames, highscores_in_pacman WHERE usernames.id=highscores_in_pacman.user_id AND highscores_in_pacman.highscore = ?");
	$stmt->bind_param('i',$global_highscore);
	$stmt->execute();
	$global_highscore_user = $stmt->get_result()->fetch_assoc()['username'];
        ?>
        <button id="startButton" onclick="onStartButton()">START!</button>
    <center>
        <svg id="zaslon">
        <defs>
        <linearGradient id="leftGradient" x1="0%" x2="100%" y1="0%"
                        y2="0%">
        <!-- Boja lijeve tipke. -->
        <stop offset="0%" stop-color="gray" />
        <stop offset="100%" stop-color="white" />
        </linearGradient>
        <linearGradient id="rightGradient" x1="0%" x2="100%" y1="0%"
                        y2="0%">
        <!-- Boja desne tipke. -->
        <stop offset="0%" stop-color="white" />
        <stop offset="100%" stop-color="gray" />
        </linearGradient>
        <linearGradient id="upGradient" x1="0%" x2="0%" y1="0%"
                        y2="100%">
        <!-- Boja gornje tipke. -->
        <stop offset="0%" stop-color="gray" />
        <stop offset="100%" stop-color="white" />
        </linearGradient>
        <linearGradient id="downGradient" x1="0%" x2="0%" y1="0%"
                        y2="100%">
        <!-- Boja donje tipke. -->
        <stop offset="0%" stop-color="white" />
        <stop offset="100%" stop-color="gray" />
        </linearGradient>
        </defs>
        <rect x=130 y=360 fill="url(#upGradient)"
              onMouseOver="this.style.fill = 'lightGray'"
              onMouseOut="this.style.fill = 'url(#upGradient)'" width=40 height=40
              onClick="onButtonUp()"></rect>
        <!-- Gornja tipka -->
        <rect x=85 y=405 fill="url(#leftGradient)"
              onMouseOver="this.style.fill = 'lightGray'"
              onMouseOut="this.style.fill = 'url(#leftGradient)'" width=40
              height=40 onClick="onButtonLeft()"></rect>
        <!-- Lijeva tipka -->
        <rect x=130 y=405 fill="url(#downGradient)"
              onMouseOver="this.style.fill = 'lightGray'"
              onMouseOut="this.style.fill = 'url(#downGradient)'" width=40
              height=40 onClick="onButtonDown()"></rect>
        <!-- Donja tipka -->
        <rect x=175 y=405 fill="url(#rightGradient)"
              onMouseOver="this.style.fill = 'lightGray'"
              onMouseOut="this.style.fill = 'url(#rightGradient)'" width=40
              height=40 onClick="onButtonRight()"></rect>
        <!-- Desna tipka -->
        <text x=175 y=385 fill="white"
              style="font-size: 18px; font-family:'Lucida Console'" id="score">Score: 0</text>
        </svg>
        <br>
	<div id="bodovi">
            Local highscore: <i><?php echo $local_highscore; ?></i> by <i><?php echo $_SESSION['username']; ?></i><br/>
            Global highscore: <i><?php echo $global_highscore; ?></i> by <i><?php echo $global_highscore_user; ?></i>
        </div>
        <div id="instructions">
            The game responds to keyboard arrow keys, mouse clicks and touch. On smartphones, the
            Pacman is supposed to follow your finger, to go in the direction
            where you last tapped. In case that doesn't work, you have buttons
            below the maze. On computers, it's playable by mouse or the arrow keys.<br />You can
            see the source code, with the comments in Croatian, <a
                href="https://gitlab.com/FlatAssembler/picoblaze_simulator_in_js/-/blob/master/pacman.php?ref_type=heads">here</a>.<br/>
                <?php if (strpos($browser, "Firefox") !== FALSE): ?>
                <b>UPDATE</b> on 24/03/2021: I have added eyes on the ghosts.<br/>
            <?php else: ?>
                <b>UPDATE</b> on 24/03/2021: I have added eyes on the ghosts<del>,
                    but that works only in Firefox</del>.<br />
                <b>UPDATE</b> on 27/03/2021: The eyes of the ghosts no longer rely
                on the Firefox-specific SVG features.<br/>
            <?php endif; ?>
            <b>UPDATE</b> on 27/08/2021: The server that SourceForge lets me use for free seems to
            automatically insert (actually malformed by the HTTP standard) cookies into your browser
            instead of using HTTP sessions when asked to use HTTP sessions (for highscores). I have tried
            to solve that, but failed. If you are worried about being tracked using cookies, consult the
            manual of your browser on how to delete those cookies. Or, better yet, use a browser that
            automatically deletes cookies when they are no longer needed, such as the
            <a href="https://torproject.org">TOR Browser</a> (which protects from far more than just cookies).
	    Remember, it is much better to protect yourself using technology than to rely on laws.<br/><br/>
After you've finished playing this game, <a href="index.php">let's get back to the serious work of assembly language programming</a>.
            <?php if ($highscore_cannot_be_opened): ?>
                <br/>
                <b>Server error</b>: We were not able to create the highscore file, so highscores will probably not work!
                <?php
            endif;
            if ($highscore_file_corrupt):
                ?><br/>
                <b>Server error</b>: The file with highscores, <code>pachigh.txt</code>, seems to be corrupt!
            <?php endif;
            ?>
            <noscript>
            <br />Of course, nothing of this can work without JavaScript enabled
            in your browser.
            </noscript>
        </div>
    </center>
    <script type="text/javascript">
        if (
                document.getElementById("startButton").offsetLeft <=
                document.getElementById("zaslon").offsetLeft
                ) {
            //Safari 5, recimo, ne podrzava CSS-ovu naredbu "calc", ali podrzava dovoljno JavaScripta i SVG-a da pokrene ovaj PacMan. Zato cemo tamo CSS-ov "calc" simulirati u JavaScriptu.
            window.onresize = function () {
                var sredinaEkrana = document.body.clientWidth / 2;
                var startButton = document.getElementById("startButton");
                if (startButton)
                    startButton.style.left = sredinaEkrana - 100 + "px";
                var bodovi = document.getElementById("bodovi");
                bodovi.style.left = sredinaEkrana - 150 + "px";
                var instructions = document.getElementById("instructions");
                instructions.style.top = 458 + 50 + 50 + 5 + "px";
                instructions.style.width = sredinaEkrana * 2 - 2 * 16 + "px";
            };
            window.onresize();
        }
        /*      window.setTimeout(function () {
         document.body.removeChild(
         document.body.children[document.body.children.length - 1]
         );
         }, 1000); //Ukloni "Powered by 000webhost", da ne smeta na smartphonima.
         */
        var isGameFinished = false;
        var first_random_number = <?php
            $random_number = rand(50, 100);
            echo $random_number . " - " . ($random_number - $_SESSION['first_random_number']);
            ?>;
        var second_random_number = <?php
            $random_number = rand(50, 100);
            echo $random_number . " - " . ($random_number - $_SESSION['second_random_number']);
            ?>;
        var sessionID = <?php echo "\"" . htmlspecialchars(SID) . "\""; ?>;
        var highscore = <?php echo "\"" . $local_highscore . "\";"; ?> //Ove podatke u JavaScript kod umece PHP program koji se vrti na serveru.
        var kolikoJePacmanuPreostaloZivota = 3,
                time1 = 0,
                time2 = 0,
                score = 0,
                kadaJePacmanPojeoVelikuTocku = -100; /*"Plavi" duhovi se mogu "pojesti". Duhovi prestanu biti plavi nakon sto prode odredeno vrijeme (koje se broji varijablom 'brojacGlavnePetlje').*/
        var howManyDotsAreThere = 0; /*Broj tocaka u svakom nivou, PacMan ih mora pojesti sve da prijede na iduci nivo.*/
        var howManyDotsHasPacmanEaten = 0;
        var level = 0;
        var XML_namespace_of_SVG = document.getElementById("zaslon").namespaceURI; //Ovo je potrebno jer SVG ne koristi HTML DOM, nego XML DOM s drugim namespaceom.
        var brojacGlavnePetlje = 0,
                brojacAnimacijskePetlje = 0,
                kolikoJePutaDuhPromijenioSmjer = 0;
        var hasPacmanChangedDirection = false; //Je li za vrijeme izvrsavanja animacijske petlje promijenjen smjer kretanja PacMan-a.
        var pocetnoStanjeLabirinta = [
            /*
             W - zid
             B - velika tockica (koja, kada ju PacMan pojede, ucini da duhovi poplave).
             P - mala tockica (donosi bodove, te, ako ih PacMan sve pojede, prelazi na iduci level).
             C - PacMan (gdje se nalazi na pocetku nivoa)
             1 - crveni duh
             2 - ruzicasti duh
             3 - narancasti duh
             */
            "               ",
            " WWWWWWWWWWWWW ",
            " WBPPPPWPPPPBW ",
            " WPWWWPWPWWWPW ",
            " WPW WPWPW WPW ",
            " WPWWWPWPWWWPW ",
            " WPPPPP PPPPPW ",
            "WWWWPWW WWPWWWW",
            "    PW123WP    ",
            "WWWWPWWWWWPWWWW",
            "   WPP C PPW   ",
            " WWWPWWWWWPWWW ",
            " WPPPPPPPPPPPW ",
            " WPWWWWPWWWWPW ",
            " WPW  WPW  WPW ",
            " WPWWWWPWWWWPW ",
            " WPPPPPBPPPPPW ",
            " WWWWWWWWWWWWW ",
            "               "
        ];
        var smjer = {
            //Ovako se u JavaScriptu radi ono sto se u C-u radi naredbom "enum".
            gore: 0,
            desno: 1,
            dolje: 2,
            lijevo: 3,
            stop: 4
        };
        var xKomponentaSmjeraPacmana = [0, 1, 0, -1, 0];
        var yKomponentaSmjeraPacmana = [-1, 0, 1, 0, 0];
        var duhovi = {
            crveni: 0,
            ruzicasti: 1,
            narancasti: 2
        };
        var smjerDuha = [smjer.desno, smjer.gore, smjer.lijevo],
                smjerPacmana = smjer.desno;
        var pocetnaXKoordinataPacmana,
                pocetnaYKoordinataPacmana,
                pocetnaXKoordinataDuha = new Array(3),
                pocetnaYKoordinataDuha = new Array(3);
        var xKoordinataPacmana = 0;
        var yKoordinataPacmana = 0;
        var xKoordinataDuha = new Array(3);
        var yKoordinataDuha = new Array(3);
        var jeLiPacmanPojeoDuha = [false, false, false];
        var bojaDuha = ["red", "pink", "orange"];
        var smjerKretanjaSiluete = [smjer.stop, smjer.stop, smjer.stop];
        var xKoordinataSiluete = new Array(3);
        var yKoordinataSiluete = new Array(3);
        var xKoordinataCiljaSiluete = 7;
        var yKoordinataCiljaSiluete = 6;
        var zaslon = document.getElementById("zaslon"); //AST od SVG-a (njegovom manipulacijom odredujemo sto ce se crtati na zaslonu).
        function onButtonDown() {
            hasPacmanChangedDirection = true;
            if (
                    pocetnoStanjeLabirinta[yKoordinataPacmana + 1].charAt(xKoordinataPacmana) !=
                    "W"
                    )
                smjerPacmana = smjer.dolje;
        }
        function onButtonUp() {
            hasPacmanChangedDirection = true;
            if (
                    pocetnoStanjeLabirinta[yKoordinataPacmana - 1].charAt(xKoordinataPacmana) !=
                    "W"
                    )
                smjerPacmana = smjer.gore;
        }
        function onButtonLeft() {
            hasPacmanChangedDirection = true;
            if (
                    pocetnoStanjeLabirinta[yKoordinataPacmana].charAt(xKoordinataPacmana - 1) !=
                    "W"
                    )
                smjerPacmana = smjer.lijevo;
        }
        function onButtonRight() {
            hasPacmanChangedDirection = true;
            if (
                    pocetnoStanjeLabirinta[yKoordinataPacmana].charAt(xKoordinataPacmana + 1) !=
                    "W"
                    )
                smjerPacmana = smjer.desno;
        }
        function drawLine(x1, x2, y1, y2) {
            //Za crtanje labirinta, 'W' iz 'pocetnoStanjeLabirinta'.
            var crta = document.createElementNS(XML_namespace_of_SVG, "line");
            crta.setAttribute("x1", x1);
            crta.setAttribute("x2", x2);
            crta.setAttribute("y1", y1);
            crta.setAttribute("y2", y2);
            crta.setAttribute("stroke-width", 3);
            crta.setAttribute("stroke", "lightBlue");
            zaslon.appendChild(crta);
        }
        function drawSmallCircle(x, y, id) {
            //Mala tockica, 'P' iz 'pocetnoStanjeLabirinta'.
            var krug = document.createElementNS(XML_namespace_of_SVG, "circle");
            krug.setAttribute("cx", x);
            krug.setAttribute("cy", y);
            krug.setAttribute("r", 3);
            krug.setAttribute("fill", "lightYellow");
            krug.setAttribute("id", id);
            zaslon.appendChild(krug);
        }
        function drawBigCircle(x, y, id) {
            //Velika tocka, 'B' iz 'pocetnoStanjeLabirinta'
            var krug = document.createElementNS(XML_namespace_of_SVG, "circle");
            krug.setAttribute("cx", x);
            krug.setAttribute("cy", y);
            krug.setAttribute("r", 5);
            krug.setAttribute("fill", "lightGreen");
            krug.setAttribute("id", id);
            zaslon.appendChild(krug);
        }
        function drawGhost(x, y, color, id, transparent, smjer_zjenice_oka) {
            //Duhovi su geometrijski likovi omedeni crtama (dno) i kubicnom Bezierovom krivuljom (vrh).
            var svg = document.createElementNS(XML_namespace_of_SVG, "g");
            svg.setAttribute("x", x - 8);
            svg.setAttribute("y", y - 16);
            var path = document.createElementNS(XML_namespace_of_SVG, "path");
            path.setAttribute("fill", color);
            var d = "M " + (x - 8) + " " + (y + 8);
            d +=
                    "C " +
                    (x - 5) +
                    " " +
                    (y - 16) +
                    " " +
                    (x + 5) +
                    " " +
                    (y - 16) +
                    " " +
                    (x + 8) +
                    " " +
                    (y + 8);
            d += " l -4 -3 l -4 3 l -4 -3 Z";
            path.setAttribute("d", d);
            svg.setAttribute("id", id);
            if (transparent)
                svg.setAttribute("fill-opacity", 0.5); //Siluete (bijeli duhovi).
            svg.appendChild(path);
            var left_eye = document.createElementNS(
                    XML_namespace_of_SVG,
                    "circle"
                    );
            left_eye.setAttribute("cx", x - 8 + 5);
            left_eye.setAttribute("cy", y - 16 + 15);
            left_eye.setAttribute("r", 2);
            left_eye.setAttribute("fill", "black");
            svg.appendChild(left_eye);
            var right_eye = document.createElementNS(
                    XML_namespace_of_SVG,
                    "circle"
                    );
            right_eye.setAttribute("cx", x - 8 + 11);
            right_eye.setAttribute("cy", y - 16 + 15);
            right_eye.setAttribute("r", 2);
            right_eye.setAttribute("fill", "black");
            svg.appendChild(right_eye);
            var left_pupil = document.createElementNS(
                    XML_namespace_of_SVG,
                    "circle"
                    );
            left_pupil.setAttribute("cx", x - 8 + 5 + xKomponentaSmjeraPacmana[smjer_zjenice_oka]);
            left_pupil.setAttribute("cy", y - 16 + 15 + yKomponentaSmjeraPacmana[smjer_zjenice_oka]);
            left_pupil.setAttribute("r", 1);
            left_pupil.setAttribute("fill", "gray");
            svg.appendChild(left_pupil);
            var right_pupil = document.createElementNS(
                    XML_namespace_of_SVG,
                    "circle"
                    );
            right_pupil.setAttribute("cx", x - 8 + 11 + xKomponentaSmjeraPacmana[smjer_zjenice_oka]);
            right_pupil.setAttribute("cy", y - 16 + 15 + yKomponentaSmjeraPacmana[smjer_zjenice_oka]);
            right_pupil.setAttribute("r", 1);
            right_pupil.setAttribute("fill", "gray");
            svg.appendChild(right_pupil);
            zaslon.appendChild(svg);
        }
        function drawGhosts() {
            for (var i = 0; i < 3; i++) {
                if (
                        jeLiPacmanPojeoDuha[i] &&
                        brojacGlavnePetlje - kadaJePacmanPojeoVelikuTocku < 30
                        ) {
                    drawGhost(
                            xKoordinataSiluete[i] * 20 + 10,
                            yKoordinataSiluete[i] * 20 + 10,
                            "white",
                            "bijeli" + (i + 1),
                            true,
                            smjerKretanjaSiluete[i]
                            );
                    document
                            .getElementById("bijeli" + (i + 1))
                            .setAttribute("transform", "translate(0 0)");
                } else {
                    drawGhost(
                            xKoordinataDuha[i] * 20 + 10,
                            yKoordinataDuha[i] * 20 + 10,
                            brojacGlavnePetlje - kadaJePacmanPojeoVelikuTocku > 30
                            ? bojaDuha[i]
                            : "blue",
                            "duh" + (i + 1),
                            false,
                            smjerDuha[i]
                            );
                    document
                            .getElementById("duh" + (i + 1))
                            .setAttribute("transform", "translate(0 0)");
                }
            }
        }
        function drawPacMan() {
            //PacMan se sastoji od zutog kruga i crnog trokuta (usta).
            var krug = document.createElementNS(XML_namespace_of_SVG, "circle");
            krug.setAttribute("cx", xKoordinataPacmana * 20 + 10);
            krug.setAttribute("cy", yKoordinataPacmana * 20 + 10);
            krug.setAttribute("r", 10);
            krug.setAttribute("fill", "yellow");
            krug.setAttribute("id", "PacMan");
            krug.setAttribute("transform", "translate(0 0)");
            zaslon.appendChild(krug);
            var usta = document.createElementNS(XML_namespace_of_SVG, "polygon");
            usta.setAttribute("points", "0,0 10,-10 10,10");
            usta.setAttribute("fill", "black");
            usta.setAttribute("id", "usta");
            usta.setAttribute(
                    "transform",
                    "translate(" +
                    (xKoordinataPacmana * 20 + 10) +
                    " " +
                    (yKoordinataPacmana * 20 + 10) +
                    ")"
                    );
            if (
                    !((xKoordinataPacmana + yKoordinataPacmana) % 2) ||
                    smjerPacmana == smjer.stop
                    )
                //Pacman zatvori usta kad se nade na neparnoj dijagonali i kada stoji.
                usta.setAttribute(
                        "transform",
                        usta.getAttribute("transform") + " scale(1 0)"
                        );
            usta.setAttribute(
                    "transform",
                    usta.getAttribute("transform") + " rotate(" + (90 * smjerPacmana - 90) + ")"
                    );
            zaslon.appendChild(usta);
        }
        function nextLevel() {
            level++;
            setTimeout(function () {
                score += 90 + 10 * level;
                kadaJePacmanPojeoVelikuTocku = -100;
                howManyDotsHasPacmanEaten = 0;
                howManyDotsAreThere = 0;
                for (var i = 0; i < 3; i++) {
                    xKoordinataDuha[i] = pocetnaXKoordinataDuha[i];
                    yKoordinataDuha[i] = pocetnaYKoordinataDuha[i];
                }
                xKoordinataPacmana = pocetnaXKoordinataPacmana;
                yKoordinataPacmana = pocetnaYKoordinataPacmana;
                smjerPacmana = smjer.desno;
                smjerDuha[duhovi.crveni] = smjer.desno;
                smjerDuha[duhovi.narancasti] = smjer.gore;
                smjerDuha[duhovi.ruzicasti] = smjer.lijevo;
                for (var i = 0; i < 19; i++)
                    for (var j = 0; j < 15; j++) {
                        if (pocetnoStanjeLabirinta[i].charAt(j) == "P") {
                            drawSmallCircle(j * 20 + 10, i * 20 + 10, "krug" + (i * 20 + j));
                            howManyDotsAreThere++;
                        }
                        if (pocetnoStanjeLabirinta[i].charAt(j) == "B") {
                            drawBigCircle(j * 20 + 10, i * 20 + 10, "krug" + (i * 20 + j));
                            howManyDotsAreThere++;
                        }
                    }
            }, 1950); //Novi level se postavlja tek kada natpis o novom levelu nestane (nakon 1950 milisekunda).
            showLevel();
        }
        function touchScreenInterface(event) {
            //Gdje se nalazi polje u labirintu koje je korisnik dotaknuo? Je li, na primjer, vise lijevo ili vise prema gore od PacMana?
            var x = Math.floor(
                    (event.clientX - (document.body.clientWidth / 2 - 300 / 2)) / 20
                    );
            var y = Math.floor(event.clientY / 20);
            if (Math.abs(xKoordinataPacmana - x) > Math.abs(yKoordinataPacmana - y)) {
                if (x < xKoordinataPacmana)
                    onButtonLeft();
                else
                    onButtonRight();
            } else {
                if (y < yKoordinataPacmana)
                    onButtonUp();
                else
                    onButtonDown();
            }
        }
        function mainLoop() {
            //Glavna petlja, prati u kojem se polju iz 'pocetnoStanjeLabirinta' trenutno nalaze PacMan i duhovi.
            hasPacmanChangedDirection = false;
            brojacGlavnePetlje++;
            brojacAnimacijskePetlje = 0;
            var pacman = zaslon.getElementById("PacMan");
            if (pacman != null) {
                //PacMan se crta svaki put kada se ude u 'mainLoop'.
                zaslon.removeChild(pacman);
                zaslon.removeChild(zaslon.getElementById("usta"));
                if (zaslon.getElementById("TouchScreenInterface"))
                    zaslon.removeChild(zaslon.getElementById("TouchScreenInterface"));
            }
            if (
                    pocetnoStanjeLabirinta[
                            yKoordinataPacmana + yKomponentaSmjeraPacmana[smjerPacmana]
                    ].charAt(xKoordinataPacmana + xKomponentaSmjeraPacmana[smjerPacmana]) == "W"
                    )
                //Ako se PacMan nabio u zid, mora stati.
                smjerPacmana = smjer.stop;
            for (var i = 0; i < 3; i++) {
                var duh = zaslon.getElementById("duh" + (i + 1));
                if (duh != null)
                    //Duhovi se crtaju svaki put iznova kada se ude u 'mainLoop'.
                    zaslon.removeChild(duh);
                var bijeli = zaslon.getElementById("bijeli" + (i + 1));
                if (bijeli != null)
                    zaslon.removeChild(bijeli);
                var kolikoJePutaDuhPromijenioSmjer = 0;
                for (var j = 0; j < 4; j++)
                    if (
                            pocetnoStanjeLabirinta[
                                    yKoordinataDuha[i] + yKomponentaSmjeraPacmana[j]
                            ].charAt(xKoordinataDuha[i] + xKomponentaSmjeraPacmana[j]) != "W"
                            )
                        //Nalazi li se duh na krizistu hodnika iz labirinta?
                        kolikoJePutaDuhPromijenioSmjer++;
                var suprotniSmjer = (smjerDuha[i] + 2) % 4;
                if (
                        pocetnoStanjeLabirinta[
                                yKoordinataDuha[i] + yKomponentaSmjeraPacmana[smjerDuha[i]]
                        ].charAt(xKoordinataDuha[i] + xKomponentaSmjeraPacmana[smjerDuha[i]]) ==
                        "W" ||
                        kolikoJePutaDuhPromijenioSmjer > 2
                        ) {
                    if (
                            Math.abs(xKoordinataPacmana - xKoordinataDuha[i]) >
                            Math.abs(yKoordinataPacmana - yKoordinataDuha[i]) && //Ako je PacMan vise udaljen od duha u smjeru lijevo-desno.
                            !(
                                    (yKoordinataDuha[i] == 7 || yKoordinataDuha[i] == 8) &&
                                    xKoordinataDuha[i] > 4 &&
                                    xKoordinataDuha[i] < 9
                                    ) /*Ako duh nije u "kucici" u sredini labirinta (gdje je bio na pocetku nivoa).*/
                            ) {
                        //Crveni duh od treceg nivoa nadalje pokusava pratiti PacMana.
                        if (
                                xKoordinataPacmana < xKoordinataDuha[i] &&
                                i == duhovi.crveni &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i]].charAt(
                                xKoordinataDuha[i] - 1
                                ) != "W" &&
                                level > 1
                                ) {
                            smjerDuha[i] = smjer.lijevo; //Ako je PacMan lijevo, usmjeri crvenog duha lijevo.
                            continue;
                        }
                        if (
                                xKoordinataPacmana > xKoordinataDuha[i] &&
                                i == duhovi.crveni &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i]].charAt(
                                xKoordinataDuha[i] + 1
                                ) != "W" &&
                                level > 1
                                ) {
                            smjerDuha[i] = smjer.desno; //Ako je PacMan desno, usmjeri crvenog duha desno.
                            continue;
                        }
                        if (
                                yKoordinataPacmana < yKoordinataDuha[i] &&
                                i == duhovi.crveni &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i] - 1].charAt(
                                xKoordinataDuha[i]
                                ) != "W" &&
                                !(xKoordinataDuha[i] == 7 && yKoordinataDuha[i] == 6) &&
                                level > 1
                                ) {
                            smjerDuha[i] = smjer.gore; //Ako je PacMan gore, usmjeri crvenog duha gore.
                            continue;
                        }
                        if (
                                yKoordinataPacmana > yKoordinataDuha[i] &&
                                i == duhovi.crveni &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i] + 1].charAt(
                                xKoordinataDuha[i]
                                ) != "W" &&
                                !(xKoordinataDuha[i] == 7 && yKoordinataDuha[i] == 6) &&
                                level > 1
                                ) {
                            smjerDuha[i] = smjer.dolje; //Ako je PacMan dolje, usmjeri crvenog duha dolje.
                            continue;
                        }
                        //Narancasti duh od drugog nivoa nadalje "bjezi" od PacMana.
                        if (
                                xKoordinataPacmana < xKoordinataDuha[i] &&
                                i == duhovi.narancasti &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i]].charAt(
                                xKoordinataDuha[i] + 1
                                ) != "W" &&
                                level
                                ) {
                            smjerDuha[i] = smjer.desno; //Ako je PacMan lijevo, usmjeri narancastog duha desno.
                            continue;
                        }
                        if (
                                xKoordinataPacmana > xKoordinataDuha[i] &&
                                i == duhovi.narancasti &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i]].charAt(
                                xKoordinataDuha[i] - 1
                                ) != "W" &&
                                level
                                ) {
                            smjerDuha[i] = smjer.lijevo; //Ako je PacMan desno, usmjeri narancastog duha lijevo.
                            continue;
                        }
                        if (
                                yKoordinataPacmana < yKoordinataDuha[i] &&
                                i == duhovi.narancasti &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i] + 1].charAt(
                                xKoordinataDuha[i]
                                ) != "W" &&
                                !(xKoordinataDuha[i] == 7 && yKoordinataDuha[i] == 6) &&
                                level
                                ) {
                            smjerDuha[i] = smjer.dolje; //Ako je PacMan gore, usmjeri narancastog duha dolje.
                            continue;
                        }
                        if (
                                yKoordinataPacmana > yKoordinataDuha[i] &&
                                i == duhovi.narancasti &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i] - 1].charAt(
                                xKoordinataDuha[i]
                                ) != "W" &&
                                !(xKoordinataDuha[i] == 7 && yKoordinataDuha[i] == 6) &&
                                level
                                ) {
                            smjerDuha[i] = smjer.gore; //Ako je PacMan dolje, usmjeri narancastog duha gore.
                            continue;
                        }
                    } else if (
                            !(
                                    (yKoordinataDuha[i] == 7 || yKoordinataDuha[i] == 8) &&
                                    xKoordinataDuha[i] > 4 &&
                                    xKoordinataDuha[i] < 9
                                    )
                            ) {
                        //Ako je PacMan vise udaljen od duha u smjeru gore-dolje, a duh nije u "kucici" u sredini labirinta.
                        if (
                                yKoordinataPacmana < yKoordinataDuha[i] &&
                                i == duhovi.crveni &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i] - 1].charAt(
                                xKoordinataDuha[i]
                                ) != "W" &&
                                !(xKoordinataDuha[i] == 7 && yKoordinataDuha[i] == 6) &&
                                level > 1
                                ) {
                            smjerDuha[i] = smjer.gore; //Crveni prema gore
                            continue;
                        }
                        if (
                                yKoordinataPacmana > yKoordinataDuha[i] &&
                                i == duhovi.crveni &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i] + 1].charAt(
                                xKoordinataDuha[i]
                                ) != "W" &&
                                !(xKoordinataDuha[i] == 7 && yKoordinataDuha[i] == 6) &&
                                level > 1
                                ) {
                            smjerDuha[i] = smjer.dolje; //Crveni prema dolje
                            continue;
                        }
                        if (
                                xKoordinataPacmana < xKoordinataDuha[i] &&
                                i == duhovi.crveni &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i]].charAt(
                                xKoordinataDuha[i] - 1
                                ) != "W" &&
                                level > 1
                                ) {
                            smjerDuha[i] = smjer.lijevo; //Crveni prema lijevo
                            continue;
                        }
                        if (
                                xKoordinataPacmana > xKoordinataDuha[i] &&
                                i == duhovi.crveni &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i]].charAt(
                                xKoordinataDuha[i] + 1
                                ) != "W" &&
                                level > 1
                                ) {
                            smjerDuha[i] = smjer.desno; //Crveni prema desno
                            continue;
                        }
                        if (
                                yKoordinataPacmana < yKoordinataDuha[i] &&
                                i == duhovi.narancasti &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i] + 1].charAt(
                                xKoordinataDuha[i]
                                ) != "W" &&
                                !(xKoordinataDuha[i] == 7 && yKoordinataDuha[i] == 6) &&
                                level
                                ) {
                            smjerDuha[i] = smjer.dolje; //Narancasti prema dolje
                            continue;
                        }
                        if (
                                yKoordinataPacmana > yKoordinataDuha[i] &&
                                i == duhovi.narancasti &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i] - 1].charAt(
                                xKoordinataDuha[i]
                                ) != "W" &&
                                !(xKoordinataDuha[i] == 7 && yKoordinataDuha[i] == 6) &&
                                level
                                ) {
                            smjerDuha[i] = smjer.gore; //Narancasti prema gore
                            continue;
                        }
                        if (
                                xKoordinataPacmana < xKoordinataDuha[i] &&
                                i == duhovi.narancasti &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i]].charAt(
                                xKoordinataDuha[i] + 1
                                ) != "W" &&
                                level
                                ) {
                            smjerDuha[i] = smjer.desno; //Narancasti prema desno
                            continue;
                        }
                        if (
                                xKoordinataPacmana > xKoordinataDuha[i] &&
                                i == duhovi.narancasti &&
                                pocetnoStanjeLabirinta[yKoordinataDuha[i]].charAt(
                                xKoordinataDuha[i] - 1
                                ) != "W" &&
                                level
                                ) {
                            smjerDuha[i] = smjer.lijevo; //Narancasti prema lijevo
                            continue;
                        }
                    }
                    do {
                        smjerDuha[i] = Math.floor(Math.random() * 4); //Ruzicasti duh, svi duhovi u kucici, te crveni i narancasti duh prije treceg ili drugog nivoa gibaju se nasumicno.
                    } while (
                            pocetnoStanjeLabirinta[
                                    yKoordinataDuha[i] + yKomponentaSmjeraPacmana[smjerDuha[i]]
                            ].charAt(xKoordinataDuha[i] + xKomponentaSmjeraPacmana[smjerDuha[i]]) ==
                            "W" ||
                            (smjerDuha[i] == suprotniSmjer &&
                                    ((xKoordinataDuha[i] != xKoordinataCiljaSiluete - 1 &&
                                            xKoordinataDuha[i] != xKoordinataCiljaSiluete + 1) ||
                                            yKoordinataDuha[i] != yKoordinataCiljaSiluete + 2))
                            ); //Nije pozeljno da duh na krizistu putova krene u suprotnom smjeru no sto je prije isao.
                }
                if (
                        Math.abs(xKoordinataDuha[i] - xKoordinataPacmana) < 2 &&
                        Math.abs(yKoordinataDuha[i] - yKoordinataPacmana) < 2 &&
                        brojacGlavnePetlje - kadaJePacmanPojeoVelikuTocku > 30
                        ) {
                    //Ako se duh i PacMan sudare, a od posljednjeg konzumiranja velike tocke proslo je vise od 30 sekundi.
                    if (kolikoJePacmanuPreostaloZivota) {
                        zaslon.removeChild(
                                zaslon.getElementById("live" + kolikoJePacmanuPreostaloZivota)
                                );
                        kolikoJePacmanuPreostaloZivota--;
                        for (var i = 0; i < 3; i++) {
                            xKoordinataDuha[i] = pocetnaXKoordinataDuha[i];
                            yKoordinataDuha[i] = pocetnaYKoordinataDuha[i];
                        }
                        xKoordinataPacmana = pocetnaXKoordinataPacmana;
                        yKoordinataPacmana = pocetnaYKoordinataPacmana;
                        smjerPacmana = smjer.desno;
                        smjerDuha[duhovi.crveni] = smjer.desno;
                        smjerDuha[duhovi.ruzicasti] = smjer.gore;
                        smjerDuha[duhovi.narancasti] = smjer.lijevo;
                        return;
                    } //Ako vise nema zivota.
                    else {
                        if (isGameFinished)
                            return;
                        //Ako se ovaj blok pozove dvaput.
                        else
                            isGameFinished = true;
                        alert(
                                "Game over! Your score: " +
                                score +
                                ". Hope you enjoyed. Author: Teo Samarzija."
                                );
                        clearInterval(time1); //Prestani pratiti gdje se nalazi PacMan, a gdje duhovi.
                        clearInterval(time2); //Zaustavi animacije.
                        if (score > highscore * 1) {
                            document.body.onresize = function () {
                                return;
                            }; //Safari 5.
                            document.getElementById("instructions").style.top =
                                    458 + 3 * 50 + 5 + "px";
                            var player;
                            do {
                                player = "<?php echo $_SESSION['username']; ?>"
                            } while (
                                    player &&
                                    (player.indexOf("<") + 1 ||
                                            player.indexOf(">") + 1 ||
                                            player.indexOf("&") + 1 ||
                                            player.indexOf(" ") + 1 ||
                                            player.indexOf('"') + 1 ||
                                            player.indexOf("=") + 1 ||
                                            player.indexOf("#") + 1)

                                    );
                            if (player == null)
                                player = "anonymous";
                            var hash = 7;
                            for (var i = 0; i < score / 127; i++) {
                                hash += i;
                                hash %= 907;
                            }
                            var submit =
                                    "setPacmanHighscore.php?" + sessionID + "&score=" +
                                    score +
                                    "&player=" +
                                    player +
                                    "&hash=" +
                                    hash + "&sumOfRandomNumbers=" + (first_random_number + second_random_number);
                            var link = document.createElement("a");
                            link.setAttribute("href", submit);
                            link.appendChild(
                                    document.createTextNode("Submit the new highscore!")
                                    );
                            link.setAttribute("target", "_blank"); //Otvori u novom prozoru, da se moze zatvoriti iz JavaScripta.
                            document
                                    .getElementById("bodovi")
                                    .appendChild(document.createElement("br"));
                            document.getElementById("bodovi").appendChild(link);
                        } else
                            window.close();
                    }
                }
                if (
                        Math.abs(xKoordinataDuha[i] - xKoordinataPacmana) < 2 &&
                        Math.abs(yKoordinataDuha[i] - yKoordinataPacmana) < 2 &&
                        brojacGlavnePetlje - kadaJePacmanPojeoVelikuTocku < 30
                        ) {
                    //Ako PacMan pojede "plavog" duha.
                    xKoordinataSiluete[i] = xKoordinataDuha[i];
                    yKoordinataSiluete[i] = yKoordinataDuha[i];
                    score += 10 + 2 * level;
                    jeLiPacmanPojeoDuha[i] = true;
                    xKoordinataDuha[i] = pocetnaXKoordinataDuha[i];
                    yKoordinataDuha[i] = pocetnaYKoordinataDuha[i];
                    continue;
                }
            }
            for (var i = 0; i < 3; i++) {
                if (
                        xKoordinataSiluete[i] == xKoordinataCiljaSiluete &&
                        (yKoordinataSiluete[i] == yKoordinataCiljaSiluete ||
                                yKoordinataSiluete[i] == yKoordinataCiljaSiluete + 1)
                        ) {
                    //Ako je bijeli duh pred vratima...
                    smjerKretanjaSiluete[i] = smjer.dolje;
                    continue;
                } //... neka ude u kucicu.
                if (
                        xKoordinataSiluete[i] == xKoordinataCiljaSiluete &&
                        yKoordinataSiluete[i] == yKoordinataCiljaSiluete + 2 &&
                        smjerKretanjaSiluete[i] == 2
                        ) {
                    //Ako je bijeli duh upravo usao u kucicu...
                    smjerKretanjaSiluete[i] = smjer.lijevo;
                    continue;
                } //... neka ide lijevo.
                if (
                        xKoordinataSiluete[i] == xKoordinataCiljaSiluete &&
                        yKoordinataSiluete[i] == yKoordinataCiljaSiluete + 2
                        )
                    //Ako je bijeli duh na sredini kucice...
                    continue; //Neka zadrzi smjer.
                if (
                        xKoordinataSiluete[i] == xKoordinataCiljaSiluete - 1 &&
                        yKoordinataSiluete[i] == yKoordinataCiljaSiluete + 2
                        ) {
                    //Ako je bijeli duh na lijevom zidu kucice
                    smjerKretanjaSiluete[i] = smjer.desno;
                    continue;
                } //... neka ide desno.
                if (
                        xKoordinataSiluete[i] == xKoordinataCiljaSiluete + 1 &&
                        yKoordinataSiluete[i] == yKoordinataCiljaSiluete + 2
                        ) {
                    //Ako je bijeli duh na desnom zidu kucice...
                    smjerKretanjaSiluete[i] = smjer.lijevo;
                    continue;
                } //... neka ide lijevo.
                if (
                        (Math.abs(xKoordinataSiluete[i] - xKoordinataCiljaSiluete) == 1 ||
                                Math.abs(xKoordinataSiluete[i] - xKoordinataCiljaSiluete) == 2) &&
                        pocetnoStanjeLabirinta[
                                yKoordinataSiluete[i] +
                                yKomponentaSmjeraPacmana[smjerKretanjaSiluete[i]]
                        ].charAt(
                        xKoordinataSiluete[i] +
                        xKomponentaSmjeraPacmana[smjerKretanjaSiluete[i]]
                        ) != "W" &&
                        smjerKretanjaSiluete[i] - 4
                        )
                    continue; //Greedy algoritam za odabiranje smjera ne funkcionira u nekim slucajevima, tada je bolje zadrzati smjer.
                if (
                        yKoordinataSiluete[i] > yKoordinataCiljaSiluete &&
                        pocetnoStanjeLabirinta[yKoordinataSiluete[i] - 1].charAt(
                        xKoordinataSiluete[i]
                        ) != "W"
                        ) {
                    //Ako je bijeli duh ispod cilja...
                    smjerKretanjaSiluete[i] = smjer.gore;
                    continue;
                } //... usmjeri ga prema gore.
                if (
                        yKoordinataSiluete[i] < yKoordinataCiljaSiluete &&
                        pocetnoStanjeLabirinta[yKoordinataSiluete[i] + 1].charAt(
                        xKoordinataSiluete[i]
                        ) != "W"
                        ) {
                    //Ako je bijeli duh iznad cilja...
                    smjerKretanjaSiluete[i] = smjer.dolje;
                    continue;
                } //... usmjeri ga prema dolje.
                if (
                        xKoordinataSiluete[i] > xKoordinataCiljaSiluete &&
                        pocetnoStanjeLabirinta[yKoordinataSiluete[i]].charAt(
                        xKoordinataSiluete[i] - 1
                        ) != "W"
                        ) {
                    //Ako je bijeli duh desno od cilja...
                    smjerKretanjaSiluete[i] = smjer.lijevo;
                    continue;
                } //... usmjeri ga prema lijevo.
                if (
                        xKoordinataSiluete[i] < xKoordinataCiljaSiluete &&
                        pocetnoStanjeLabirinta[yKoordinataSiluete[i]].charAt(
                        xKoordinataSiluete[i] + 1
                        ) != "W"
                        ) {
                    //Ako je bijeli duh lijevo od cilja...
                    smjerKretanjaSiluete[i] = smjer.desno;
                    continue;
                } //... usmjeri ga prema desno.
                if (
                        xKoordinataSiluete[i] == xKoordinataCiljaSiluete &&
                        yKoordinataSiluete[i] > yKoordinataCiljaSiluete &&
                        pocetnoStanjeLabirinta[yKoordinataSiluete[i] - 1].charAt(
                        xKoordinataSiluete[i]
                        ) == "W"
                        ) {
                    //Ako je bijeli duh ravno ispod cilja, a iznad njega zid...
                    smjerKretanjaSiluete[i] = smjer.lijevo;
                    continue;
                } //... usmjeri ga prema lijevo.
            }
            if (
                    zaslon.getElementById(
                            "krug" + (yKoordinataPacmana * 20 + xKoordinataPacmana)
                            ) != null
                    ) {
                //Ako pojede tockicu.
                zaslon.removeChild(
                        zaslon.getElementById(
                                "krug" + (yKoordinataPacmana * 20 + xKoordinataPacmana)
                                )
                        );
                if (
                        pocetnoStanjeLabirinta[yKoordinataPacmana].charAt(xKoordinataPacmana) ==
                        "B"
                        ) {
                    //Ako je upravo pojedena velika tocka.
                    kadaJePacmanPojeoVelikuTocku = brojacGlavnePetlje;
                    score += 4 + level;
                    jeLiPacmanPojeoDuha = [false, false, false];
                }
                score += 1 + level;
                howManyDotsHasPacmanEaten++;
                var bodovi = document.getElementById("score");
                bodovi.removeChild(bodovi.lastChild);
                bodovi.appendChild(document.createTextNode("Score: " + score));
            }
            drawGhosts();
            drawPacMan();
            var touch = document.createElementNS(XML_namespace_of_SVG, "rect"); //Prozirni pravokutnik preko labirinta prima evente kada korsnik dodirne negdje u labirint.
            touch.setAttribute("x", 0);
            touch.setAttribute("y", 20);
            touch.setAttribute("width", 300);
            touch.setAttribute("height", 340);
            touch.setAttribute("id", "TouchScreenInterface");
            touch.setAttribute("fill-opacity", 0);
            touch.addEventListener("click", touchScreenInterface);
            zaslon.appendChild(touch);
            for (var i = 0; i < 3; i++) {
                if (
                        jeLiPacmanPojeoDuha[i] &&
                        brojacGlavnePetlje - kadaJePacmanPojeoVelikuTocku < 30
                        ) {
                    xKoordinataSiluete[i] +=
                            xKomponentaSmjeraPacmana[smjerKretanjaSiluete[i]];
                    yKoordinataSiluete[i] +=
                            yKomponentaSmjeraPacmana[smjerKretanjaSiluete[i]];
                    continue;
                }
                xKoordinataDuha[i] += xKomponentaSmjeraPacmana[smjerDuha[i]];
                yKoordinataDuha[i] += yKomponentaSmjeraPacmana[smjerDuha[i]];
                if (xKoordinataDuha[i] > 14)
                    //Ako duh prode kroz krajnji desni prolaz u labirintu...
                    xKoordinataDuha[i] = 0; //...prebaci ga na krajnji lijevi.
                if (xKoordinataDuha[i] < 0)
                    //Ako duh prode kroz krajnji lijevi prolaz u labirintu...
                    xKoordinataDuha[i] = 14; //...prebaci ga na krajnji desni.
            }
            xKoordinataPacmana += xKomponentaSmjeraPacmana[smjerPacmana];
            yKoordinataPacmana += yKomponentaSmjeraPacmana[smjerPacmana];
            if (xKoordinataPacmana > 14)
                //Ako PacMan prode kroz desni prolaz.
                xKoordinataPacmana = 0;
            if (xKoordinataPacmana < 0)
                //Ako PacMan prode kroz lijevi prolaz.
                xKoordinataPacmana = 14;
            if (howManyDotsHasPacmanEaten == howManyDotsAreThere)
                nextLevel();
        }
        function animationLoop() {
            brojacAnimacijskePetlje++;
            if (brojacAnimacijskePetlje >= 6) {
                mainLoop();
                return;
            }
            if (brojacGlavnePetlje < 2)
                return; //Ne pokusavaj animirati PacMana i duhove ako jos nisu nacrtani.
            if (brojacAnimacijskePetlje >= 5)
                mainLoop();
            for (var i = 0; i < 3; i++) {
                if (
                        jeLiPacmanPojeoDuha[i] &&
                        brojacGlavnePetlje - kadaJePacmanPojeoVelikuTocku < 30
                        && zaslon.getElementById("bijeli" + (i + 1))
                        )
                    //Ako je PacMan nedavno pojeo duha, animiraj bijelu siluetu...
                    zaslon
                            .getElementById("bijeli" + (i + 1))
                            .setAttribute(
                                    "transform",
                                    "translate(" +
                                    (20 / 5) *
                                    brojacAnimacijskePetlje *
                                    xKomponentaSmjeraPacmana[smjerKretanjaSiluete[i]] +
                                    " " +
                                    (20 / 5) *
                                    brojacAnimacijskePetlje *
                                    yKomponentaSmjeraPacmana[smjerKretanjaSiluete[i]] +
                                    ")"
                                    );
                //... inace animiraj duha.
                else if (zaslon.getElementById("duh" + (i + 1)))
                    zaslon
                            .getElementById("duh" + (i + 1))
                            .setAttribute(
                                    "transform",
                                    "translate(" +
                                    (20 / 5) *
                                    brojacAnimacijskePetlje *
                                    xKomponentaSmjeraPacmana[smjerDuha[i]] +
                                    " " +
                                    (20 / 5) *
                                    brojacAnimacijskePetlje *
                                    yKomponentaSmjeraPacmana[smjerDuha[i]] +
                                    ")"
                                    );
            }
            if (hasPacmanChangedDirection == true)
                //Nemoj animirati PacMana ukoliko on upravo mijenja smjer.
                return;
            else if (zaslon.getElementById("PacMan") && zaslon.getElementById("usta")) {
                zaslon
                        .getElementById("PacMan")
                        .setAttribute(
                                "transform",
                                "translate(" +
                                (20 / 5) *
                                brojacAnimacijskePetlje *
                                xKomponentaSmjeraPacmana[smjerPacmana] +
                                " " +
                                (20 / 5) *
                                brojacAnimacijskePetlje *
                                yKomponentaSmjeraPacmana[smjerPacmana] +
                                ")"
                                );
                var usta = zaslon.getElementById("usta");
                usta.setAttribute(
                        "transform",
                        "translate(" +
                        ((20 / 5) *
                                brojacAnimacijskePetlje *
                                xKomponentaSmjeraPacmana[smjerPacmana] +
                                ((xKoordinataPacmana - xKomponentaSmjeraPacmana[smjerPacmana]) * 20 +
                                        10)) +
                        " " +
                        ((20 / 5) *
                                brojacAnimacijskePetlje *
                                yKomponentaSmjeraPacmana[smjerPacmana] +
                                (yKoordinataPacmana - yKomponentaSmjeraPacmana[smjerPacmana]) * 20 +
                                10) +
                        ")"
                        );
                if (
                        !(
                                (xKoordinataPacmana + yKoordinataPacmana) %
                                2
                                ) /*Na poljima na parnim dijagonalama ce usta biti zatvorena, a na neparnima otvorena.*/ &&
                        (smjerPacmana == 1 || smjerPacmana == 3)
                        )
                    usta.setAttribute(
                            "transform",
                            usta.getAttribute("transform") +
                            " scale(1 " +
                            brojacAnimacijskePetlje * 0.2 +
                            ")"
                            );
                else if (smjerPacmana == smjer.desno || smjerPacmana == smjer.lijevo)
                    usta.setAttribute(
                            "transform",
                            usta.getAttribute("transform") +
                            " scale(1 " +
                            (1 - brojacAnimacijskePetlje * 0.2) +
                            ")"
                            );
                else if (
                        !((xKoordinataPacmana + yKoordinataPacmana) % 2) &&
                        (smjerPacmana == smjer.dolje || smjerPacmana == smjer.gore)
                        )
                    usta.setAttribute(
                            "transform",
                            usta.getAttribute("transform") +
                            " scale(" +
                            brojacAnimacijskePetlje * 0.2 +
                            " 1)"
                            );
                else if (smjerPacmana == smjer.dolje || smjerPacmana == smjer.gore)
                    usta.setAttribute(
                            "transform",
                            usta.getAttribute("transform") +
                            " scale(" +
                            (1 - brojacAnimacijskePetlje * 0.2) +
                            " 1)"
                            );
                else if (smjerPacmana == smjer.stop)
                    //PacMan, ako se ne mice, uvijek drzi usta zatvorenima.
                    usta.setAttribute(
                            "transform",
                            usta.getAttribute("transform") + " scale(1 0)"
                            );
                usta.setAttribute(
                        "transform",
                        usta.getAttribute("transform") + " rotate(" + (90 * smjerPacmana - 90) + ")"
                        );
            }
        }
        //Crtanje labirinta na pocetku igre.
        for (var i = 0; i < 19; i++)
            for (var j = 0; j < 15; j++) {
                if (pocetnoStanjeLabirinta[i].charAt(j) == "W") {
                    if (pocetnoStanjeLabirinta[i - 1].charAt(j) == "W")
                        drawLine(j * 20 + 10, j * 20 + 10, i * 20, i * 20 + 10);
                    if (pocetnoStanjeLabirinta[i + 1].charAt(j) == "W")
                        drawLine(j * 20 + 10, j * 20 + 10, i * 20 + 10, i * 20 + 20);
                    if (pocetnoStanjeLabirinta[i].charAt(j - 1) == "W")
                        drawLine(j * 20, j * 20 + 10, i * 20 + 10, i * 20 + 10);
                    if (pocetnoStanjeLabirinta[i].charAt(j + 1) == "W")
                        drawLine(j * 20 + 10, j * 20 + 20, i * 20 + 10, i * 20 + 10);
                }
                if (pocetnoStanjeLabirinta[i].charAt(j) == "P") {
                    drawSmallCircle(j * 20 + 10, i * 20 + 10, "krug" + (i * 20 + j));
                    howManyDotsAreThere++;
                }
                if (pocetnoStanjeLabirinta[i].charAt(j) == "B") {
                    drawBigCircle(j * 20 + 10, i * 20 + 10, "krug" + (i * 20 + j));
                    howManyDotsAreThere++;
                }
                if (pocetnoStanjeLabirinta[i].charAt(j) == "C") {
                    xKoordinataPacmana = pocetnaXKoordinataPacmana = j;
                    yKoordinataPacmana = pocetnaYKoordinataPacmana = i;
                }
                if (
                        pocetnoStanjeLabirinta[i].charAt(j) > "0" &&
                        pocetnoStanjeLabirinta[i].charAt(j) < "4"
                        ) {
                    //Duhovi.
                    //charCodeAt - vraca ASCII vrijednost znaka iz stringa (broj), to je vazno zbog arraysova, arr['0'] ne znaci isto sto i arr[0].
                    xKoordinataDuha[
                            pocetnoStanjeLabirinta[i].charCodeAt(j) - "1".charCodeAt(0)
                    ] = j;
                    yKoordinataDuha[
                            pocetnoStanjeLabirinta[i].charCodeAt(j) - "1".charCodeAt(0)
                    ] = i;
                    pocetnaYKoordinataDuha[
                            pocetnoStanjeLabirinta[i].charCodeAt(j) - "1".charCodeAt(0)
                    ] = i;
                    pocetnaXKoordinataDuha[
                            pocetnoStanjeLabirinta[i].charCodeAt(j) - "1".charCodeAt(0)
                    ] = j;
                }
            }
        //Crtanje PacMana u lijevom donjem kutu koji oznacaju preostale zivote.
        for (var i = 0; i < kolikoJePacmanuPreostaloZivota; i++) {
            var krug = document.createElementNS(XML_namespace_of_SVG, "circle");
            krug.setAttribute("fill", "yellow");
            krug.setAttribute("cx", 25 + i * 25);
            krug.setAttribute("cy", 380);
            krug.setAttribute("r", 10);
            krug.setAttribute("id", "live" + (i + 1));
            zaslon.appendChild(krug);
            var usta = document.createElementNS(XML_namespace_of_SVG, "polygon");
            usta.setAttribute(
                    "points",
                    25 + i * 25 + ",380 " + (35 + i * 25) + ",370 " + (35 + i * 25) + " 390"
                    );
            usta.setAttribute("fill", "black");
            zaslon.appendChild(usta);
        }
        drawGhosts();
        drawPacMan();
        function onStartButton() {
            document.body.removeChild(document.getElementById("startButton"));
            showLevel(); //U funkciji "showlevel" se postavlja timer.
        }
        function nestajanje() {
            //Natpis o tome na kojem smo levelu ne iscezava odjednom, nego postupno.
            var natpis = document.getElementById("natpis");
            if (kolikoJePutaDuhPromijenioSmjer < 16 && natpis) {
                kolikoJePutaDuhPromijenioSmjer++;
                natpis.style.opacity -= 1 / 15;
                natpis.style.left =
                        document.body.clientWidth / 2 -
                        300 / 2 +
                        50 +
                        kolikoJePutaDuhPromijenioSmjer +
                        "px"; //Kako natpis nestaje, polako se pomice udesno.
                setTimeout(nestajanje, 100);
            } else if (typeof natpis == "object")
                document.body.removeChild(natpis);
        }
        function showLevel() {
            clearInterval(time1);
            clearInterval(time2);
            //Pacman i duhovi se ne smiju pomicati iza natpisa da smo presli na novi level.
            var natpis = document.createElement("div");
            natpis.style.opacity = 1.0;
            natpis.style.left = document.body.clientWidth / 2 - 300 / 2 + 50;
            natpis.innerHTML = "<b>LEVEL #" + (level + 1) + "</b>"; //Ovako se mogu pozivati naredbe iz HTML-a u JavaScript programu.
            natpis.id = "natpis";
            document.body.appendChild(natpis);
            kolikoJePutaDuhPromijenioSmjer = 0;
            setTimeout(nestajanje, 500); //Neka natpis o tome na kojem smo levelu pocne iscezavati nakon 500 milisekundi.
            setTimeout(function () {
                time2 = window.setInterval(animationLoop, 100);
            }, 2000); //Neka se glavna i animacijska petlja pocnu vrtiti nakon 2000 milisekunda od trenutka kada prijedemo na novi level.
        }

        // Enable arrow-key controls (also prevent page scrolling when arrows are used)
        window.addEventListener('keydown', function (e) {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    onButtonUp();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    onButtonDown();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    onButtonLeft();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    onButtonRight();
                    break;
            }
        }, false);
    </script>
</body>
</html>
