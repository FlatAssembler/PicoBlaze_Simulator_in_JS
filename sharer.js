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
        const message = "Share URL: ";
        const shareURL =
            `${new URL(window.location.href).origin}/PicoBlaze.html${data}`;
        if (/WebPositive/.test(navigator.userAgent))
          // WebPositive seems not to support the "prompt" directive.
          alert(message + shareURL);
        else
          prompt(message, shareURL);
      })

      .catch((error) => { console.error(error); });
}
