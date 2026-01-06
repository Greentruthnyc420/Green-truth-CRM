import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// Ensure you have VITE_GEMINI_API_KEY in your .env file
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
} else {
    console.warn("Gemini API Key is missing. License extraction will not work.");
}

/**
 * Converts a File object to a GoogleGenerativeAI.Part object.
 * @param {File} file 
 * @returns {Promise<Object>}
 */
async function fileToGenerativePart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                },
            });
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Extracts the license number from a provided image file using Gemini Flash.
 * @param {File} imageFile - The uploaded license image.
 * @returns {Promise<string>} - The extracted license number or empty string.
 */
export async function extractLicenseNumber(imageFile) {
    if (!genAI) {
        throw new Error("Gemini service is not configured.");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = "Extract the cannabis license number from this image. It usually starts with OCM or similar format. Return ONLY the alphanumeric license number. Do not encompass it with markdown, do not add any explanation. If none is found, return 'NOT_FOUND'.";

        const imagePart = await fileToGenerativePart(imageFile);

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text().trim();

        if (text === 'NOT_FOUND') return '';

        // Basic cleanup locally just in case
        return text.replace(/[^a-zA-Z0-9-]/g, '');

    } catch (error) {
        console.error("Gemini Extraction Error:", error);
        throw new Error("Failed to extract license. Please type it manually.");
    }
}
