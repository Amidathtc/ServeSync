/**
 * Verification Script for Order Processing System
 * 
 * Tests:
 * 1. Customer places order
 * 2. Order total calculated correctly
 * 3. Kitchen views restaurant orders
 * 4. Kitchen updates order status (workflow)
 * 5. Customer views order history
 * 6. Order cancellation (customer vs kitchen permissions)
 */

async function testOrderProcessing() {
    const baseUrl = 'http://localhost:3000';
    console.log('--- Starting Order Processing Tests ---\n');

    //=============================================================================
    // Setup: Create customer, kitchen owner, restaurant, and menu items
    //=============================================================================

    // 1. Register Customer
    console.log('1. Registering Customer...');
    const customerRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: `customer_${Date.now()}@test.com`,
            password: 'password123',
            name: 'Hungry Customer',
            role: 'CUSTOMER'
        })
    });
    const customerData = await customerRes.json();
    const customerToken = customerData.token;
    console.log('✅ Customer registered\n');

    // 2. Register Kitchen Owner
    console.log('2. Registering Kitchen Owner...');
    const kitchenRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: `chef_${Date.now()}@test.com`,
            password: 'password123',
            name: 'Chef Ramsey',
            role: 'KITCHEN'
        })
    });
    const kitchenData = await kitchenRes.json();
    const kitchenToken = kitchenData.token;
    console.log('✅ Kitchen owner registered\n');

    // 3. Create Restaurant
    console.log('3. Creating Restaurant...');
    const restRes = await fetch(`${baseUrl}/restaurants`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${kitchenToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'Test Restaurant',
            address: '123 Test St',
            phone: '555-0000'
        })
    });
    const restaurant = await restRes.json();
    const restaurantId = restaurant.id;
    console.log('✅ Restaurant created:', restaurant.name, '\n');

    // 4. Add Menu Items
    console.log('4. Adding Menu Items...');
    const menuItems: any[] = [];

    const item1Res = await fetch(`${baseUrl}/restaurants/${restaurantId}/menu`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${kitchenToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'Burger',
            price: 10.99,
            category: 'Mains'
        })
    });
    menuItems.push(await item1Res.json());

    const item2Res = await fetch(`${baseUrl}/restaurants/${restaurantId}/menu`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${kitchenToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'Fries',
            price: 3.99,
            category: 'Sides'
        })
    });
    menuItems.push(await item2Res.json());

    console.log('✅ Added 2 menu items\n');

    //=============================================================================
    // Test 1: Place Order
    //=============================================================================
    console.log('Test 1: Customer Places Order');
    const orderRes = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${customerToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            restaurantId,
            items: [
                { menuItemId: menuItems[0].id, quantity: 2 },
                { menuItemId: menuItems[1].id, quantity: 1 }
            ],
            notes: 'Extra ketchup please'
        })
    });

    if (orderRes.status === 201) {
        const orderData = await orderRes.json();
        const order = orderData.order;
        const expectedTotal = (10.99 * 2) + (3.99 * 1);

        if (Math.abs(order.total - expectedTotal) < 0.01) {
            console.log(`✅ Order placed (Total: $${order.total})`);
        } else {
            console.error(`❌ Total mismatch: expected ${expectedTotal}, got ${order.total}`);
        }

        const orderId = order.id;
        console.log(`   Order ID: ${orderId}\n`);

        //=============================================================================
        // Test 2: Customer Views Order History
        //=============================================================================
        console.log('Test 2: Customer Views Order History');
        const historyRes = await fetch(`${baseUrl}/orders`, {
            headers: { 'Authorization': `Bearer ${customerToken}` }
        });
        const historyData = await historyRes.json();

        if (historyData.count >= 1) {
            console.log(`✅ Order history retrieved (${historyData.count} orders)\n`);
        } else {
            console.error('❌ Order not in history\n');
        }

        //=============================================================================
        // Test 3: Kitchen Views Restaurant Orders
        //=============================================================================
        console.log('Test 3: Kitchen Views Restaurant Orders');
        const kitchenOrdersRes = await fetch(`${baseUrl}/orders/restaurant/${restaurantId}`, {
            headers: { 'Authorization': `Bearer ${kitchenToken}` }
        });
        const kitchenOrders = await kitchenOrdersRes.json();

        if (kitchenOrders.count >= 1) {
            console.log(`✅ Kitchen sees orders (${kitchenOrders.count} orders)\n`);
        } else {
            console.error('❌ Kitchen cannot see orders\n');
        }

        //=============================================================================
        // Test 4: Update Order Status (Workflow)
        //=============================================================================
        console.log('Test 4: Order Status Workflow');

        // PENDING -> CONFIRMED
        const confirmRes = await fetch(`${baseUrl}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${kitchenToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'CONFIRMED' })
        });

        if (confirmRes.status === 200) {
            console.log('✅ Order confirmed');
        } else {
            console.error('❌ Failed to confirm:', await confirmRes.json());
        }

        // CONFIRMED -> PREPARING
        const prepareRes = await fetch(`${baseUrl}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${kitchenToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'PREPARING' })
        });

        if (prepareRes.status === 200) {
            console.log('✅ Order preparing\n');
        } else {
            console.error('❌ Failed to set preparing:', await prepareRes.json());
        }

        //=============================================================================
        // Test 5: Cancellation Permissions
        //=============================================================================
        console.log('Test 5: Cancellation Permissions');

        // Customer tries to cancel PREPARING order (should fail)
        const cancelFailRes = await fetch(`${baseUrl}/orders/${orderId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${customerToken}` }
        });

        if (cancelFailRes.status === 400 || cancelFailRes.status === 403) {
            console.log('✅ Customer blocked from canceling PREPARING order');
        } else {
            console.error('❌ Should have blocked customer');
        }

        // Kitchen cancels order (should succeed)
        const cancelSuccessRes = await fetch(`${baseUrl}/orders/${orderId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${kitchenToken}` }
        });

        if (cancelSuccessRes.status === 200) {
            console.log('✅ Kitchen successfully cancelled order\n');
        } else {
            console.error('❌ Kitchen should be able to cancel:', await cancelSuccessRes.json());
        }

    } else {
        console.error('❌ Order placement failed:', await orderRes.json());
    }

    console.log('--- Order Processing Tests Complete ---');
}

(async () => {
    await testOrderProcessing();
})();
