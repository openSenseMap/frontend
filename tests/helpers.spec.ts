import { describe, it, expect, vi } from 'vitest';
import { parseRequestData, parseUserRegistrationData, parseUserSignInData } from '~/lib/helpers';

describe('parseRequestData', () => {
  it('should parse JSON data when content-type is application/json', async () => {
    const jsonData = { name: 'john', email: 'john@example.com' };
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(jsonData)
    });

    const result = await parseRequestData(request);
    expect(result).toEqual(jsonData);
  });

  it('should parse form data when content-type is multipart/form-data', async () => {
    // Create a proper multipart form data body
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const body = `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="name"\r\n\r\n` +
      `john\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="email"\r\n\r\n` +
      `john@example.com\r\n` +
      `--${boundary}--\r\n`;
    
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      body: body
    });

    const result = await parseRequestData(request);
    expect(result).toEqual({
      name: 'john',
      email: 'john@example.com'
    });
  });

  it('should throw error for invalid JSON', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'invalid json'
    });

    await expect(parseRequestData(request)).rejects.toThrow('Failed to parse JSON data');
  });
});

describe('parseUserRegistrationData', () => {
  it('should parse JSON registration data', async () => {
    const jsonData = { 
      name: 'john_doe', 
      email: 'john@example.com', 
      password: 'password123',
      language: 'de_DE'
    };
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(jsonData)
    });

    const result = await parseUserRegistrationData(request);
    expect(result).toEqual({
      name: 'john_doe',
      email: 'john@example.com',
      password: 'password123',
      language: 'de_DE'
    });
  });

  it('should use default values for missing fields', async () => {
    const jsonData = {       
        name: 'john_doe', 
        email: 'john@example.com', 
        password: 'password123'
     };
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(jsonData)
    });

    const result = await parseUserRegistrationData(request);
    expect(result).toEqual({
        name: 'john_doe', 
        email: 'john@example.com', 
        password: 'password123',
        language: 'en_US'
    });
  });
});

describe('parseUserSignInData', () => {
  it('should parse JSON sign-in data', async () => {
    const jsonData = { 
      email: 'john@example.com', 
      password: 'password123'
    };
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(jsonData)
    });

    const result = await parseUserSignInData(request);
    expect(result).toEqual({
      email: 'john@example.com',
      password: 'password123'
    });
  });
});
