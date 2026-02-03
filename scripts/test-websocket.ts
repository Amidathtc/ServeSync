import { io as socketClient, Socket } from 'socket.io-client';

/**
 * WebSocket Integration Test Script
 * Tests real-time order updates via Socket.io
 */

const BASE_URL = 'http://localhost:3100';
let kitchenToken = '';
let customerToken = '';
let restaurantId = '';
let kitchenSocket: Socket;
let customerSocket: Socket;

// Helper to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runWebSocketTests() {
    console.log('='.repeat(60));
    console.log('🌐 WEBSOCKET INTEGRATION TESTS');
    console.log('='.repeat(60));

    try {
        // =========================================================================
        // 1. Setup: Register users and create restaurant
        // =========================================================================
        console.log('\n📋 Step 1: Setting up test environment...');

        // Register kitchen owner
        const kitchenEmail = `kitchen_ws_${Date.now()}@test.com`;
        const kitchenRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: kitchenEmail,
                password: 'password123',
                name: 'WS Kitchen Owner',
                role: 'KITCHEN'
            })
        });

        if (kitchenRes.status !== 201) {
            console.error('❌ Failed to register kitchen user');
            return;
        }

        const kitchenData = await kitchenRes.json();
        kitchenToken = kitchenData.token;
        console.log('✅ Kitchen user registered');

        // Register customer
        const customerEmail = `customer_ws_${Date.now()}@test.com`;
        const customerRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: customerEmail,
                password: 'password123',
                name: 'WS Customer',
                role: 'CUSTOMER'
            })
        });

        if (customerRes.status !== 201) {
            console.error('❌ Failed to register customer');
            return;
        }

        const customerData = await customerRes.json();
        customerToken = customerData.token;
        console.log('✅ Customer registered');

        // Create restaurant
        const restRes = await fetch(`${BASE_URL}/restaurants`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${kitchenToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'WebSocket Test Restaurant',
                address: '123 Socket Street',
                phone: '555-WS-TEST'
            })
        });

        if (restRes.status !== 201) {
            console.error('❌ Failed to create restaurant');
            return;
        }

        const restData = await restRes.json();
        restaurantId = restData.id;
        console.log('✅ Restaurant created:', restData.name);

        // Add menu item
        const menuRes = await fetch(`${BASE_URL}/restaurants/${restaurantId}/menu`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${kitchenToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'WebSocket Burger',
                price: 15.99,
                category: 'Main'
            })
        });

        if (menuRes.status !== 201) {
            console.error('❌ Failed to create menu item');
            return;
        }

        const menuData = await menuRes.json();
        console.log('✅ Menu item created:', menuData.name);

        // =========================================================================
        // 2. Connect WebSocket Clients
        // =========================================================================
        console.log('\n📡 Step 2: Connecting WebSocket clients...');

        // Connect kitchen client
        kitchenSocket = socketClient(BASE_URL, {
            auth: { token: kitchenToken }
        });

        await new Promise<void>((resolve, reject) => {
            kitchenSocket.on('connect', () => {
                console.log('✅ Kitchen WebSocket connected');
                resolve();
            });

            kitchenSocket.on('connect_error', (error) => {
                console.error('❌ Kitchen WebSocket connection error:', error.message);
                reject(error);
            });

            setTimeout(() => reject(new Error('Kitchen connection timeout')), 5000);
        });

        // Connect customer client
        customerSocket = socketClient(BASE_URL, {
            auth: { token: customerToken }
        });

        await new Promise<void>((resolve, reject) => {
            customerSocket.on('connect', () => {
                console.log('✅ Customer WebSocket connected');
                resolve();
            });

            customerSocket.on('connect_error', (error) => {
                console.error('❌ Customer WebSocket connection error:', error.message);
                reject(error);
            });

            setTimeout(() => reject(new Error('Customer connection timeout')), 5000);
        });

        // =========================================================================
        // 3. Join Rooms
        // =========================================================================
        console.log('\n🚪 Step 3: Joining rooms...');

        // Kitchen joins restaurant room
        await new Promise<void>((resolve) => {
            kitchenSocket.emit('join:restaurant', restaurantId);
            kitchenSocket.on('joined:restaurant', (data) => {
                console.log('✅ Kitchen joined restaurant room:', data.restaurantId);
                resolve();
            });
            setTimeout(resolve, 1000); // Fallback
        });

        // Customer joins their orders room
        await new Promise<void>((resolve) => {
            customerSocket.emit('join:customer');
            customerSocket.on('joined:customer', (data) => {
                console.log('✅ Customer joined orders room');
                resolve();
            });
            setTimeout(resolve, 1000); // Fallback
        });

        // =========================================================================
        // 4. Test: Order Creation Event
        // =========================================================================
        console.log('\n🛒 Step 4: Testing ORDER_CREATED event...');

        let kitchenReceivedOrderCreated = false;
        let customerReceivedOrderCreated = false;
        let orderId = '';

        // Set up listeners
        kitchenSocket.on('order:created', (order) => {
            console.log('📨 Kitchen received ORDER_CREATED:', {
                orderId: order.orderId,
                status: order.status,
                total: order.totalAmount,
                items: order.items.length
            });
            kitchenReceivedOrderCreated = true;
            orderId = order.orderId;
        });

        customerSocket.on('order:created', (order) => {
            console.log('📨 Customer received ORDER_CREATED:', {
                orderId: order.orderId,
                status: order.status,
                total: order.totalAmount
            });
            customerReceivedOrderCreated = true;
        });

        // Place order via REST API
        const orderRes = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${customerToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                restaurantId,
                items: [{ menuItemId: menuData.id, quantity: 2 }],
                notes: 'WebSocket test order'
            })
        });

        if (orderRes.status !== 201) {
            console.error('❌ Failed to create order');
            return;
        }

        const orderData = await orderRes.json();
        orderId = orderData.order.id;
        console.log('✅ Order placed via REST:', orderId);

        // Wait for WebSocket events
        await wait(2000);

        if (kitchenReceivedOrderCreated && customerReceivedOrderCreated) {
            console.log('✅ ORDER_CREATED event test PASSED - Both received');
        } else {
            console.error('❌ ORDER_CREATED event test FAILED');
            console.log(`  Kitchen received: ${kitchenReceivedOrderCreated}`);
            console.log(`  Customer received: ${customerReceivedOrderCreated}`);
        }

        // =========================================================================
        // 5. Test: Order Status Update Event
        // =========================================================================
        console.log('\n🔄 Step 5: Testing ORDER_UPDATED event...');

        let kitchenReceivedOrderUpdated = false;
        let customerReceivedOrderUpdated = false;

        kitchenSocket.on('order:updated', (order) => {
            console.log('📨 Kitchen received ORDER_UPDATED:', {
                orderId: order.orderId,
                newStatus: order.status
            });
            kitchenReceivedOrderUpdated = true;
        });

        customerSocket.on('order:updated', (order) => {
            console.log('📨 Customer received ORDER_UPDATED:', {
                orderId: order.orderId,
                newStatus: order.status
            });
            customerReceivedOrderUpdated = true;
        });

        // Update order status via REST API
        const statusRes = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${kitchenToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'CONFIRMED' })
        });

        if (statusRes.status !== 200) {
            console.error('❌ Failed to update order status');
            return;
        }

        console.log('✅ Order status updated via REST: CONFIRMED');

        // Wait for WebSocket events
        await wait(2000);

        if (kitchenReceivedOrderUpdated && customerReceivedOrderUpdated) {
            console.log('✅ ORDER_UPDATED event test PASSED - Both received');
        } else {
            console.error('❌ ORDER_UPDATED event test FAILED');
            console.log(`  Kitchen received: ${kitchenReceivedOrderUpdated}`);
            console.log(`  Customer received: ${customerReceivedOrderUpdated}`);
        }

        // =========================================================================
        // 6. Test: Order Cancellation Event
        // =========================================================================
        console.log('\n❌ Step 6: Testing ORDER_CANCELLED event...');

        let kitchenReceivedOrderCancelled = false;
        let customerReceivedOrderCancelled = false;

        kitchenSocket.on('order:cancelled', (order) => {
            console.log('📨 Kitchen received ORDER_CANCELLED:', {
                orderId: order.orderId,
                status: order.status
            });
            kitchenReceivedOrderCancelled = true;
        });

        customerSocket.on('order:cancelled', (order) => {
            console.log('📨 Customer received ORDER_CANCELLED:', {
                orderId: order.orderId,
                status: order.status
            });
            customerReceivedOrderCancelled = true;
        });

        // Cancel order via REST API
        const cancelRes = await fetch(`${BASE_URL}/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${kitchenToken}`,
            }
        });

        if (cancelRes.status !== 200) {
            console.error('❌ Failed to cancel order');
            return;
        }

        console.log('✅ Order cancelled via REST');

        // Wait for WebSocket events
        await wait(2000);

        if (kitchenReceivedOrderCancelled && customerReceivedOrderCancelled) {
            console.log('✅ ORDER_CANCELLED event test PASSED - Both received');
        } else {
            console.error('❌ ORDER_CANCELLED event test FAILED');
            console.log(`  Kitchen received: ${kitchenReceivedOrderCancelled}`);
            console.log(`  Customer received: ${customerReceivedOrderCancelled}`);
        }

        // =========================================================================
        // Summary
        // =========================================================================
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ ORDER_CREATED:   ${kitchenReceivedOrderCreated && customerReceivedOrderCreated ? 'PASSED' : 'FAILED'}`);
        console.log(`✅ ORDER_UPDATED:   ${kitchenReceivedOrderUpdated && customerReceivedOrderUpdated ? 'PASSED' : 'FAILED'}`);
        console.log(`✅ ORDER_CANCELLED: ${kitchenReceivedOrderCancelled && customerReceivedOrderCancelled ? 'PASSED' : 'FAILED'}`);
        console.log('='.repeat(60));

    } catch (error: any) {
        console.error('\n❌ Test failed with error:', error.message);
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up...');
        if (kitchenSocket) {
            kitchenSocket.disconnect();
            console.log('✅ Kitchen socket disconnected');
        }
        if (customerSocket) {
            customerSocket.disconnect();
            console.log('✅ Customer socket disconnected');
        }
    }
}

// Run tests
(async () => {
    await runWebSocketTests();
    process.exit(0);
})();
