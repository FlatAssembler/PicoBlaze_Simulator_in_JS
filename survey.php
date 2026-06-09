<?php
require 'db_helper.php';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if ($_POST['donotenter'] == "") {
     $conn = Database::getInstance()->getConnection();
     $conn->query(<<<SQL
CREATE TABLE IF NOT EXISTS survey(id INT PRIMARY KEY AUTO_INCREMENT,
vegetarian TEXT,
vitamin_k TEXT,
heme_iron TEXT,
carry_weapons TEXT,
mitochondria TEXT)
SQL
);
     $stmt = $conn->prepare("INSERT INTO survey(vegetarian, vitamin_k, heme_iron, carry_weapons, mitochondria) VALUES (?, ?, ?, ?, ?)");
     $stmt->bind_params("sssss", $_POST['vegetarian'], $_POST['vitamin_k'], $_POST['heme_iron'], $_POST['carry_weapons'], $_POST['mitochondria']);
     $stmt->execute();
  }
  else {
    die("I think you are a bot!");
}}
?>
<!doctype html>
<html>
<head>
<title>Survey about the opinions on various things among vegetarians and non-vegetarians</title>
<style>
body {
  background-color: black;
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
</style>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
<main>
<h1>Anonymous survey related to vegetarianism - Anonimna anketa o vegetarijanstvu</h1>
<header>This is an anonymous survey about the opinions of vegetarians and non-vegetarians on various topics. Please respond either in English or Croatian.<br/>
Ovo je anonimna anketa o razmišljanjima vegetarijanaca i njihovih protivnika o raznim stvarima. Molim Vas da odgovorite ili na hrvatskom jeziku ili na engleskom jeziku.
<?php if ($_SERVER['REQUEST_METHOD'] === 'POST'): ?>
<strong>Ovo su očekivani odgovori./Those are the expected answers.</strong>
<?php endif;?></header>
<form method="POST">
<section><div>Jeste li vegetarijanac/vegetarijanka?<br/>
Are you a vegetarian?</div>
<?php if ($_SERVER['REQUEST_METHOD'] === 'POST' ): ?>
<blockquote>
Odgovorite kako želite.<br/>
Answer however you like.
</blockquote>
<?php else: ?>
<input type="radio" name="vegetarian" value="vegetarian" id="vegetarian_yes"><label for="vegetarian_yes">Yes/Da</label> <input type="radio" name="vegetarian" value="not_vegetarian" id="vegetarian_no"><label for="vegetarian_no">No/Ne</label>
<?php endif; ?></section>
<section><div>Što mislite, kako točno ekstreman nedostatak Vitamina K uzrokuje srčane udare? Ako niste sigurni, nagađajte, nemojte gledati na internetu. I, molim Vas, nemojte odgovoriti samo &quot;<i>Zbog kalcija.</i>&quot;, već elaborirajte.<br/>
What do you think, how exactly does an extreme Vitamin K deficiency increase one's chances of a heart attack? If you are not sure, make a guess, do not look it up on the Internet. And, please, do not answer just &quot;<i>Because of calcium.</i>&quot;, but elaborate.</div>
<?php if ($_SERVER['REQUEST_METHOD'] === "POST"): ?>
<blockquote>
Ekstreman nedostatak vitamina K povećava rizik od srčanog udara tako što sprječava sintezu enzima zvanog Matrični GLA Protein, a to je enzim koji usporava kalcifikaciju kolesterola u krvi. Ali već na dozi od oko 30 mikrograma Vitamina K na dan, najviše moguće Matričnog GLA Proteina se proizvodi. Zato su srčani udari uzrokovani nedostatkom Vitamina K izuzetno rijetki, prosječan čovjek uzima oko 70 mikrograma na dan. Srčani udari uzrokovani visokim kolesterolom daleko su češći.<br/>
Extreme Vitamin K deficiency increases one's risk of a heart attack by preventing the synthesis of the enzyme called Matrix GLA Protein, which is responsible for slowing down the calcification of the cholesterol in the blood. However, already at the dose of 30 micrograms of Vitamin K per day, maxomal possible amount of Matrix GLA Protein is produced. That is why heart attacks caused by Vitamin K deficiency are extremely rare, an average person takes around 70 micrograms of Vitamin K per day. Heart attacks caused by high cholesterol are far more common.
</blockquote>
<?php else: ?>
<textarea name="vitamin_k"></textarea>
<?php endif; ?>
</section>
<section>
<div>Do you consider it probable that there is some substance in plants that are commonly eaten which can slow down or counter the harmful effects of heme iron?<br/>
Smatrate li da je vjerojatno da u biljkama koje se često jedu postoji neka supstanca koja može usporiti ili poništiti štetno djelovanje hematskog željeza?</div>
<?php if ($_SERVER['REQUEST_METHOD'] == "POST"): ?>
<blockquote>There does not seem to be such a substance.<br>
Ne čini se da postoji takva substanca.</blockquote>
<?php else: ?>
<input type="radio" name="heme_iron" value="yes" id="heme_iron_yes"><label for="heme_iron_yes">Yes/Da</label> <input type="radio" name="heme_iron" value="no" id="heme_iron_no"><label for="heme_iron_no">No/Ne</label>
<?php endif; ?>
</section>
<section>
<div>Do you think that people with a serious mental illness (such as schizophrenia) should be banned from owning firearms?<br/>
Smatrate li da ljudi s ozbiljnom mentalnom bolesti (kao, recimo, šizofrenijom) ne bi smjeli posjedovati vatreno oružje?</div>
<?php if ($_SERVER['REQUEST_METHOD'] === 'POST'): ?>
<blockquote>I expect any informed person to answer no, because, aside from perhaps mild lead poisoning, there is no good evidence that any mental illness makes you more likely to become a mass shooter. And mass shooters are actually less likely to be diagnozed with schizophrenia than an average person is, although they are more likely to be diagnozed with anxiety.<br/>
Ja bih očekivao da bi bilo koja informirana osoba odgovorila ne na ovo pitanje, jer, osim možda za blago trovanje olovom, nema dobre evidencije da te ijedna mentalna bolest čini vjerojatnijim da počiniš masovnu pucnjavu. I zapravo je za počinitelje masivnih pucnjava manje vjerojatno da budu dijagnosticirani šizofrenijom nego što je za prosječnu osobu, iako je veća vjerojatnost da imaju dijagnozu anksioznog poremećaja.</blockquote>
<?php else: ?>
<input type="radio" name="carry_wapons" value="yes" id="carry_weapons_yes"><label for="carry_weapons_yes">Yes/Da</label> <input type="radio" name="carry_weapons" value="no" id="carry_weapons_no"><label for="carry_weapons_no">No/Ne</label>
<?php endif; ?>
</section>
<section><div>Smoking sterilizes the air by giving bacteria &quot;<i>mitochondrial cancer</i>&quot; (causing mitochondria inside the bacteria to divide uncontrollably until the bacterium dies).<br/>
Dim sterilizira zrak tako što kod bakterija uzrokuje &quot;<i>mitohondrijski rak</i>&quot; (uzrokuje mitohondrije u bakterijama da se nekontrolirano dijele dok bakterija ne umre).</div>
<?php if ($_SERVER['REQUEST_METHOD'] === 'POST'): ?>
<blockquote>This should be an obvious joke to anybody who has passed the 9th-grade biology coursework for two separate reasons:
<ol><li>Bacteria do not have mitochondria, in fact, most bacteria are smaller than mitochondria and mitochondria therefore would not fit in them. Mitochondria are also widely considered to have evolved from aerobic bacteria, that's called endosymbiotic hypothesis.</li>
<li>A mitochondrial cancer would not be dangerous since mitochondria have no mechanism to use the energy stored as ATP that's not produced by themselves. Unlike cancer cells which can use external glucose.</li>
</ol>
For those two reasons, that statement should be obviously false.<br/><br/>
Ovo bi trebala biti očita šala svakome tko je položio biologiju u prvom razredu srednje škole, iz dva razloga:
<ol><li>Bakterije nemaju mitohondrije, zapravo, većina je bakterija manja od mitohondrija, pa mitohondriji u većinu bakterija ne bi ni stali. Također se naširoko smatra da su mitohondriji evoluirali tako što su nastali od aerobnih bakterija, to se zove endosimbiotska hipoteza.</li>
<li>Mitohondrijski rak ne bi bio pretjerano opasan po organizam jer mitohondriji nemaju mehanizam kojim mogu koristiti energiju pohranjenu u obliku adenozin-tri-fosfata (ATP-a) koju nisu oni sami proizveli. Za razliku od stanica raka koje mogu koristiti vanjsku glukozu.</li>
</ol>
Iz ta dva razloga ta bi tvrdnja trebala biti očita neistina.
<?php else: ?>
<input type="radio" name="mitochondria" value="true" id="mitochondria_yes"><label for="mitochondria_yes">True/Istina</label> <input type="radio" name="mitochondria" value="false" id="mitochondria_no"><label for="mitochondria_no">False/Laž</label>
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
</main>
</body>
</html>