const btn = document.getElementById("shareButton");

btn.addEventListener("click", (e) => {
  console.log("====\nSaving the program====\n");
  saveAssemblyCode();
});

function saveAssemblyCode() {
  const assemblyCode = document.getElementById("assemblyCode").innerText;

  const formData = new FormData();
  formData.append("code", assemblyCode);

  fetch("db.php", {method : "POST", body : formData})
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        return response.text();
      })

      .then((data) => {
        // data is ?id=int
        const shareURL =
            `${new URL(window.location.href).origin}/PicoBlaze.html${data}`;
        document.getElementById("shareURL").innerText = shareURL;
        document.getElementById("uploadSuccessfulMessage").style.display =
            "block";
      })

      .catch((error) => { alert(error); });
}

function copyShareURLToClipboard() {
  const shareURL = document.getElementById("shareURL").innerText;
  if (!navigator.clipboard) {
    alert(
        "Your browser, for some reason, doesn't let JavaScript access the clipboard. You will need to copy the URL manually.");
    return;
  }
  navigator.clipboard.writeText(shareURL)
      .then(() => { alert("The URL is successfully copied!"); })
      .catch(
          () => {alert(
              "Copying the URL to clipboard didn't succeed. You will need to copy the URL manually.")});
}
