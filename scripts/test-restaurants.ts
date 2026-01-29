import { prisma } from '../src/config/prisma';

/**
 * Verification Script for Restaurant and Menu Management APIs with RBAC
 */
async function testRestaurantFlow() {
  const baseUrl = 'http://localhost:3000';
  console.log('--- Starting Restaurant & Menu RBAC Tests ---');

  // =========================================================================
  // 0. Register Normal Customer (should NOT be able to create restaurant)
  // =========================================================================
  const customerEmail = `customer_${Date.now()}@test.com`;
  let customerToken = '';

  console.log('\n0. Registering Normal Customer...');
  const regCustRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: customerEmail, password: 'password123', name: 'Regular Joe', role: 'CUSTOMER' })
  });
  if (regCustRes.status === 201) {
    const data = await regCustRes.json();
    customerToken = data.token;
    console.log('✅ Customer registered');
  } else {
    console.error('❌ Customer registration failed');
    return;
  }

  // Attempt to create restaurant as CUSTOMER
  console.log('0a. Attempting to create restaurant as CUSTOMER...');
  const failRes = await fetch(`${baseUrl}/restaurants`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${customerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'Illegal Bistro', address: 'Nowhere', phone: '000' })
  });

  if (failRes.status === 403) {
    console.log('✅ RBAC SUCCESS: Customer blocked from creating restaurant (403)');
  } else {
    console.error(`❌ RBAC FAILURE: Expected 403, got ${failRes.status}`, await failRes.text());
  }

  // =========================================================================
  // 1. Register Kitchen Owner (should be able to create restaurant)
  // =========================================================================
  const ownerEmail = `owner_${Date.now()}@test.com`;
  let ownerToken = '';

  console.log('\n1. Registering Kitchen Owner...');
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ownerEmail, password: 'password123', name: 'Chef Gordon', role: 'KITCHEN' })
  });
  const regData = await regRes.json();

  if (regRes.status === 201) {
    ownerToken = regData.token;
    console.log('✅ Kitchen Owner registered');
  } else {
    console.error('❌ Owner registration failed', regData);
    return;
  }

  // =========================================================================
  // 2. Create Restaurant (as KITCHEN)
  // =========================================================================
  let restaurantId = '';
  console.log('\n2. Creating Restaurant (as KITCHEN)...');
  const restRes = await fetch(`${baseUrl}/restaurants`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ownerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Tasty Bytes',
      address: '123 Silicon Valley Blvd',
      phone: '555-0123'
    })
  });

  if (restRes.status === 201) {
    const restData = await restRes.json();
    restaurantId = restData.id;
    console.log('✅ Restaurant created:', restData.name);
  } else {
    const text = await restRes.text();
    console.error(`❌ Restaurant creation failed (Status: ${restRes.status}):`, text);
    return;
  }

  // =========================================================================
  // 3. Add Menu Item
  // =========================================================================
  let itemId = '';
  console.log('\n3. Adding Menu Item...');
  const menuRes = await fetch(`${baseUrl}/restaurants/${restaurantId}/menu`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ownerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Binary Burger',
      price: 12.99,
      category: 'Main'
    })
  });

  if (menuRes.status === 201) {
    const menuData = await menuRes.json();
    itemId = menuData.id;
    console.log('✅ Menu item added:', menuData.name);
  } else {
    const text = await menuRes.text();
    console.error(`❌ Menu item creation failed (Status: ${menuRes.status}):`, text);
    return;
  }
}

(async () => {
  await testRestaurantFlow();
})();
