import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extends Vitest's expect with Testing Library's matchers
expect.extend(matchers);

afterEach(() => {
  cleanup();
});
