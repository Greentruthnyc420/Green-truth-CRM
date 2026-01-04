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
