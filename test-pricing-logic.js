
import { calculateAgencyShiftCost } from './src/utils/pricing.js';

const runTest = (name, shift, expectedWithZeroExpenses) => {
    // We assume 0 expenses for the base check, then add them.
    const result = calculateAgencyShiftCost(shift);
    const passed = Math.abs(result - expectedWithZeroExpenses) < 0.01;
    console.log(`${passed ? '✅' : '❌'} ${name}: Exp $${expectedWithZeroExpenses} | Got $${result}`);
    if (!passed) console.error(`    -> FAILED. Details:`, shift);
};

console.log("=== RUNNING PRICING VERIFICATION ===");

// 1. NYC Tests
runTest('NYC 2h', { region: 'NYC', hoursWorked: 2 }, 120);
runTest('NYC 3h', { region: 'NYC', hoursWorked: 3 }, 160);
runTest('NYC 4h', { region: 'NYC', hoursWorked: 4 }, 200);
runTest('NYC 5h', { region: 'NYC', hoursWorked: 5 }, 240);
runTest('NYC 6h (Overtime)', { region: 'NYC', hoursWorked: 6 }, 280); // 240 + 40

// 2. LI Tests
runTest('LI 2h', { region: 'LI', hoursWorked: 2 }, 140);
runTest('LI 3h', { region: 'LI', hoursWorked: 3 }, 180);
runTest('LI 4h', { region: 'LI', hoursWorked: 4 }, 220);
runTest('LI 5h', { region: 'LI', hoursWorked: 5 }, 260);

// 3. Upstate Tests
runTest('Upstate 2h', { region: 'UPSTATE', hoursWorked: 2 }, 160);
runTest('Upstate 4h', { region: 'UPSTATE', hoursWorked: 4 }, 240);

// 4. Mileage & Tolls
// NYC 3h ($160) + 10 miles ($7) + $15 tolls = $182
runTest('NYC 3h + 10m + Tolls', {
    region: 'NYC',
    hoursWorked: 3,
    milesTraveled: 10,
    tollAmount: 15
}, 182);

// 5. Min Hours Logic (1h should act like 2h)
runTest('NYC 1h (Min Charge)', { region: 'NYC', hoursWorked: 1 }, 120);

// 6. Region Normalization
runTest('Westchester (Maps to LI)', { region: 'Westchester', hoursWorked: 2 }, 140);

console.log("=== DONE ===");
