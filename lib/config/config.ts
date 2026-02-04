import { AdvancedConfig, ConfigObject } from "@open-wa/wa-automate";

export const config: AdvancedConfig | ConfigObject = {
    sessionId: "wa-bot",
    multiDevice: true,
    authTimeout: 60,
    blockCrashLogs: true,
    disableSpins: true,
    headless: true,
    logConsole: false,
    popup: false,
    qrTimeout: 0,
};
