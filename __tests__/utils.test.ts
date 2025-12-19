import { extractCrowdinOrganization, wait, formatUserName } from '../src/utils';
import { describe, test, expect } from '@jest/globals';

describe('wait', () => {
  test('throws invalid number', async () => {
    const input = parseInt('foo', 10);
    await expect(wait(input)).rejects.toThrow('milliseconds not a number');
  });

  test('wait 500 ms', async () => {
    const start = new Date();
    await wait(500);
    const end = new Date();
    const delta = Math.abs(end.getTime() - start.getTime());

    expect(delta).toBeGreaterThan(450);
  });
});

describe('extractCrowdinOrganization', () => {
  test('clean text', () => {
    const input = 'testOrg';
    const result = extractCrowdinOrganization(input);
    expect(result).toBe(input);
  });

  test('text with hyphen', () => {
    const input = 'test-org';
    const result = extractCrowdinOrganization(input);
    expect(result).toBe(input);
  });

  test('full url', () => {
    const organization = 'testOrg';
    const input = `https://${organization}.crowdin.com/`;
    const result = extractCrowdinOrganization(input);
    expect(result).toBe(organization);
  });

  test('full url with hyphen', () => {
    const organization = 'test-org';
    const input = `https://${organization}.crowdin.com/`;
    const result = extractCrowdinOrganization(input);
    expect(result).toBe(organization);
  });

  test('url without protocol', () => {
    const organization = 'testOrg';
    const input = `${organization}.crowdin.com/`;
    const result = extractCrowdinOrganization(input);
    expect(result).toBe(organization);
  });

  test('url without protocol and with hyphen', () => {
    const organization = 'test-org';
    const input = `${organization}.crowdin.com/`;
    const result = extractCrowdinOrganization(input);
    expect(result).toBe(organization);
  });

  test('enterprise api url', () => {
    const organization = 'testOrg';
    const input = `https://${organization}.api.crowdin.com/`;
    const result = extractCrowdinOrganization(input);
    expect(result).toBe(organization);
  });

  test('enterprise api url with hyphen', () => {
    const organization = 'test-org';
    const input = `https://${organization}.api.crowdin.com/`;
    const result = extractCrowdinOrganization(input);
    expect(result).toBe(organization);
  });

  test('enterprise api url without protocol', () => {
    const organization = 'testOrg';
    const input = `${organization}.api.crowdin.com/`;
    const result = extractCrowdinOrganization(input);
    expect(result).toBe(organization);
  });

  test('enterprise api url without protocol and with hyphen', () => {
    const organization = 'test-org';
    const input = `${organization}.api.crowdin.com/`;
    const result = extractCrowdinOrganization(input);
    expect(result).toBe(organization);
  });
});

describe('formatUserName', () => {
  test('basic name parsing', () => {
    const result = formatUserName('John Doe (johndoe)', 'johndoe');
    expect(result.displayName).toBe('John Doe');
    expect(result.usernameDisplay).toBe('(johndoe)');
  });

  test('name without parentheses uses username parameter', () => {
    const result = formatUserName('John Doe', 'johndoe');
    expect(result.displayName).toBe('John Doe');
    expect(result.usernameDisplay).toBe('(johndoe)');
  });

  test('when fullName equals username, show only username', () => {
    const result = formatUserName('johndoe', 'johndoe');
    expect(result.displayName).toBe('johndoe');
    expect(result.usernameDisplay).toBe('');
  });

  test('long name truncation with default maxLength', () => {
    const result = formatUserName('Very Long Display Name Here (user123)', 'user123');
    expect(result.displayName).toBe('Very Long Display Na...');
    expect(result.usernameDisplay).toBe('(user123)');
  });

  test('long name truncation with custom maxLength', () => {
    const result = formatUserName('Very Long Display Name (user123)', 'user123', 10);
    expect(result.displayName).toBe('Very Long ...');
    expect(result.usernameDisplay).toBe('(user123)');
  });

  test('whitespace trimming in name', () => {
    const result = formatUserName('  John Doe  (johndoe)  ', 'johndoe');
    expect(result.displayName).toBe('John Doe');
    expect(result.usernameDisplay).toBe('(johndoe)');
  });

  test('special characters in name', () => {
    const result = formatUserName('José García (jose_garcia)', 'jose_garcia');
    expect(result.displayName).toBe('José García');
    expect(result.usernameDisplay).toBe('(jose_garcia)');
  });

  test('empty fullName uses username as fallback', () => {
    const result = formatUserName('', 'johndoe');
    expect(result.displayName).toBe('johndoe');
    expect(result.usernameDisplay).toBe('');
  });

  test('name with multiple parentheses', () => {
    const result = formatUserName('John (Johnny) Doe (johndoe)', 'johndoe');
    expect(result.displayName).toBe('John (Johnny) Doe');
    expect(result.usernameDisplay).toBe('(johndoe)');
  });
});
