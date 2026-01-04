
// COMMISSION RULE TEST SCRIPT
// Verifies "Space Poppers" expiration logic

import { isStoreActive } from '../services/compensationService.js';

console.log("---------------------------------------------------");
console.log("TESTING COMMISSION LOGIC - " + new Date().toISOString());
console.log("---------------------------------------------------");

const NOW = new Date();

// Helper to create past dates - robust to month lengths (uses 15th)
const monthsAgo = (n) => {
    const d = new Date(NOW);
    d.setDate(15);
    d.setMonth(d.getMonth() - n);
    return d;
};

// Scenario A: Space Poppers Only (5 Months Ago) -> Expect ACTIVE
const storeA = {
    name: "Store A",
    activeBrands: ["Space Poppers"],
    firstSaleDate: monthsAgo(5),
    status: 'Sold'
};

// Scenario B: Space Poppers Only (10 Months Ago) -> Expect INACTIVE
const storeB = {
    name: "Store B",
    activeBrands: ["Space Poppers"],
    firstSaleDate: monthsAgo(10), // > 9 months
    status: 'Sold'
};

// Scenario C: Mixed Brands (10 Months Ago) -> Expect ACTIVE
const storeC = {
    name: "Store C",
    activeBrands: ["Space Poppers", "Green Giants"],
    firstSaleDate: monthsAgo(10),
    status: 'Sold'
};

// Scenario D: Legacy Store (No Brands Array, just status) -> Expect ACTIVE (Safe Default)
const storeD = {
    name: "Store D (Legacy)",
    status: 'Sold',
    firstSaleDate: monthsAgo(20)
};

// EXECUTE TESTS
const test = (name, store, expected) => {
    const result = isStoreActive(store);
    const pass = result === expected;

    // Simple console log formatting
    if (pass) {
        console.log(`[PASS] ${name}: Expected ${expected}, Got ${result}`);
    } else {
        console.error(`[FAIL] ${name}: Expected ${expected}, Got ${result}`);
    }
};

test("Scenario A (SP < 9mo)", storeA, true);
test("Scenario B (SP > 9mo)", storeB, false);
test("Scenario C (Mixed Brands)", storeC, true);
test("Scenario D (Legacy)", storeD, true);

console.log("---------------------------------------------------");
