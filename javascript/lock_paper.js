const CORRECT_HASH = "2f5101a71d278dda8021bb4a33932a7a95f485683abe774f565c65f171f001f7"; // SHA-256 for '비번 힌트: 예아'

async function checkPassword() {
    const input = document.getElementById("password-input").value;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex === CORRECT_HASH) {
    document.getElementById("password-modal").style.display = "none";
    const container = document.getElementById("protected-content");
    container.style.display = "flex";

    const iframe = document.createElement("iframe");
    iframe.src = "../논문경로.pdf"; // 실제 논문 경로로 수정
    iframe.width = "100%";
    iframe.height = "1000px";
    iframe.style.maxWidth = "800px";
    iframe.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
    iframe.title = "논문";

    container.appendChild(iframe);
    } else {
    document.getElementById("error-text").style.display = "block";
    }
}

document.getElementById("password-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") checkPassword();
});
  