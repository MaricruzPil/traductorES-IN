class ApiTranslatorClient {
    constructor(backendUrl = "https://traductorespanolinglesviceversa.vercel.app") { // <--- Reemplaza con tu URL real de Vercel sin barra al final
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
        
        // Validamos si la respuesta es JSON antes de parsearla
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text();
            throw new Error(`El servidor no devolvió JSON (Código ${response.status}). Revisa la consola o CORS.`);
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Error al procesar la solicitud en el servidor.");
        }
        return result;
    }

    // Métodos restantes...
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