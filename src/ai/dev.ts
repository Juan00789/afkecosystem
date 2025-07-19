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

import { genkit, type Plugin } from 'genkit';
import { next } from '@genkit-ai/next';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';
import { inspect } from 'util';

const myPlugin: Plugin<void> = async (options) => ({
  // This is required.
  name: 'my-plugin',

  // This is how you can use the options passed to the plugin.
  // The 'options' argument is the same as the one passed to the plugin.
  // For this plugin, it is of type 'MyPluginOptions'.
  // It is undefined if no options are passed.

  // This is the list of flows defined by this plugin.
  // The list can be generated dynamically based on the options.
  flows: [],

  // This is how you can define custom configurations for your plugin.
  // The configuration is defined using a Zod schema.
  // The configuration is loaded from the Genkit configuration file.
  // In this example, you can add 'myPlugin: { myConfig: 'my value' }' to genkit.config.js.
  // The configuration is validated against the schema.
  // The configuration is available in the 'config' argument of the plugin function.
  // For this plugin, the 'config' argument is of type 'MyPluginConfig'.
  configSchema: undefined,
});

genkit({
  plugins: [
    firebase(),
    next({
      // We are proxying requests from the Next.js app to the Genkit
      // dev server, so we need to specify the port it's running on.
      // The default Genkit dev server port is 3400.
      devServerPort: 3400,
    }),
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    myPlugin(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

// A flow that uses the plugin's configuration.
// It can be called from the Genkit developer UI.
// To try it, run 'genkit start' and open http://localhost:4000/flows.
//
// This is not a flow that is part of the plugin.
// It is just an example of how to use the plugin's configuration.
//
// This will work only if you add 'myPlugin: { myConfig: '...' }' to genkit.config.js.
// ai.flow(
//   {
//     name: 'myFlow',
//     inputSchema: z.string(),
//     outputSchema: z.string(),
//   },
//   async (name) => {
//     const config = genkit.getConfig('myPlugin');
//     if (!config) {
//       throw new Error('myPlugin configuration not found');
//     }
//     return `Hello, ${name}! My config is ${config.myConfig}`;
//   }
// );
