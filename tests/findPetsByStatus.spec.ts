/**
 * LLM-Powered API Testing Improvements
 * 
 * - Added a data-driven test loop using AI-generated edge cases.
 * - Expanded test coverage to include security injections (SQLi, XSS) and data integrity scenarios.
 * - Documented the AI integration strategy and specific prompts in README.md.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://petstore.swagger.io/v2';

test.describe('GET /pet/findByStatus', () => {
  function validatePet(pet: any) {    
    expect(pet).toHaveProperty('id');
    expect(typeof pet.id).toBe('number');

    expect(pet).toHaveProperty('status');
    expect(['available', 'pending', 'sold']).toContain(pet.status);

    if (pet.name !== undefined) {
      expect(typeof pet.name).toBe('string');
    }
    if (pet.category !== undefined) {
      expect(pet.category).toHaveProperty('id');

      // name might not always exist <-----
        if (pet.category.name !== undefined) {
              expect(typeof pet.category.name).toBe('string');
            }
    }
    if (pet.photoUrls !== undefined) {

      expect(Array.isArray(pet.photoUrls)).toBe(true);
    }
    if (pet.tags !== undefined) {
      expect(Array.isArray(pet.tags)).toBe(true);
    }
  }

  const validStatuses = ['available', 'pending', 'sold'];
  for (const status of validStatuses) {
    test(`should return pets with status "${status}"`, async ({ request }, testInfo) => {
      const start = Date.now();
      const url = `${BASE_URL}/pet/findByStatus?status=${status}`;
      console.log(`Request URL: ${url}`);
      const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
        params: { status }
      });

      const duration = Date.now() - start;

      await testInfo.attach('request', {
        body: `GET /pet/findByStatus?status=${status}`,
        contentType: 'text/plain'
      });

      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(3000);
      expect(response.headers()['content-type']).toContain('application/json');

      const pets = await response.json();
      expect(Array.isArray(pets)).toBe(true);

      for (const pet of pets) {
        validatePet(pet);
        expect(pet.status).toBe(status);
      }
    });
  }

  test('should accept multiple valid statuses (comma-separated)', async ({ request }) => {
    const url = `${BASE_URL}/pet/findByStatus?status=available,pending`;
    console.log(`Request URL: ${url}`);

    const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
      params: { status: 'available,pending' }
    });

    expect(response.status()).toBe(200);
    const pets = await response.json();
    expect(Array.isArray(pets)).toBe(true);

    for (const pet of pets) {
      validatePet(pet);
      expect(['available', 'pending']).toContain(pet.status);
    }
  });

  test('invalid status value should return 200 (API behavior)', async ({ request }) => {
    const url = `${BASE_URL}/pet/findByStatus?status=invalid-status`;
    console.log(`Request URL: ${url}`);

    const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
      params: { status: 'invalid-status' }
    });
    expect(response.status()).toBe(200);
    const pets = await response.json();
    expect(Array.isArray(pets)).toBe(true);
  });

  test('missing status parameter should return 200', async ({ request }) => {
    const url = `${BASE_URL}/pet/findByStatus`;
    console.log(`Request URL: ${url}`);

    const response = await request.get(`${BASE_URL}/pet/findByStatus`);
    expect(response.status()).toBe(200);
    const pets = await response.json();
    expect(Array.isArray(pets)).toBe(true);
  });

  test('empty status parameter should return 200', async ({ request }) => {
    const url = `${BASE_URL}/pet/findByStatus?status=`;
    console.log(`Request URL: ${url}`);

    const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
      params: { status: '' }
    });
    expect(response.status()).toBe(200);
    const pets = await response.json();
    expect(Array.isArray(pets)).toBe(true);
  });

  test('POST should return 405', async ({ request }) => {
    const url = `${BASE_URL}/pet/findByStatus?status=available`;
    console.log(`POST Request URL: ${url}`);

    const response = await request.post(`${BASE_URL}/pet/findByStatus`, {
      params: { status: 'available' }
    });
    expect(response.status()).toBe(405);
  });

  test('PUT should return 405', async ({ request }) => {
    const url = `${BASE_URL}/pet/findByStatus?status=available`;
    console.log(`PUT Request URL: ${url}`);

    const response = await request.put(`${BASE_URL}/pet/findByStatus`, {
      params: { status: 'available' }
    });
    expect(response.status()).toBe(405);
  });

  test('DELETE should return 405', async ({ request }) => {
    const url = `${BASE_URL}/pet/findByStatus?status=available`;
    console.log(`DELETE Request URL: ${url}`);

    const response = await request.delete(`${BASE_URL}/pet/findByStatus`, {
      params: { status: 'available' }
    });
    expect(response.status()).toBe(405);
  });

  /**
   * SECTION: LLM-Generated Edge Cases
   * These test cases were generated using Gemini to identify unconventional inputs and potential security risks.
   */
  const aiGeneratedEdgeCases = [
    { name: 'extremely long string', value: 'a'.repeat(1000) },
    { name: 'SQL injection attempt', value: "' OR '1'='1" },
    { name: 'XSS payload', value: '<script>alert(1)</script>' },
    { name: 'Encoded special chars', value: '%E2%98%BA' }, // Smiley face
    { name: 'Null byte injection', value: 'available%00' },
    { name: 'Path traversal attempt', value: '../../../../etc/passwd' }
  ];

  /**
   * LLM DATA-DRIVEN LOOP
   * Dynamically generates tests for each AI-provided edge case.
   */
  for (const edgeCase of aiGeneratedEdgeCases) {
    test(`AI Edge Case: ${edgeCase.name} should return 200 (API behavior)`, async ({ request }, testInfo) => {
      const url = `${BASE_URL}/pet/findByStatus?status=${edgeCase.value}`;
      console.log(`Request URL: ${url}`);

      const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
        params: { status: edgeCase.value }
      });

      await testInfo.attach('request_details', {
        body: `Testing ${edgeCase.name} with value: ${edgeCase.value}`,
        contentType: 'text/plain'
      });

      expect(response.status()).toBe(200);
      const pets = await response.json();
      expect(Array.isArray(pets)).toBe(true);
    });
  }

  test('should handle non-string status parameter (e.g., number) as 200', async ({ request }) => {
    const url = `${BASE_URL}/pet/findByStatus?status=123`;
    console.log(`Request URL: ${url}`);

    const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
      params: { status: 123 }
    });
    expect(response.status()).toBe(200);
    const pets = await response.json();
    expect(Array.isArray(pets)).toBe(true);
  });

  test('mixed valid and invalid statuses should return 200 (all pets)', async ({ request }) => {
    const url = `${BASE_URL}/pet/findByStatus?status=available,invalid`;
    console.log(`Request URL: ${url}`);

    const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
      params: { status: 'available,invalid' }
    });
    expect(response.status()).toBe(200);
    const pets = await response.json();
    expect(Array.isArray(pets)).toBe(true);
  });

  test('empty element in comma-separated list (e.g., "available,,pending") returns 200', async ({ request }) => {
    const url = `${BASE_URL}/pet/findByStatus?status=available,,pending`;
    console.log(`Request URL: ${url}`);

    const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
      params: { status: 'available,,pending' }
    });
    expect(response.status()).toBe(200);
    const pets = await response.json();
    expect(Array.isArray(pets)).toBe(true);
  });

  test('duplicate valid status values (e.g., "available,available") should filter correctly', async ({ request }) => {
    const url = `${BASE_URL}/pet/findByStatus?status=available,available`;
    console.log(`Request URL: ${url}`);

    const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
      params: { status: 'available,available' }
    });
    expect(response.status()).toBe(200);
    const pets = await response.json();
    expect(Array.isArray(pets)).toBe(true);
    for (const pet of pets) {
      expect(pet.status).toBe('available');
    }
  });

  test('status with leading spaces should return 200 (all pets)', async ({ request }) => {
    const url = `${BASE_URL}/pet/findByStatus?status=%20available`;
    console.log(`Request URL: ${url}`);

    const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
      params: { status: ' available' }
    });
    expect(response.status()).toBe(200);
    const pets = await response.json();
    expect(Array.isArray(pets)).toBe(true);
  });

  test('status with trailing spaces should return 200 (all pets)', async ({ request }) => {
    const url = `${BASE_URL}/pet/findByStatus?status=available%20`;
    console.log(`Request URL: ${url}`);

    const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
      params: { status: 'available ' }
    });
    expect(response.status()).toBe(200);
    const pets = await response.json();
    expect(Array.isArray(pets)).toBe(true);
  });

  test('status with special characters should return 200 (all pets)', async ({ request }) => {
    const url = `${BASE_URL}/pet/findByStatus?status=!@#$%`;
    console.log(`Request URL: ${url}`);

    const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
      params: { status: '!@#$%' }
    });
    expect(response.status()).toBe(200);
    const pets = await response.json();
    expect(Array.isArray(pets)).toBe(true);
  });
});

// trigger workflow...