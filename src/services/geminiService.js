import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// Ensure you have VITE_GEMINI_API_KEY in your .env file
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3-flash-preview"; // Gemini 3 Flash - newest & most powerful

let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
} else {
    console.warn("Gemini API Key is missing. License extraction will not work.");
}

/**
 * Retry wrapper with exponential backoff for rate limiting
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts (default 3)
 * @param {number} initialDelay - Initial delay in ms (default 2000)
 */
async function withRetry(fn, maxRetries = 3, initialDelay = 2000) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const isRateLimited = error?.message?.includes('429') ||
                error?.message?.toLowerCase().includes('rate') ||
                error?.message?.toLowerCase().includes('quota') ||
                error?.status === 429;

            if (!isRateLimited || attempt === maxRetries) {
                throw error;
            }

            const delay = initialDelay * Math.pow(2, attempt);
            console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
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

    return withRetry(async () => {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const prompt = "Extract the cannabis license number from this image. It usually starts with OCM or similar format. Return ONLY the alphanumeric license number. Do not encompass it with markdown, do not add any explanation. If none is found, return 'NOT_FOUND'.";

        const imagePart = await fileToGenerativePart(imageFile);

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text().trim();

        if (text === 'NOT_FOUND' || text.length < 3) return '';

        // Basic cleanup locally just in case
        return text.replace(/[^a-zA-Z0-9-]/g, '');
    });
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

    return withRetry(async () => {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

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
    });
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

    return withRetry(async () => {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

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
    }).catch(error => {
        console.error("Error generating email draft:", error);
        return {
            subject: "Re: The Green Truth Catalog",
            body: `Hi ${contactPerson || leadName},\n\nI wanted to circle back on the samples we discussed. Are you still interested in ${interests.join(', ')}?\n\nLet me know when you have a moment to chat.`
        };
    });
}

/**
 * Generates a rebuttal for sales objections in the compensation portal.
 * @param {string} objection - The customer objection to address
 * @returns {Promise<string>} - A persuasive rebuttal
 */
export async function generateCompensationRebuttal(objection) {
    if (!genAI) {
        return "AI service not configured. Please try again later.";
    }

    return withRetry(async () => {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const systemPrompt = `You are a top-tier sales coach for a cannabis brand 'The Green Truth NYC'. 
        The user (a Cannabis Consultant) will give you an objection from a dispensary owner. 
        Provide a concise (max 3 sentences), professional, and persuasive rebuttal to help close the deal. 
        Tone: Confident but respectful.`;

        const result = await model.generateContent({
            contents: [{ parts: [{ text: objection }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        });

        const response = await result.response;
        return response.text();
    }).catch(error => {
        console.error("Error generating rebuttal:", error);
        return "Unable to generate rebuttal. Please try again.";
    });
}

/**
 * Answers payroll and compensation questions based on the handbook rules.
 * @param {string} question - The user's question about compensation
 * @returns {Promise<string>} - An answer based on company rules
 */
export async function generatePayrollAnswer(question) {
    if (!genAI) {
        return "AI service not configured. Please try again later.";
    }

    return withRetry(async () => {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const compRules = `
            RULES:
            1. Hourly Rate: Starts at $20/hr. Increases by $1 for every 10 active accounts. Max cap is $30/hr. Paid Biweekly.
            2. Commission: 2% of Net Sales. Paid Quarterly.
            3. Milestone Bonuses: Cumulative. $100 bonus for every 10 accounts achieved. (e.g. 10 accts = $100, 20 accts = $200 more). One-time only per milestone. Paid Quarterly.
            4. Mileage: $0.35/mile for personal vehicle. $0.20/mile for public transit.
            5. Termination: If you leave, you ARE paid for commissions earned in your final quarter (Termination Protection).
            6. Duties: Must submit exterior photo, video walkthrough, and daily logs for payment.
            7. Mandatory Meeting: Weekly team sync participation is required.
        `;

        const systemPrompt = `You are the 'Payroll Genius' for The Green Truth NYC. 
        Answer the user's question based STRICTLY on the following rules. 
        Keep answers short and friendly. \n\n ${compRules}`;

        const result = await model.generateContent({
            contents: [{ parts: [{ text: question }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        });

        const response = await result.response;
        return response.text();
    }).catch(error => {
        console.error("Error answering payroll question:", error);
        return "Unable to answer your question. Please try again.";
    });
}

/**
 * Generates a motivational message for quarterly earnings forecast.
 * @param {number} accounts - Target account count
 * @param {number} sales - Estimated sales
 * @param {number} commission - Calculated commission
 * @param {number} bonus - Calculated bonuses
 * @param {number} total - Total quarterly payout
 * @returns {Promise<string>} - A motivational message
 */
export async function generateMotivation(accounts, sales, commission, bonus, total) {
    if (!genAI) {
        return `🚀 Amazing! $${total.toFixed(2)} quarterly potential! Keep crushing it!`;
    }

    return withRetry(async () => {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const prompt = `
            A sales rep just forecasted their quarterly earnings:
            - Target Accounts: ${accounts}
            - Est. Sales: $${sales}
            - Commission: $${commission.toFixed(2)}
            - Cumulative Bonuses: $${bonus.toFixed(2)}
            - Total Quarterly Payout: $${total.toFixed(2)}
            
            Write a short, high-energy, emoji-filled motivational message (max 20 words) congratulating them on this specific total payout. Emphasize the bonus accumulation.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }).catch(error => {
        console.error("Error generating motivation:", error);
        return `🚀 Amazing! $${total.toFixed(2)} quarterly potential! Keep crushing it!`;
    });
}

/**
 * Generates AI responses for the Sales Rep chatbot about products and pricing.
 * @param {string} question - The user's question
 * @param {Array} productCatalog - The product catalog data
 * @param {Array} conversationHistory - Previous messages for context [{role: 'user'|'assistant', content: string}]
 * @returns {Promise<string>} - AI response
 */
export async function generateSalesRepResponse(question, productCatalog, conversationHistory = []) {
    if (!genAI) {
        return "AI service not configured. Please check your API key.";
    }

    // Build a concise product summary for context
    const catalogSummary = productCatalog.map(brand => {
        const productList = brand.products.slice(0, 5).map(p =>
            `${p.name}: $${p.price} (${p.caseSize}ct)`
        ).join(', ');
        return `**${brand.name}**: ${productList}${brand.products.length > 5 ? ` +${brand.products.length - 5} more` : ''}`;
    }).join('\n');

    return withRetry(async () => {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const systemPrompt = `You are a helpful AI Sales Assistant for "The Green Truth NYC", a cannabis distribution company.

You help Sales Reps with:
- Product information and pricing
- Best-selling products and recommendations
- New product arrivals
- Inventory and stock status
- Brand comparisons

PRODUCT CATALOG SUMMARY:
${catalogSummary}

Guidelines:
- Be concise and helpful (max 100 words)
- Use emojis sparingly for friendliness
- If asked about prices, be specific
- Recommend products when appropriate
- If unsure, say so honestly
- Remember context from previous messages in this conversation`;

        // Build conversation content with history
        const contents = conversationHistory.slice(-6).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
        contents.push({ role: 'user', parts: [{ text: question }] });

        const result = await model.generateContent({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] }
        });

        const response = await result.response;
        return response.text();
    }).catch(error => {
        console.error("Error in Sales Rep chatbot:", error);
        return "I'm having trouble right now. Please try again in a moment!";
    });
}

/**
 * Generates AI responses for the Dispensary chatbot about pricing, deals, and orders.
 * @param {string} question - The user's question
 * @param {Array} productCatalog - The product catalog data
 * @returns {Promise<string>} - AI response
 */
export async function generateDispensaryResponse(question, productCatalog) {
    if (!genAI) {
        return "AI service not configured. Please check your API key.";
    }

    // Build product and pricing summary
    const catalogSummary = productCatalog.map(brand => {
        const priceRange = brand.products.length > 0
            ? `$${Math.min(...brand.products.map(p => p.price)).toFixed(2)} - $${Math.max(...brand.products.map(p => p.price)).toFixed(2)}`
            : 'N/A';
        const minOrder = brand.minimumOrder?.value ? `$${brand.minimumOrder.value} min` : 'No minimum';
        return `**${brand.name}**: ${brand.products.length} products, ${priceRange}, ${minOrder}`;
    }).join('\n');

    return withRetry(async () => {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const systemPrompt = `You are the ordering assistant for "The Green Truth NYC", a cannabis wholesaler serving dispensaries.

You help dispensary owners with:
- Product pricing and availability
- Bulk discount information
- Cash-on-delivery (COD) deals
- Minimum order requirements
- Brand comparisons
- Placing orders

CURRENT DEALS:
- Bulk orders over $2,000: 5% discount
- Cash on Delivery: Additional 3% discount
- First-time orders: Free shipping

PRODUCT CATALOG:
${catalogSummary}

Guidelines:
- Be professional and helpful (max 100 words)
- Mention deals when relevant
- Always confirm minimum order requirements
- Encourage bulk + COD for best savings
- If unsure about inventory, recommend contacting sales rep`;

        const result = await model.generateContent({
            contents: [{ parts: [{ text: question }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        });

        const response = await result.response;
        return response.text();
    }).catch(error => {
        console.error("Error in Dispensary chatbot:", error);
        return "I'm having trouble right now. Please try again in a moment!";
    });
}

/**
 * Generates AI responses for the Brand/Processor chatbot about analytics, sales, and activations.
 * @param {string} question - The user's question
 * @param {Object} brandContext - Brand analytics and data context
 * @param {Array} conversationHistory - Previous messages for context [{role: 'user'|'assistant', content: string}]
 * @returns {Promise<string>} - AI response
 */
export async function generateBrandResponse(question, brandContext, conversationHistory = []) {
    if (!genAI) {
        return "AI service not configured. Please check your API key.";
    }

    // Build context summary from brand data
    const contextSummary = `
BRAND: ${brandContext.brandName || 'Your Brand'}

KEY METRICS:
- Total Revenue: $${(brandContext.totalRevenue || 0).toLocaleString()}
- Total Orders: ${brandContext.totalOrders || 0}
- Units Sold: ${(brandContext.unitsSold || 0).toLocaleString()}
- Store Reach: ${brandContext.storeReach || 0} dispensaries
- Outstanding Invoices: $${(brandContext.outstandingInvoices || 0).toLocaleString()}
${brandContext.monthOverMonthGrowth ? `- Month-over-Month Growth: ${brandContext.monthOverMonthGrowth}` : ''}

TOP SELLING PRODUCTS:
${brandContext.topProducts?.length > 0 ? brandContext.topProducts.map((p, i) => `${i + 1}. ${typeof p === 'string' ? p : p.name}`).join('\n') : 'No product data available'}

UPCOMING ACTIVATIONS:
${brandContext.upcomingActivations?.length > 0
            ? brandContext.upcomingActivations.slice(0, 5).map(a =>
                `- ${a.date || 'TBD'}: ${a.dispensaryName || a.store || 'Unknown Store'} (${a.repName || a.rep || 'Rep TBD'})`
            ).join('\n')
            : 'No upcoming activations scheduled'}

RECENT TRENDS:
${brandContext.recentTrends || 'No trend data available'}
    `.trim();

    return withRetry(async () => {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const systemPrompt = `You are the Brand Analytics Assistant for "The Green Truth NYC", a cannabis distribution company.

You help brand owners and processors understand their business performance:
- Sales and revenue analytics
- Order trends and patterns
- Upcoming activations and pop-ups
- Store distribution and reach
- Product performance
- Invoice status

${contextSummary}

Guidelines:
- Be insightful and data-driven (max 150 words)
- Reference specific numbers from the data when relevant
- Provide actionable insights when possible
- Use emojis sparingly for friendliness
- If asked about data not available, say so honestly
- Encourage scheduling more activations if store reach is low
- Highlight positive trends to motivate
- Remember context from previous messages in this conversation`;

        // Build conversation content with history (last 6 messages for context)
        const contents = conversationHistory.slice(-6).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
        contents.push({ role: 'user', parts: [{ text: question }] });

        const result = await model.generateContent({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] }
        });

        const response = await result.response;
        return response.text();
    }).catch(error => {
        console.error("Error in Brand chatbot:", error);
        return "I'm having trouble right now. Please try again in a moment!";
    });
}
