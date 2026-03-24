#!/usr/bin/env node

import { APP_NAME, APP_VERSION } from "./index.js";
import { loadConfig } from "./kosbling_sim2real/config.js";
import { getI18n, resolveUiLocale } from "./kosbling_sim2real/i18n.js";
import { runCliApp } from "./kosbling_sim2real/cli/app.js";

async function main(): Promise<void> {
  const [, , ...args] = process.argv;

  if (args.includes("--version") || args.includes("-v")) {
    console.log(`${APP_NAME} ${APP_VERSION}`);
    return;
  }

  const config = loadConfig(process.cwd());
  await runCliApp(config, args);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const t = getI18n(resolveUiLocale(process.env.KOSBLING_LOCALE));
  console.error(t.fatalError(message));
  process.exitCode = 1;
});
