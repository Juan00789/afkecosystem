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

// A simple in-memory cache for 'global' objects.
// In a real app, you would use a proper database or a more robust
// caching solution.
const REGISTRY = new Map<string, any>();

function register<T>(key: string, value: T): T {
  if (REGISTRY.has(key)) {
    return REGISTRY.get(key) as T;
  }
  REGISTRY.set(key, value);
  return value;
}

// In a Next.js app, you can have multiple Genkit environments running
// in the same process, so we need to make sure we are only initializaing
// the AI plugin once.
//
// We are using a simple in-memory cache to store the AI instance.
export const ai = register('ai', genkit);
