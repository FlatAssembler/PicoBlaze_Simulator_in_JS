const btn = document.getElementById("shareButton")

btn.addEventListener("click", (e) => {
    console.log("====\nSaving the program====\n")
    saveAssemblyCode()
})

function saveAssemblyCode() {
    const assemblyCode = document.getElementById("assemblyCode").textContent;

    const formData = new FormData();
    formData.append('code', assemblyCode);

    fetch('db.php', {
        method: 'POST',
        body: formData
    })

    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })

    .then(data => {
        console.log(data);
    })

    .catch(error => {
        console.error('Error:', error);
    });
}