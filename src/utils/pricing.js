
// Official Agency Pricing Sheet
export const PRICING_TIERS = {
    'NYC': { 2: 120, 3: 160, 4: 200, 5: 240 },
    'LI': { 2: 140, 3: 180, 4: 220, 5: 260 },
    'UPSTATE': { 2: 160, 3: 200, 4: 240, 5: 280 }
};

export const MILEAGE_RATE = 0.725;

export const calculateAgencyShiftCost = (shift) => {
    const duration = Math.max(2, Math.round(parseFloat(shift.hoursWorked) || 0)); // Minimum 2 hours
    const regionRaw = (shift.region || 'NYC').toUpperCase();

    // Normalize region
    let region = 'NYC';
    if (regionRaw.includes('LI') || regionRaw.includes('DOWNSTATE') || regionRaw.includes('WESTCHESTER')) region = 'LI';
    if (regionRaw.includes('UPSTATE')) region = 'UPSTATE';

    const tiers = PRICING_TIERS[region] || PRICING_TIERS['NYC'];

    // Base Fee Calculation
    let baseFee = 0;
    if (duration <= 2) baseFee = tiers[2];
    else if (duration <= 3) baseFee = tiers[3];
    else if (duration <= 4) baseFee = tiers[4];
    else if (duration <= 5) baseFee = tiers[5];
    else {
        // Extrapolate for > 5 hours (assume $40/hr pattern from sheet)
        const extraHours = duration - 5;
        baseFee = tiers[5] + (extraHours * 40);
    }

    // Agency Mileage Rate: $0.725/mile (round up to nearest penny)
    const mileageCost = Math.ceil((parseFloat(shift.milesTraveled) || 0) * MILEAGE_RATE * 100) / 100;

    // Tolls (At Cost)
    const tollsCost = parseFloat(shift.tollAmount) || 0;

    return baseFee + mileageCost + tollsCost;
};
