import { db } from "../firebase";
import {
    doc,
    updateDoc,
    increment,
    addDoc,
    collection,
    getDoc,
    serverTimestamp,
    arrayUnion
} from "firebase/firestore";

/**
 * Ensures 3-decimal precision for all point calculations.
 * Example: 1.5025 -> 1.503
 */
export const roundToThree = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 1000) / 1000;
};

interface PointsBreakdown {
    revenuePoints: number;
    brandPoints: number;
    totalPoints: number;
}

/**
 * Calculates points for an order based on revenue and brand history.
 * - Revenue: 1 point per $100 (3 decimal precision)
 * - Re-order: 3.000 pts per brand
 * - New Placement: 5.000 pts per brand
 */
export const calculateOrderPoints = (
    orderAmount: number,
    orderBrandIds: string[],
    storePurchasedBrandIds: string[] = []
): PointsBreakdown => {
    // 1. Revenue Calculation
    const revenuePoints = roundToThree(orderAmount / 100);

    // 2. Brand Logic
    let brandPoints = 0;
    orderBrandIds.forEach(brandId => {
        if (storePurchasedBrandIds.includes(brandId)) {
            brandPoints += 3.000;
        } else {
            brandPoints += 5.000;
        }
    });

    return {
        revenuePoints,
        brandPoints: roundToThree(brandPoints),
        totalPoints: roundToThree(revenuePoints + brandPoints)
    };
};

/**
 * Awards 1.000 point to a rep for a new lead.
 */
export const awardLeadPoints = async (userId: string, leadId: string) => {
    try {
        const points = 1.000;
        const userRef = doc(db, "users", userId);

        // Update User Totals
        await updateDoc(userRef, {
            lifetimePoints: increment(points),
            currentMonthPoints: increment(points),
            updatedAt: serverTimestamp()
        });

        // Log history
        await addDoc(collection(db, "points_history"), {
            userId,
            action: 'new_lead',
            referenceId: leadId,
            pointsEarned: points,
            breakdown: { base: points },
            timestamp: serverTimestamp()
        });

        return points;
    } catch (error) {
        console.error("Error awarding lead points:", error);
        throw error;
    }
};

/**
 * Orchestrates the points awarding for a sale/order.
 */
export const awardOrderPoints = async (
    userId: string,
    dispensaryId: string,
    orderAmount: number,
    orderBrandIds: string[]
) => {
    try {
        // 1. Fetch Store History
        const storeRef = doc(db, "dispensaries", dispensaryId);
        const storeSnap = await getDoc(storeRef);
        const storeData = storeSnap.exists() ? storeSnap.data() : { purchasedBrandIds: [] };
        const purchasedBrandIds = storeData.purchasedBrandIds || [];

        // 2. Calculate
        const breakdown = calculateOrderPoints(orderAmount, orderBrandIds, purchasedBrandIds);

        // 3. Update User Totals
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            lifetimePoints: increment(breakdown.totalPoints),
            currentMonthPoints: increment(breakdown.totalPoints),
            updatedAt: serverTimestamp()
        });

        // 4. Update Store History
        await updateDoc(storeRef, {
            purchasedBrandIds: arrayUnion(...orderBrandIds),
            lastOrderAmount: orderAmount,
            lastOrderDate: serverTimestamp()
        });

        // 5. Log history
        await addDoc(collection(db, "points_history"), {
            userId,
            dispensaryId,
            action: 'sale_order',
            pointsEarned: breakdown.totalPoints,
            breakdown: {
                revenuePoints: breakdown.revenuePoints,
                brandPoints: breakdown.brandPoints
            },
            timestamp: serverTimestamp()
        });

        return breakdown;
    } catch (error) {
        console.error("Error awarding order points:", error);
        throw error;
    }
};
