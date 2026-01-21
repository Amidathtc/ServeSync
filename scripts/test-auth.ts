
async function testAuth() {
    const baseUrl = 'http://localhost:3000';
    const testUser = {
        email: `test_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User'
    };

    console.log('--- Starting Auth Tests ---');

    // 1. Register
    console.log('\n1. Testing Registration...');
    try {
        const res = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        if (res.status === 201) {
            console.log('✅ Registration successful');
        } else {
            console.log('❌ Registration failed:', data);
        }
    } catch (e) {
        console.error('❌ Registration request failed:', e);
    }

    // 2. Login
    console.log('\n2. Testing Login...');
    let token = '';
    try {
        const res = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testUser.email, password: testUser.password })
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        if (res.status === 200 && data.token) {
            console.log('✅ Login successful');
            token = data.token;
        } else {
            console.log('❌ Login failed:', data);
        }
    } catch (e) {
        console.error('❌ Login request failed:', e);
    }

    if (!token) {
        console.log('❌ Skipping protected route test due to missing token');
        return;
    }

    // 3. Protected Route
    console.log('\n3. Testing Protected Route (/auth/me)...');
    try {
        const res = await fetch(`${baseUrl}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        if (res.status === 200 && data.user && data.user.email === testUser.email) {
            console.log('✅ Protected route access successful');
            console.log('User data:', data.user);
        } else {
            console.log('❌ Protected route failed:', data);
        }
    } catch (e) {
        console.error('❌ Protected route request failed:', e);
    }
}

// Function to wait for server to be ready
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Run tests
(async () => {
    // Give server a moment to theoretically start if we were spawning it, 
    // but here we assume user or we run it. 
    // Actually we need to run the server in background.
    // For this agent session, I will run the server in background and then run this script.
    await testAuth();
})();
