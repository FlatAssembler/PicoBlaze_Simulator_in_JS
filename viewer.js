document.addEventListener("DOMContentLoaded", function() {
    const assemblyCodeElement = document.getElementById("assemblyCode");
    const programCode = "<?php echo htmlspecialchars($programCode); ?>";
    assemblyCodeElement.textContent = programCode;
});
