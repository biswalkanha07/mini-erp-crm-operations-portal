const axios = require('axios');

async function testValidation() {
  try {
    console.log('Testing forgot password with invalid email...\n');
    
    // Test 1: Invalid email format
    console.log('Test 1: Invalid email format (missing @)');
  const response1 = await axios.post('http://localhost:5050/api/auth/forgot-password', {
      email: 'orgadmingmail.com' // Invalid email (missing @)
    });
    console.log('Response:', response1.data);
  } catch (error) {
    if (error.response) {
      console.log('Validation Error Response:');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }

  try {
    console.log('\nTest 2: Missing email field');
  const response2 = await axios.post('http://localhost:5050/api/auth/forgot-password', {
      // No email field
    });
    console.log('Response:', response2.data);
  } catch (error) {
    if (error.response) {
      console.log('Validation Error Response:');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

testValidation();
