const shouldRun = process.env.RUN_E2E === 'true';

const testOrSkip = shouldRun ? it : it.skip;

testOrSkip('creates an order and fetches a label via the API (requires live services)', async () => {
  const baseUrl = process.env.E2E_API_BASE_URL ?? 'http://localhost:4000/api';
  const reference = `TEST-${Date.now()}`;

  const orderPayload = {
    reference_no: reference,
    shipping_method: 'TEST_METHOD',
    country_code: 'US',
    order_weight: 0.5,
    order_pieces: 1,
    mail_cargo_type: 4,
    cargo_type: 'W',
    is_COD: 'N',
    Consignee: {
      consignee_name: 'Test User',
      consignee_street: '123 Main St',
      consignee_city: 'Testville',
      consignee_postcode: '90001',
      consignee_telephone: '+1-555-0000',
    },
    ItemArr: [
      {
        invoice_enname: 'Sample Item',
        invoice_weight: 0.5,
        invoice_quantity: 1,
        invoice_unitcharge: 10,
        invoice_currencycode: 'USD',
        box_number: 'U001',
      },
    ],
    Volume: [
      {
        box_number: 'U001',
        length: 10,
        width: 10,
        height: 10,
        weight: 0.5,
      },
    ],
  };

  const createResponse = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });

  expect(createResponse.ok).toBe(true);
  const orderData = await createResponse.json();
  expect(orderData.order.referenceNo).toBe(reference);

  const labelResponse = await fetch(`${baseUrl}/orders/${reference}/label`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  expect(labelResponse.ok).toBe(true);
});
