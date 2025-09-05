document.addEventListener("DOMContentLoaded", function() {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has("id")) {
    document.getElementById("assemblyCode").innerHTML =
        "Fetching the program from SourceForge...";
    const id = urlParams.get("id");
    const url = `db.php?id=${encodeURIComponent(id)}`;
    console.log(url);
    fetch(url, {redirect : "error"})
        .then((response) => {
          if (!response.ok && response.status != 404) {
            throw new Error("The server responded with error " +
                            response.status);
          }

          return response.text();
        })

        .then((data) => {
          const asm = document.getElementById("assemblyCode");
          data = data.replace("\r\n", "\n");
          document.getElementById("assemblyCode").innerText = data;
          console.log(asm.textContent);
          setUpLineNumbers();
        })

        .catch((error) => { alert(error.message); });
  }
});
