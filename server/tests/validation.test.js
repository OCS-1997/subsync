import { isValidPassword } from "../middlewares/validations.js";
import assert from "assert";

console.log("Running password validation tests...");

const testCases = [
    { password: "Password1!", valid: true, description: "Valid password" },
    { password: "password1!", valid: false, description: "Missing uppercase" },
    { password: "PASSWORD1!", valid: false, description: "Missing lowercase" },
    { password: "Password!", valid: false, description: "Missing number" },
    { password: "Password1", valid: false, description: "Missing special char" },
    { password: "Pass1!", valid: false, description: "Too short (6 chars)" },
    { password: "Password123", valid: false, description: "Missing special char (numbers)" },
    { password: "Password!@#", valid: false, description: "Missing number" },
    { password: "StrongPassword123!", valid: true, description: "Long valid password" },
    { password: "Another@Valid1", valid: true, description: "Another valid password" },
    { password: "", valid: false, description: "Empty password" },
    { password: null, valid: false, description: "Null password" },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    try {
        const result = isValidPassword(test.password);
        assert.strictEqual(result, test.valid);
        passed++;
    } catch (error) {
        console.error(`❌ Test Case ${index + 1} Failed: ${test.description}`);
        console.error(`   Input: "${test.password}"`);
        console.error(`   Expected: ${test.valid}, Got: ${!test.valid}`);
        failed++;
    }
});

console.log(`\nTests Completed: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
    process.exit(1);
} else {
    console.log("✅ All tests passed!");
}
