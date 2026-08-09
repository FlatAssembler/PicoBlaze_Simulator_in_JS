<?php
require 'db_helper.php';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if ($_POST['donotenter'] == "") {
     $conn = Database::getInstance()->getConnection();
     $conn->query(<<<SQL
CREATE TABLE IF NOT EXISTS survey_superbacteria(id INT PRIMARY KEY AUTO_INCREMENT,
eggs_more_important TEXT,
ionophores_percentage FLOAT,
where_genes_are_stored TEXT,
conjugation TEXT,
lab_grown_eggs TEXT)
SQL
);
     $stmt = $conn->prepare("INSERT INTO survey_superbacteria(eggs_more_important, ionophores_percentage, where_genes_are_stored, conjugation, lab_grown_eggs) VALUES (?, ?, ?, ?, ?)");
     $stmt->bind_param("sdsss", $_POST['eggs_more_important'], $_POST['ionophores_percentage'], $_POST['where_genes_are_stored'], $_POST['conjugation'], $_POST['lab_grown_eggs']);
     $stmt->execute();
  }
  else {
    die("I think you are a bot!");
}}
?>
<!doctype html>
<html>
<head>
<title>Survey about the opinions of a broad audience about superbacteria</title>
<style>
body {
  background-color: black;
  background-image: url(https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Six_eggs_views_from_the_top_on_a_white_background.jpg/500px-Six_eggs_views_from_the_top_on_a_white_background.jpg);
  background-repeat: no-repeat;
  background-attachment: fixed;
}
blockquote {
  background-color: #ffc;
}
main {
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  background-color: #aaa;
  padding: 5px;
}
form {
  background-color: #ccc;
}
section > div {
  background-color: #334;
  color: #eee;
  padding: 3px;
}
textarea {
  width: calc(100% - 10px);
  height: 300px;
}
input[type=text] {
  width: calc(100% - 10px);
}
@keyframes zaokruziObrube {
  from {
    border-radius: 0px;
  }
  to {
    border-radius: 50px;
  }
}
@media (min-width: 750px) {
  main {
    padding: 30px;
    animation-name: zaokruziObrube;
    animation-duration: 4s;
    animation-delay: 1s;
    animation-iteration-count: 1;
    animation-fill-mode: forwards;
    border: solid darkred 3px;
  }
}
button[type=submit] {
  width: 100%;
  line-height: 50px;
  background-color: lightgreen;
  margin-top: 5px;
  margin-bottom: 5px;
}
img {
  display: block;
  margin: 5px;
  max-width: calc(100% - 10px);
}
</style>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
<main>
<h1>Anonymous survey related to superbacteria - Anonimna anketa o superbakterijama</h1>
<header>In the debates about public health, especially in anarchist cirlces, you often hear the claim that lab-grown meat will soon mitigate the problem of superbacteria. My hypothesis is that certain misconceptions about bacteriology and modern agriculture lead people to think that, and I will test that hypothesis with this survey. Please respond either in English or Croatian.<br/>
U raspravama o javnozdravstvenim problemima, osobito u anarhističkim krugovima, nerijetko se čuje tvrdnja da će meso iz laboratorija uskoro znatno umanjiti problem superbakterija. Moja hipoteza je da određene krive predodžbe o bakteriologiji i današnjoj agronomiji dovode ljude na to da to misle, i provjerit ću tu svoju hipotezu ovom anketom. Molim Vas da odgovorite ili na hrvatskom jeziku ili na engleskom jeziku.
<?php if ($_SERVER['REQUEST_METHOD'] === 'POST'): ?>
<br/>
<strong>Ovo su očekivani odgovori./Those are the expected answers.</strong>
<?php endif;?></header>
<form method="POST">
<section><div>Smatrate li da su jaja, onako kako se danas proizvode, znatno veći problem s pogleda superbakterija nego što je meso?<br/>
Do you consider it true that eggs are, the way they are being produced today, a significantly larger problem when it comes to superbacteria than meat is?</div>
<?php if ($_SERVER['REQUEST_METHOD'] === 'POST' ): ?>
<blockquote>
Odgovorite kako želite, to je kontroverzno pitanje. Ja tvrdo vjerujem da je odgovor da jesu, i da je razlog zašto ljudi misle drugačije to što imaju određene krive predodžbe o bakteriologiji i današnjoj agronomiji.<br/>
Answer as you want it, this is a controversial question. I strongly suspect that the answer is yes, and that the reason people think otherwise is that they have certain misconceptions about bacteriology and modern agriculture.
</blockquote>
<?php else: ?>
<input type="radio" name="eggs_more_important" value="eggs_more_important" id="eggs_more_important_yes"><label for="eggs_more_important_yes">Yes/Da</label> <input type="radio" name="eggs_more_important" value="eggs_not_more_important" id="eggs_not_more_important"><label for="eggs_not_more_important">No/Ne</label>
<?php endif; ?></section>
<section><div>Ionofori su antibiotici koji su djelotvorni u pticama, ali su otrovni za sisavce. Što mislite, koliki postotak antibiotika koji se danas koriste pripada skupini ionofora?<br/>
Ionophores are antibiotics which are effective in birds, but are toxic to mammals. What do you think, what percentage of antibiotics which are used today are ionophores?</div>
<?php if ($_SERVER['REQUEST_METHOD'] === "POST"): ?>
<blockquote>
<?php
// https://stackoverflow.com/a/7263925/8902065
$stmt = $conn->prepare(<<<SQL
SELECT AVG(dd.ionophores_percentage) as median_val
FROM (
SELECT d.ionophores_percentage, @rownum:=@rownum+1 as `row_number`, @total_rows:=@rownum
  FROM survey_superbacteria d, (SELECT @rownum:=0) r
  WHERE d.ionophores_percentage is NOT NULL
  ORDER BY d.ionophores_percentage
) as dd
WHERE dd.row_number IN ( FLOOR((@total_rows+1)/2), FLOOR((@total_rows+2)/2) );
SQL);
$stmt->execute();
$median = $stmt->get_result()->fetch_assoc()['median_val'];
?>
	Točan odgovor je, <a href="https://www.nationalchickencouncil.org/questions-answers-antibiotics-chicken-production/">prema National Chicken Councilu</a>, 45%. Kao zanimljivost, srednje nagađanje u ovoj anketi je <?=$median?>%. Pretpostavljao sam da je česta kriva predodžba da većina antibiotika odlazi na krave i svinje.
<br/>
The correct answer is, <a href="https://www.nationalchickencouncil.org/questions-answers-antibiotics-chicken-production/">according to National Chicken Council</a>, 45%. As an interesting thing, the median guess in this survey is <?=$median?>%. I guess that it is a common misconception that most antibiotics go to cows and pigs.
</blockquote>
<?php else: ?>
<input type="number" name="ionophores_percentage" min="0" max="100">
<?php endif; ?>
</section>
<section>
<div>The genes for antibiotic resistance in bacteria are mostly stored on the genophore, and the bacteria can only pass it to its direct offspring, rather than to other bacteria. Only the rare bacteria which attack both chickens and humans can become more dangerous because of the use of antibiotics in chickens.<br/>
Geni za otpornost na antibiotike u bakterijama većinom su pohranjeni na genoforu, i bakterija ih može prenijeti samo na svoje direktne potomke, a ne može na druge bakterije. Samo rijetke bakterije koje napadaju i kokoši i ljude mogu postati opasnije zbog korištenja antibiotika u industriji jaja.</div>
<?php if ($_SERVER['REQUEST_METHOD'] == "POST"): ?>
<blockquote>This is a dangerously wrong proposition, as over 85% of all antibiotic resistance genes are stored on the plasmids, rather than the genophore. And bacteria can pass it to other bacteria that touch it via conjugation.<br>
To je opasno kriva propozicija, jer preko 85% gena za otpornost na antibiotike pohranjeno je na plazmidima, a ne na genoforu. I bakterija ih može prenijeti na druge bakterije konjugacijom.
</blockquote>
<?php else: ?>
<input type="radio" name="where_genes_are_stored" value="genophore" id="genes_are_stored_on_genophore"><label for="genes_are_stored_on_genophore">Yes/Da</label> <input type="radio" name="where_genes_are_stored" value="genes_are_stored_on_plasmids" id="genes_are_stored_on_plasmids"><label for="genes_are_stored_on_plasmids">No/Ne</label>
<?php endif; ?>
</section>
<section>
<div>Bacteria, in general, can only conjugate with closely related bacteria, that is, the bacteria of the same or a closely-related specie. That is why specie is defined in biology as the group of individual organisms that can mate with one another and produce viable offspring.<br/>
Bakterije se u pravilu mogu konjugirati samo s blisko srodnim bakterijama, to jest, s bakterijama iste ili blisko srodne vrste. Zato se vrsta u biologiji definira kao grupa individualnih organizama koji se mogu međusobno razmnožavati i stvarati plodno potomstvo.</div>
<?php if ($_SERVER['REQUEST_METHOD'] === 'POST'): ?>
<blockquote>This is not remotely correct. Bacteria regularly conjugate with bacteria separated from them with billions of years of evolution. A specie in bacteriology is defined somehow complicated, and it has nothing to do with conjugations.<br/>
Ovo nije ni izdaleka točno. Bakterije se redovito konjugiraju s bakterijama odvojenima od njih s milijardama godina evolucije. Vrsta se u bakteriologiji definira nekako komplicirano, i nema veze s konjugacijama.</blockquote>
<?php else: ?>
<input type="radio" name="conjugation" value="only_with_close_relatives" id="only_with_close_relatives"><label for="only_with_close_relatives">Yes/Da</label> <input type="radio" name="conjugation" value="with_distant_relatives" id="with_distant_relatives"><label for="with_distant_relatives">No/Ne</label>
<?php endif; ?>
</section>
<section><div>We will soon have lab-grown eggs.<br/>
Uskoro ćemo imati jaja iz laboratorija.</div>
<?php if ($_SERVER['REQUEST_METHOD'] === 'POST'): ?>
<blockquote>
The future is hard to predict, but there seems to be no particular reason to think that's the case. We struggle to even produce muscle meat in a laboratory, and producing eggs is far more complicated.<br/>
Teško je predvidjeti budućnost, ali ne vidim neki osobit razlog da mislim da ćemo uskoro imati jaja iz laboratorija. Zasad se borimo da proizvedemo mišiće u laboratoriju, a proizvoditi jaja daleko je kompliciranije.
</blockquote><?php else: ?>
<input type="radio" name="lab_grown_eggs" value="we_will_soon_have_them" id="we_will_soon_have_them"><label for="we_will_soon_have_them">True/Istina</label> <input type="radio" name="lab_grown_eggs" value="we_will_not_soon_have_them" id="we_will_not_soon_have_them"><label for="we_will_not_soon_have_them">False/Laž</label>
<?php endif; ?>
</section>
<section><div>
Do not enter anything here (spambot protection):<br/>
Nemojte ovdje ništa upisati (zaštita od botova):</div>
<?php if ($_SERVER['REQUEST_METHOD'] === 'POST'): ?>
<blockquote>Empty/Prazno</blockquote>
<?php else: ?>
<input type="text" name="donotenter">
<?php endif; ?>
</section>
<?php if ($_SERVER['REQUEST_METHOD'] == "GET"): ?>
<button type="submit">Submit/Predaj</button>
<?php endif; ?>
</form>
<?php if ($_SERVER['REQUEST_METHOD'] == 'POST'): ?>
<footer>
Diving deeper into the problem of superbacteria is what shaked me out of both my anarchist beliefs and my beliefs that widespread vegetarianism would solve most of the world's problems.<br/>
To što sam zaronio dublje u problem superbakterija ono je što me je prodrmalo i iz mojih anarhističkih uvjerenja i uvjerenja da bi rasprostranjeno vegetarijanstvo riješilo većinu globalnih problema.
</footer>
<?php endif; ?>
</main>
</body>
</html>
