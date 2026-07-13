import { cp, rm } from "node:fs/promises";
import path from "node:path";

const sourceDir = path.resolve("public");
const outputDir = path.resolve("dist");

await rm(outputDir, { recursive: true, force: true });
await cp(sourceDir, outputDir, { recursive: true });

console.log(`Built static site to ${path.relative(process.cwd(), outputDir)}`);
