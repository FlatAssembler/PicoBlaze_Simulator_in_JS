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
          document.getElementById("deleteTheProgram").style.display = "grid";
          document.getElementById("place_in_the_button_for_id").innerHTML =
              urlParams.get("id");
          setupLayout();
          document.getElementById("deleteTheProgramButton").onclick = () => {
            fetch("deleteTheProgram.php", {
              method : "POST",
              redirect : "error",
              body : new URLSearchParams({
                id : urlParams.get("id"),
                password : document.getElementById("input_password").value
              })
            })
                .then((response) => { return response.text(); })
                .then(
                    (data) => { alert("The server responded with: " + data); })
                .catch((error) => { alert(error.message); });
          };
        })

        .catch((error) => {
          document.getElementById("assemblyCode").innerHTML =
              `;Unfortunately, fetching the example
;program "${id}" from SourceForge failed.
;No worries, you can still select one of
;the example programs to fetch from
;GitHub.
`;
          setUpLineNumbers();
          alert(error.message);
        });
  }
});
