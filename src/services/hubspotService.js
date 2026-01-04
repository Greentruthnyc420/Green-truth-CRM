import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

const HUBSPOT_API_URL = "https://api.hubapi.com/crm/v3/objects/contacts";
const ACCESS_TOKEN = import.meta.env.VITE_HUBSPOT_ACCESS_TOKEN;

export async function syncLeadToHubSpot(lead) {
    if (!ACCESS_TOKEN) {
        console.error("HubSpot Access Token is missing.");
        return { success: false, error: "Missing API Key" };
    }

    try {
        // Construct HubSpot Contact Object
        const properties = {
            email: lead.email || "", // Email is primary key usually
            firstname: lead.contactPerson ? lead.contactPerson.split(" ")[0] : "",
            lastname: lead.contactPerson ? lead.contactPerson.split(" ").slice(1).join(" ") : "",
            company: lead.dispensaryName,
            // Custom fields can be mapped here if they exist in HubSpot
            // 'license_number': lead.licenseNumber 
        };

        const response = await fetch(HUBSPOT_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify({ properties })
        });

        const data = await response.json();

        if (!response.ok) {
            // Check if error is 'Contact already exists' (409)
            if (response.status === 409) {
                console.warn("Contact already exists in HubSpot (409). Marking as synced.");
                // We consider this a success for the local app state
            } else {
                throw new Error(data.message || "HubSpot API Error");
            }
        }

        // On success (or exists), update local firestore
        if (lead.id && lead.id !== 'mock-lead-id') {
            const leadRef = doc(db, "leads", lead.id);
            await updateDoc(leadRef, { syncedToHubspot: true });
        }

        return { success: true, result: data };

    } catch (error) {
        console.error("HubSpot Sync Failed:", error);
        return { success: false, error: error.toString() };
    }
}
