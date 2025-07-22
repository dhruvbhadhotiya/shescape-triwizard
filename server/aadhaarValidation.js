export function validateAadhaarData(aadhaarData) {
    if (!aadhaarData.aadhaarNumber || aadhaarData.aadhaarNumber.length < 4) {
        return false;
    }
    return true;
}
