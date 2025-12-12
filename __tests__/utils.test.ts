import { extractCrowdinOrganization, wait } from '../src/utils';
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
