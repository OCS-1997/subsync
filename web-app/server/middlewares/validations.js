/**
 * Regex function to validate GST number
 * @param   {string}  gstno The GST number to be validated
 * @returns {boolean}       The result of validation
 */
function normalizePhoneNumber(phoneNumber) {
    if (phoneNumber === null || phoneNumber === undefined) return "";
    return String(phoneNumber).replace(/[^\d]/g, "");
}

function isValidGSTIN(gstno) {
    if (typeof gstno !== "string") return false;
    if (gstno.toLowerCase() === "gst_na") return true;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/;
    return gstRegex.test(gstno);
}

/**
 * Regex function to validate Email address
 * @param   {string}  email The email address to be validated
 * @returns {boolean}       The result of validation
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Regex function to validate phone number
 * @param   {string}  phoneNumber The phone number to be validated
 * @returns {boolean}             The result of validation
 */
function isValidPhoneNumber(phoneNumber) {
    const digits = normalizePhoneNumber(phoneNumber);
    return digits.length >= 6 && digits.length <= 14;
}

export { isValidGSTIN, isValidEmail, isValidPhoneNumber, normalizePhoneNumber }
