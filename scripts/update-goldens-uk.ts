/** Placeholder — run after adding src/test/fixtures/goldens-uk/ builders. */
import { computeUkGoldenScenarios } from "../src/test/fixtures/goldens-uk/buildGoldensUk";

console.log("UK goldens:", Object.keys(computeUkGoldenScenarios()));
