// Instanciamos nuestra clase de traducción (puedes cambiar la URL si publicas en dominios separados)
const translator = new ApiTranslatorClient("https://traductorespanolinglesviceversa.vercel.app");

document.addEventListener("DOMContentLoaded", () => {
    const globalDirection = document.getElementById("globalDirection");

    // --- 1. MÓDULO CHAT ---
    const chatInput = document.getElementById("chatInput");
    const sendChatBtn = document.getElementById("sendChatBtn");
    const chatMessages = document.getElementById("chatMessages");

    async function handleChat() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Limpiar mensaje inicial si existe
        if (chatMessages.querySelector(".text-muted")) {
            chatMessages.innerHTML = "";
        }

        // Agregar mensaje del usuario a la vista
        chatMessages.innerHTML += `
            <div class="card p-2 mb-2 bg-light shadow-sm ms-auto" style="width: fit-content; max-width: 75%;">
                <small class="text-muted fw-bold">Original:</small>
                <div>${text}</div>
                <hr class="my-1">
                <small class="text-success fw-bold">Traducción (${globalDirection.value}):</small>
                <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
            </div>`;
        
        chatInput.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;
        const lastCard = chatMessages.lastElementChild;

        try {
            const res = await translator.translateChat(text, globalDirection.value);
            lastCard.querySelector(".spinner-border").remove();
            lastCard.insertAdjacentHTML("beforeend", `<div>${res.translation}</div>`);
        } catch (err) {
            lastCard.querySelector(".spinner-border").remove();
            lastCard.insertAdjacentHTML("beforeend", `<div class="text-danger">Error: ${err.message}</div>`);
        }
    }

    sendChatBtn.addEventListener("click", handleChat);
    chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") handleChat(); });

    // --- 2. MÓDULO AUDIO ---
    const processAudioBtn = document.getElementById("processAudioBtn");
    const audioFile = document.getElementById("audioFile");
    const audioLoading = document.getElementById("audioLoading");
    const audioOriginal = document.getElementById("audioOriginal");
    const audioTranslation = document.getElementById("audioTranslation");

    processAudioBtn.addEventListener("click", async () => {
        if (!audioFile.files[0]) return alert("Selecciona un archivo de audio primero.");
        audioLoading.classList.remove("d-none");
        audioOriginal.value = "";
        audioTranslation.value = "";

        try {
            const res = await translator.translateAudio(audioFile.files[0], globalDirection.value);
            audioOriginal.value = res.original;
            audioTranslation.value = res.translation;
        } catch (err) {
            alert(err.message);
        } finally {
            audioLoading.classList.add("d-none");
        }
    });

    // --- 3. MÓDULO DOCUMENTOS ---
    const processDocBtn = document.getElementById("processDocBtn");
    const docFile = document.getElementById("docFile");
    const docLoading = document.getElementById("docLoading");
    const docOriginal = document.getElementById("docOriginal");
    const docTranslation = document.getElementById("docTranslation");

    processDocBtn.addEventListener("click", async () => {
        if (!docFile.files[0]) return alert("Selecciona un documento (PDF, Word o TXT).");
        docLoading.classList.remove("d-none");
        docOriginal.value = "";
        docTranslation.value = "";

        try {
            const res = await translator.translateDocument(docFile.files[0], globalDirection.value);
            docOriginal.value = res.original;
            docTranslation.value = res.translation;
        } catch (err) {
            alert(err.message);
        } finally {
            docLoading.classList.add("d-none");
        }
    });

    // --- 4. MÓDULO IMÁGENES ---
    const imageFile = document.getElementById("imageFile");
    const imagePreview = document.getElementById("imagePreview");
    const processImageBtn = document.getElementById("processImageBtn");
    const imageLoading = document.getElementById("imageLoading");
    const imageResult = document.getElementById("imageResult");
    let base64Image = "";

    imageFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                base64Image = uploadEvent.target.result.split(",")[1]; // Remover prefijo data:image/...
                imagePreview.src = uploadEvent.target.result;
                imagePreview.classList.remove("d-none");
            };
            reader.readAsDataURL(file);
        }
    });

    processImageBtn.addEventListener("click", async () => {
        if (!base64Image) return alert("Sube una imagen primero.");
        imageLoading.classList.remove("d-none");
        imageResult.innerHTML = "Analizando imagen...";

        try {
            const res = await translator.translateImage(base64Image, globalDirection.value);
            imageResult.innerHTML = `<p class="mb-0">${res.translation}</p>`;
        } catch (err) {
            imageResult.innerHTML = `<span class="text-danger">Error: ${err.message}</span>`;
        } finally {
            imageLoading.classList.add("d-none");
        }
    });
});