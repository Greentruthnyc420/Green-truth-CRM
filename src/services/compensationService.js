export const HOURLY_BASE = 20;
export const HOURLY_CAP = 30;
export const STORES_PER_DOLLAR = 10;
export const REP_COMMISSION_RATE = 0.02;
export const COMPANY_COMMISSION_RATE = 0.05; // Company makes 5% on gross revenue

export const MILEAGE_RATE_VEHICLE = 0.35;
export const MILEAGE_RATE_NO_VEHICLE = 0.20;
export const CLIENT_MILEAGE_RATE = 0.70;

// Pricing Tiers (2hr, 3hr, 4hr, 5hr)
export const PRICING_TIERS = {
    NYC: { 2: 120, 3: 160, 4: 200, 5: 240 },
    LI: { 2: 140, 3: 180, 4: 220, 5: 260 }, // Long Island & Downstate/Westchester
    UPSTATE: { 2: 160, 3: 200, 4: 240, 5: 280 }
};

/**
 * Returns the label for the current quarter (e.g., "Q1 2025").
 */
export function getCurrentQuarterLabel() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();
    const quarter = Math.ceil(month / 3);
    return `Q${quarter} ${year}`;
}

/**
 * Determines if a given date string/timestamp is within the current quarter.
 */
export function isInCurrentQuarter(dateInput) {
    if (!dateInput) return false;

    // Handle Firestore Timestamp or String
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(date.getTime())) return false; // Invalid date

    const now = new Date();
    const currentQ = Math.ceil((now.getMonth() + 1) / 3);
    const currentYear = now.getFullYear();

    const targetQ = Math.ceil((date.getMonth() + 1) / 3);
    const targetYear = date.getFullYear();

    return currentQ === targetQ && currentYear === targetYear;
}

/**
 * Calculates standard commission (2%)
 */
export function calculateRepCommission(salesTotal) {
    return (salesTotal || 0) * REP_COMMISSION_RATE;
}

/**
 * Calculates company "revenue" (5%)
 */
export function calculateCompanyCommission(salesTotal) {
    return (salesTotal || 0) * COMPANY_COMMISSION_RATE;
}


/**
 * Calculates reimbursement total.
 */
export function calculateReimbursement(miles, tolls, hasVehicle = true) {
    const rate = hasVehicle ? MILEAGE_RATE_VEHICLE : MILEAGE_RATE_NO_VEHICLE;
    return ((miles || 0) * rate) + (tolls || 0);
}

/**
 * Calculates the hourly rate based on active stores.
 * Starts at $20, +$1 per 10 stores, max $30.
 */
export function calculateHourlyRate(activeStoreCount) {
    const count = Math.max(0, activeStoreCount || 0);
    const increase = Math.floor(count / STORES_PER_DOLLAR);
    return Math.min(HOURLY_CAP, HOURLY_BASE + increase);
}

/**
 * Checks if the current store count triggers a new milestone bonus.
 * Returns the bonus amount if strictly hit (e.g. count is exactly 10, 20...), otherwise 0.
 * Used for animation triggers.
 */
export function getMilestoneBonus(activeStoreCount) {
    const count = activeStoreCount || 0;
    if (count > 0 && count <= 100 && count % 10 === 0) {
        return count * 10; // 10 -> 100, 20 -> 200, etc.
    }
    return 0;
}

/**
 * Calculates total accumulated bonuses based on store count.
 * Sums up 100 + 200 + ... for each passed milestone.
 */
export function calculateTotalLifetimeBonuses(activeStoreCount) {
    let total = 0;
    const count = Math.min(activeStoreCount || 0, 100); // Cap calc at 100 stores for bonus logic
    // Milestones: 10, 20, 30...
    for (let m = 10; m <= count; m += 10) {
        total += m * 10;
    }
    return total;
}

/**
 * Calculates the total revenue invoiced to the client for a shift.
 * Based on Region + Duration + Mileage + Tolls.
 */
export function calculateShiftClientRevenue(shift) {
    const hours = parseFloat(shift.hoursWorked) || 0;
    const region = shift.region || 'NYC'; // Default to NYC if missing

    // Determine closest billable block (2, 3, 4, 5)
    // Round to nearest integer for lookup, clamp between 2 and 5
    let billableHours = Math.round(hours);
    if (billableHours < 2) billableHours = 2;
    if (billableHours > 5) billableHours = 5;

    let baseRate = 0;
    if (PRICING_TIERS[region]) {
        baseRate = PRICING_TIERS[region][billableHours] || PRICING_TIERS[region][5]; // Fallback to max
    } else {
        baseRate = PRICING_TIERS.NYC[billableHours]; // Fallback
    }

    const mileageCharge = (parseFloat(shift.milesTraveled) || 0) * CLIENT_MILEAGE_RATE;
    const tollCharge = parseFloat(shift.tollAmount) || 0; // Reimbursed at cost

    return baseRate + mileageCharge + tollCharge;
}

/**
 * Calculates the NET PROFIT for a single shift.
 * Revenue (Client) - Expenses (Rep Wage, Reimbursement).
 */
export function calculateShiftNetProfit(shift, repHourlyRate = 20) {
    const revenue = calculateShiftClientRevenue(shift);

    const wageExpense = (parseFloat(shift.hoursWorked) || 0) * repHourlyRate;
    const reimbursementExpense = calculateReimbursement(
        parseFloat(shift.milesTraveled),
        parseFloat(shift.tollAmount),
        shift.hasVehicle !== false // Default true
    );

    return revenue - (wageExpense + reimbursementExpense);
}

/**
 * King of the Crop Scoring Algorithm
 * Calculates rep score based on leads, sales, and revenue.
 */
export function calculateRepScore(leads) {
    let score = 0.0;

    leads.forEach(lead => {
        // Quarterly Reset Check
        // Use created date (createdAt? date?) or soldDate depending on the event.
        // For general "Activity", we use `lead.date`.
        // For "Sales", we use `lead.soldDate || lead.date`.
        // To keep it simple: Use `lead.date` (creation) for activity points,
        // and check `soldDate` for sales points?
        // Project Spec says: "Update ... calculateRepScore... check isInCurrentQuarter(lead.date)"

        let effectiveDate = lead.date || lead.createdAt;
        // If sold, maybe the sale happened in Q2 but lead created in Q1?
        // Usually points count towards the quarter the interaction happened.
        // If status is 'Sold', we might prioritize soldDate.
        if (lead.status === 'Sold' || lead.status === 'Sale') {
            effectiveDate = lead.soldDate || lead.date;
        }

        if (!isInCurrentQuarter(effectiveDate)) return; // Skip old data

        // Activity Log: +1.0 Point for every Document
        score += 1.0;

        // Closing Bonus logic
        if (lead.status === 'Sold' || lead.status === 'Sale') { // Handle both terminologies if strictly needed
            if (lead.saleType === 'New Customer') {
                score += 5.0;
            } else if (lead.saleType === 'Re-order') {
                score += 3.0;
            }

            // Revenue Multiplier: Add revenue / 100
            const revenue = parseFloat(lead.amount || lead.potentialValue || 0); // Check 'amount' (sales schema) or 'potentialValue' (lead schema)
            score += (revenue / 100);
        }
    });

    return score;
}

/**
 * Financial Aggregation Logic
 * Groups totals by Rep and creates system-wide aggregates.
 */
export function getFinancialTotals(leads) {
    let totalLifetimeRevenue = 0;
    let totalLifetimeCommissions = 0;
    let biWeeklyRevenue = 0;
    let unpaidCommissionsByRep = {};

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    leads.forEach(lead => {
        if (lead.status === 'Sold' || lead.status === 'Sale') {
            const revenue = parseFloat(lead.amount || lead.potentialValue || 0);
            const commission = parseFloat(lead.commissionEarned || (revenue * REP_COMMISSION_RATE) || 0);

            totalLifetimeRevenue += revenue;
            totalLifetimeCommissions += commission;

            // Bi-Weekly Check
            // Assuming lead.date or lead.soldDate is a Timestamp or parsable string
            const soldDateRaw = lead.soldDate || lead.date;
            if (soldDateRaw) {
                // Handle Firestore Timestamp .toDate() or string constructor
                const soldDate = soldDateRaw.toDate ? soldDateRaw.toDate() : new Date(soldDateRaw);
                if (soldDate >= twoWeeksAgo) {
                    biWeeklyRevenue += revenue;
                }
            }

            // Unpaid Commissions
            if (!lead.paidStatus) {
                const repId = lead.userId || lead.repId || 'Unknown';
                if (!unpaidCommissionsByRep[repId]) {
                    unpaidCommissionsByRep[repId] = 0;
                }
                unpaidCommissionsByRep[repId] += commission;
            }
        }
    });

    return {
        totalLifetimeRevenue,
        totalLifetimeCommissions,
        biWeeklyRevenue,
        unpaidCommissionsByRep
    };
}

/**
 * Determines if a store is "Active" (Commission-Generating) based on Space Poppers Rule.
 * 
 * Rule:
 * - If store carries any brand OTHER than "Space Poppers", it is ALWAYS Active.
 * - If store ONLY carries "Space Poppers", it is Active only for 9 months from first sale.
 */
export function isStoreActive(lead) {
    if (!lead || !lead.activeBrands || lead.activeBrands.length === 0) {
        // Fallback: If no brands listed but status is 'Sold', assume active (old data compatibility)
        // OR return false if we want to be strict. Let's assume Active for legacy data unless proven otherwise.
        // Actually, if status is 'Sold', let's default to true for safety, or check date?
        // Let's being safe: True if sold.
        return lead.status === 'Sold' || lead.status === 'Sale';
    }

    const { activeBrands } = lead;

    // 1. Check for Non-Space Poppers brands
    // Normalize to handle variations like "Space Poppers!" or case sensitivity
    const hasOtherBrands = activeBrands.some(brand => {
        const normalized = brand.toLowerCase().replace(/[^a-z0-9]/g, ''); // remove punctuation
        return !normalized.includes('spacepopper');
    });

    if (hasOtherBrands) return true; // Indefinitely Active

    // 2. Space Poppers Only Logic
    const toDate = (d) => d && d.toDate ? d.toDate() : new Date(d);

    // Calculate Expiration Date (First Sale + 9 Months)
    const firstSale = toDate(lead.firstSaleDate || lead.soldDate || lead.createdAt);
    if (isNaN(firstSale.getTime())) return true; // Fallback if no valid date

    const expirationDate = new Date(firstSale);
    expirationDate.setMonth(expirationDate.getMonth() + 9);

    // Compare with current time
    const now = new Date();
    return now <= expirationDate;
}
