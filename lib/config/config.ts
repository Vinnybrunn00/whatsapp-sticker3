import { CreateOptions } from "@open-wa/wa-automate";

// No Termux o Node reporta "android" e a v5 não consegue baixar o
// navegador sozinha: é preciso usar o Chromium instalado pelo pkg.
const isTermux: boolean = process.platform === "android";

const termuxChromium: string = `${process.env.PREFIX ?? "/data/data/com.termux/files/usr"}/bin/chromium-browser`;

export const config: CreateOptions = {
    sessionId: "wa-bot",
    multiDevice: true,
    authTimeout: 60,
    blockCrashLogs: true,
    disableSpins: true,
    headless: true,
    logConsole: false,
    popup: !isTermux,
    qrTimeout: 0,
    ...(isTermux
        ? {
              useChromium: true,
              executablePath:
                  process.env.PUPPETEER_EXECUTABLE_PATH ?? termuxChromium,
          }
        : { useChrome: true }),
};
