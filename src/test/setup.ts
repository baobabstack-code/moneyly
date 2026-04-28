import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

class MockStorage {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, value: string) { this.store[key] = value; }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

global.localStorage = new MockStorage() as any;

afterEach(() => {
  cleanup();
});