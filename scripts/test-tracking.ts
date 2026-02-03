import { io } from 'socket.io-client';

async function testTracking() {
    console.log('🧪 Starting Tracking Simulation...');

    // 1. Connect as Driver
    const driverSocket = io('http://localhost:3100', {
        auth: { token: 'DRIVER_TOKEN_HERE' } // In real test we'd need a valid token
    });

    driverSocket.on('connect', () => {
        console.log('✅ Driver connected');
        driverSocket.emit('join:driver');
    });

    driverSocket.on('driver:new_order', (data) => {
        console.log('🔔 Driver received NEW ORDER:', data);

        // Accept order (mocking the REST call via socket for simplicity, or just simulating the flow)
        console.log('Simulating Driver accepting order in 2s...');
        setTimeout(() => {
            // In a real e2e test we would call the REST API to accept
            console.log('✅ Driver accepted order (Mock)');

            // Start streaming location
            setInterval(() => {
                const lat = 6.5244 + (Math.random() * 0.01);
                const lng = 3.3792 + (Math.random() * 0.01);
                console.log(`📍 Driver streaming location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                driverSocket.emit('driver:location_update', {
                    lat,
                    lng,
                    activeOrderId: data.orderId
                });
            }, 3000);
        }, 2000);
    });

    // 2. Connect as Customer
    const customerSocket = io('http://localhost:3100', {
        auth: { token: 'CUSTOMER_TOKEN_HERE' }
    });

    customerSocket.on('connect', () => {
        console.log('✅ Customer connected');
        // Join order room (needs order ID, which we'd get from the creation flow)
    });

    customerSocket.on('order:tracking_update', (data) => {
        console.log('🛰️ Customer received TRACKING UPDATE:', data);
    });

    // Keep alive
    setInterval(() => { }, 1000);
}

// Note: This script is a template. To run it, we need valid JWT tokens.
// For now, it serves as the verification logic we will use.
console.log('This script requires valid JWT tokens to run against the local server.');
// testTracking();
