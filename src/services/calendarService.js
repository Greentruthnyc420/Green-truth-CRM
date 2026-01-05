/**
 * Calendar Service
 * Handles interactions with the Google Calendar API.
 */

export const createManagerEvent = async (activationDetails, startTime, endTime, repEmail, adminAccessToken) => {
    try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminAccessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                summary: `Activation: ${activationDetails.storeName}`,
                location: activationDetails.address,
                description: `Assigned Rep: ${repEmail}\n\nNotes: ${activationDetails.notes || 'None'}`,
                start: {
                    dateTime: startTime, // ISO format: '2023-10-25T10:00:00Z'
                },
                end: {
                    dateTime: endTime,
                },
                attendees: [
                    { email: repEmail }
                ],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 1440 }, // 24 hours before
                        { method: 'popup', minutes: 60 }   // 1 hour before
                    ]
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Google Calendar API Error:', error);
            throw new Error(error.error?.message || 'Failed to create calendar event');
        }

        const data = await response.json();
        console.log('Calendar event created successfully:', data.id);
        return data.id; // googleEventId

    } catch (error) {
        console.error('Error in createManagerEvent:', error);
        throw error;
    }
};
