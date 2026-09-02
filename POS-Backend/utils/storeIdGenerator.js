const Store = require('../models/Store');

/**
 * Generates the next storeId in the format STORE0001, STORE0002, etc.
 * @returns {Promise<string>} The next available storeId
 * @throws {Error} If unable to generate storeId
 */
const generateNextStoreId = async () => {
  try {
    // Find the store with the highest storeId
    const lastStore = await Store.findOne(
      { storeId: { $regex: /^STORE\d{4}$/ } },
      { storeId: 1 },
      { sort: { storeId: -1 } }
    );

    let nextNumber = 1;

    if (lastStore) {
      // Extract the number from the last storeId (e.g., "STORE0012" -> 12)
      const lastNumber = parseInt(lastStore.storeId.replace('STORE', ''));
      nextNumber = lastNumber + 1;
    }

    // Format the number with leading zeros (4 digits)
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    const newStoreId = `STORE${formattedNumber}`;

    // Double-check that this storeId doesn't already exist (race condition protection)
    const existingStore = await Store.findOne({ storeId: newStoreId });
    if (existingStore) {
      // If it exists, recursively try the next number
      return await generateNextStoreId();
    }

    return newStoreId;
  } catch (error) {
    console.error('Error generating next storeId:', error);
    throw new Error('Failed to generate storeId');
  }
};

module.exports = {
  generateNextStoreId
};
