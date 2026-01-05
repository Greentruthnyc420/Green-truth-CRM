import { GoogleGenerativeAI } from "@google/generative-ai";

// Access the API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the Google Generative AI instance
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Generates a short, punchy sales email draft using Gemini.
 * @param {string} leadName - The name of the lead/dispensary.
 * @param {string} contactPerson - The name of the contact person.
 * @param {string[]} interests - List of products the lead is interested in.
 * @returns {Promise<{subject: string, body: string}>} - The generated subject and body.
 */
export async function generateEmailDraft(leadName, contactPerson, interests = []) {
    if (!API_KEY) {
        console.error("Gemini API Key is missing.");
        return {
            subject: "Follow up - The Green Truth",
            body: `Hi ${contactPerson || leadName},\n\nHope you're doing well. Just wanted to follow up regarding our catalog.\n\nBest,\nThe Green Truth Team`
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are a professional sales representative for "The Green Truth".
            
            Task: Write a short, punchy sales follow-up for ${contactPerson || leadName} interested in ${interests.length > 0 ? interests.join(', ') : 'our catalog'}.
            
            Constraints:
            - Plain text only (no HTML).
            - No subjects longer than 6 words.
            - Tone: Friendly, confident, not pushy.
            
            Return JSON format:
            {
                "subject": "Short Subject Line",
                "body": "The plain text email body."
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON from the response (handle potential markdown code blocks)
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

/**
 * Parses a menu document (image or PDF) using Gemini Vision to extract product data.
 * @param {string} base64Content - Base64 encoded file content
 * @param {string} mimeType - MIME type of the file (image/png, image/jpeg, application/pdf)
 * @returns {Promise<Array<{name, description, price, caseSize, thc, strainType, category}>>}
 */
export async function parseMenuDocument(base64Content, mimeType) {
    if (!API_KEY) {
        console.error("Gemini API Key is missing.");
        throw new Error("AI service not configured. Please add VITE_GEMINI_API_KEY.");
    }

    try {
        // Use gemini-1.5-flash for vision capabilities
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

        const imagePart = {
            inlineData: {
                data: base64Content,
                mimeType: mimeType
            }
        };

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

