/**
 * This file contains all of the Zod validation models
 * used to ensure that our tRPC API functions ultimately
 * return data in the correct format.
 *
 * Zod is the industry standard for schema validation.
 * It allows for easy casting of and validation of data.
 *
 * Zod types are defined as objects that contains fields.
 * We can compose Zod types as well as shown below.
 *
 * To access the pure type of any Zod model, we can use:
 * z.infer<typeof Model>
 *
 * In the future, we will use Zod in many more places, so
 * it is good to introduce it here.
 */

import { z } from "zod";
import { convertKeysToCamelCase } from "../api/helpers/camel-case";

// Placeholder to prevent errors in the build step for members.
export const placeholder = {};
