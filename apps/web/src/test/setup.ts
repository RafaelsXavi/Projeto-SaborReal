import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

// Extends Vitest's expect with Testing Library's matchers
expect.extend(matchers);

afterEach(() => {
  cleanup();
});
