import { ContactId } from "@open-wa/wa-automate";
import fs from "fs/promises";

export default class OwnerServices {
    private sender: ContactId;
    private root: string;
    private ownerPath: string;

    public constructor(sender: ContactId) {
        this.sender = sender;
        this.root = process.cwd();
        this.ownerPath = `${this.root}/lib/data/owner/owner.json`;
    }

    public async isOwner(): Promise<boolean> {
        const readFile: any = await fs.readFile(this.ownerPath, "utf-8");
        const jsonOwner: string[] = JSON.parse(readFile);
        return jsonOwner.includes(this.sender);
    }
}
