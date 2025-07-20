/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { genkit } from 'genkit';
import next from '@genkit-ai/next';
import { googleAI } from '@genkit-ai/googleai';

const REGISTRY = new Map<string, any>();

function register<T>(key: string, value: T): T {
  if (REGISTRY.has(key)) {
    return REGISTRY.get(key) as T;
  }
  REGISTRY.set(key, value);
  return value;
}

export const ai = register('ai', genkit({
  plugins: [
    next({
      devServerPort: 3400,
    }),
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
}));
