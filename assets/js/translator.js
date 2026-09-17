class ApiTranslatorClient {
    constructor(backendUrl = "https://traductorespanolinglesviceversa.vercel.app/") {
        // Si tu frontend está en GitHub Pages y tu backend en Vercel, coloca aquí la URL completa de Vercel (ej: "https://tu-proyecto.vercel.app")
        // Si usas rutas relativas porque todo corre en el mismo servidor, déjalo vacío ("").
        this.backendUrl = backendUrl;
    }

    async _post(endpoint, data, isFormData = false) {
        const options = {
            method: "POST",
            body: isFormData ? data : JSON.stringify(data)
        };

        if (!isFormData) {
            options.headers = { "Content-Type": "application/json" };
        }

        const response = await fetch(`${this.backendUrl}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Error al procesar la solicitud en el servidor.");
        }
        return result;
    }

    async translateText(text, direction) {
        return await this._post("/api/translate-text", { text, direction });
    }

    async translateChat(message, direction) {
        return await this._post("/api/translate-chat", { message, direction });
    }

    async translateAudio(audioFile, direction) {
        const formData = new FormData();
        formData.append("audio", audioFile);
        formData.append("direction", direction);
        return await this._post("/api/translate-audio", formData, true);
    }

    async translateDocument(docFile, direction) {
        const formData = new FormData();
        formData.append("document", docFile);
        formData.append("direction", direction);
        return await this._post("/api/translate-doc", formData, true);
    }

    async translateImage(imageBase64, direction) {
        return await this._post("/api/translate-image", { image: imageBase64, direction });
    }
}