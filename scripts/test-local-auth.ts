import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api';

async function testAuth() {
  console.log('--- TESTING LOCAL AUTH FLOW ---');

  const testEmail = `auth_test_${Date.now()}@test.com`;
  const testPassword = 'Password123!';
  const schoolName = 'Test Institute ' + Date.now();

  try {
    // 1. SIGN UP
    console.log('[1] Attempting Registration...');
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User',
      email: testEmail,
      password: testPassword,
      schoolName: schoolName
    });
    console.log('✓ Registration Successful:', regRes.data.status);

    // 2. SIGN IN
    console.log('[2] Attempting Sign In...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    console.log('✓ Sign In Successful. Token received.');

    // 3. CHECK INSTITUTE CREATION
    console.log('[3] Verifying Institute Record...');
    const token = loginRes.data.data.accessToken;
    const instRes = await axios.get(`${BASE_URL}/institute/my-institutes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const institutes = instRes.data.data;
    const found = institutes.find((i: any) => i.instituteName === schoolName);

    if (found) {
      console.log('✓ Institute record created and verified:', found.instituteName);
    } else {
      console.log('✗ Institute record NOT found!');
    }

    console.log('--- ALL TESTS PASSED ---');
  } catch (error: any) {
    if (error.response) {
      console.error('✗ Test Failed:', error.response.status, error.response.data);
    } else {
      console.error('✗ Test Failed:', error.message);
    }
    process.exit(1);
  }

}

testAuth();
