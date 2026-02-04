export default class ConstantMessage {
    public sendOk: string;
    public programmer_msg: string;
    public invalidContact: string;
    public emptyContact: string;
    public reqRegister: string;
    public onlyAdmUsedCommand: string;
    public sendHiGemini: string;

    public needAdmbot: string;

    constructor() {
        this.sendOk = `\`\`\`[200] - OK 🤖 ✔️ \`\`\``;
        this.programmer_msg = `*❗ Mensagem do Desenvolvedor* ❗\n\n "Comandos ou mensagens não funcionam no privado, crie grupos com o bot para usa-los"`;
        this.invalidContact = "Contato inválido ❗";
        this.emptyContact = "Este comando precisa de um contato ❗";
        this.reqRegister =
            "• Você precisa se registrar pra usar este comando!";
        this.onlyAdmUsedCommand =
            "❗ Apenas administradores são autorizados a usar este comando. ❗";
        this.sendHiGemini =
            "oi (responda de uma maneira mais zoeira e curta)";
        this.needAdmbot = "O bot precisa ser adm";
    }
}
