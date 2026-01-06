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
        throw new Error("Gemini service is not configured. Please check VITE_GEMINI_API_KEY.");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = "Extract the cannabis license number from this image. It usually starts with OCM or similar format. Return ONLY the alphanumeric license number. Do not encompass it with markdown, do not add any explanation. If none is found, return 'NOT_FOUND'.";

        const imagePart = await fileToGenerativePart(imageFile);

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text().trim();

        if (text === 'NOT_FOUND' || text.length < 3) return '';

        // Basic cleanup locally just in case
        return text.replace(/[^a-zA-Z0-9-]/g, '');

    } catch (error) {
        console.error("Gemini Extraction Error:", error);
        throw new Error("Failed to extract license. Please type it manually.");
    }
}

/**
 * Parses a menu document (image or PDF) using Gemini Vision to extract product data.
 * @param {File} file - The menu file (Image or PDF)
 * @returns {Promise<Array<{name, description, price, caseSize, thc, strainType, category}>>}
 */
export async function parseMenuDocument(file) {
    if (!genAI) {
        console.error("Gemini API Key is missing.");
        throw new Error("AI service not configured. Please add VITE_GEMINI_API_KEY.");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are analyzing a cannabis brand menu/price list document.

Task: Extract ALL products from this menu and return structured data.

For each product, extract:
- name: Product name (required)
- description: Brief description if available
- price: Unit price as a number (0 if not found)
- caseSize: Units per case/pack (1 if not specified)
- thc: THC percentage as string (e.g. "24%" or empty if not listed)
- strainType: "Indica", "Sativa", or "Hybrid" (default to "Hybrid" if unclear)
- category: One of "Flower", "Pre-Roll", "Vape", "Concentrate", "Edible" (best guess based on product type)

Return ONLY valid JSON array format:
[
  {
    "name": "Product Name",
    "description": "Brief description",
    "price": 29.99,
    "caseSize": 10,
    "thc": "24%",
    "strainType": "Hybrid",
    "category": "Flower"
  }
]

If you cannot parse any products, return an empty array: []
Do not include any text outside the JSON array.
        `;

        const imagePart = await fileToGenerativePart(file);

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Parse JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const products = JSON.parse(jsonMatch[0]);
            // Validate and clean up each product
            return products.map((p, index) => ({
                id: `parsed-${Date.now()}-${index}`,
                name: p.name || 'Unknown Product',
                description: p.description || '',
                price: parseFloat(p.price) || 0,
                caseSize: parseInt(p.caseSize) || 1,
                thc: p.thc || '',
                strainType: ['Indica', 'Sativa', 'Hybrid'].includes(p.strainType) ? p.strainType : 'Hybrid',
                category: ['Flower', 'Pre-Roll', 'Vape', 'Concentrate', 'Edible'].includes(p.category) ? p.category : 'Flower',
                inStock: true
            }));
        }

        console.warn("Could not parse products from AI response:", text);
        return [];
    } catch (error) {
        console.error("Error parsing menu document:", error);
        throw error;
    }
}

/**
 * Generates a short, punchy sales email draft using Gemini.
 */
export async function generateEmailDraft(leadName, contactPerson, interests = []) {
    if (!genAI) {
        return {
            subject: "Follow up - The Green Truth",
            body: `Hi ${contactPerson || leadName},\n\nHope you're doing well. Just wanted to follow up regarding our catalog.\n\nBest,\nThe Green Truth Team`
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are a professional sales representative for "The Green Truth", a premium cannabis distribution and branding company in New York.
            
            Task: Write a short, punchy sales follow-up email for ${contactPerson || leadName} who is interested in ${interests.length > 0 ? interests.join(', ') : 'our partner catalog'}.
            
            Constraints:
            - Plain text only (no HTML).
            - No subject lines longer than 6 words.
            - Tone: Professional, confident, friendly, and relationship-driven.
            - Keep it under 100 words.
            
            Return JSON format:
            {
                "subject": "Short Subject Line",
                "body": "The plain text email body."
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            return {
                subject: `Follow up: ${leadName}`,
                body: text
            };
        }
    } catch (error) {
        console.error("Error generating email draft:", error);
        return {
            subject: "Re: The Green Truth Catalog",
            body: `Hi ${contactPerson || leadName},\n\nI wanted to circle back on the samples we discussed. Are you still interested in ${interests.join(', ')}?\n\nLet me know when you have a moment to chat.`
        };
    }
}
