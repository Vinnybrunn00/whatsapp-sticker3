// src/@types/gtts.d.ts
declare module "gtts" {
    export default class gTTS {
        constructor(text: string, lang?: string);
        save(filename: string, callback?: () => void): void;
    }
}
