# 🤖 WhatsApp Bot

Bot de WhatsApp **open source**, desenvolvido em **Node.js + TypeScript**, focado em automação, administração de grupos e interação com a IA do Gemini, TTS e utilidades multimídia.

---

## Funcionalidades

### 🛡️ Administração de Grupos
Comandos essenciais para manter a ordem no chat.

| Comando | Descrição |
| :--- | :--- |
| `!setDesc` | Define uma nova descrição para o grupo. |
| `!add` | Adiciona um novo participante ao grupo. |
| `!promote` | Promove um membro a Administrador. |
| `!demote` | Remove o cargo de Administrador de um membro. |
| `!remove` | Remove um participante do grupo. |
| `!getAdmins` | Marca todos os admins do grupo. |
| `!getLink` | Envia o link de convite do grupo |
| `!all` | Marca todos os membros do grupo (menciona @todos). |

### 🎨 Mídia e Utilidades
Ferramentas de conversão e download de conteúdo.

| Comando | Descrição |
| :--- | :--- |
| `!sticker` | Transforma imagens e vídeos em figurinhas. |
| `!resume` | Resume em tópicos uma conversa em um grupo. |
| `!voice` | Converte texto em áudio (voz sintetizada). |
| `!yt` | Baixa vídeos do YouTube via link direto. |

### 💻 Sistema e Logs
Acesso de baixo nível e monitoramento (Restrito ao Owner).

| Comando | Descrição |
| :--- | :--- |
| `!getlog` | Envia o histórico de logs do bot. |
| `!exec` | Executa comandos no terminal da máquina host (Shell). |
| `!stats` | Envia um json com informações de consumo do PC do host |
---

## Instalação
```bash
    # Clone o repositório
    git clone https://github.com/Vinnybrunn00/whatsapp-sticker3.git

    # Entrar na pasta
    cd whatsapp-sticker3

    # Instalar dependencias
    npm i
```
---

## Segurança

> [!IMPORTANT]
> O comando `!exec` concede controle total sobre a máquina onde o bot está rodando. Certifique-se de configurar corretamente o ID do **Owner** no arquivo de configurações para evitar acessos não autorizados.

### Configurando o Owner
Em `lib/data/owner/owner.json` coloque entre `[]` o seu numero do whatsapp incluindo o codigo do país (juntos).

owner.json
```json
[
    "551234567890@c.us",
]
```

# Configuração da API do Gemini

Este projeto utiliza a API do **Google Gemini** para funcionamento da IA.

## Configuração da API Key

Para que a IA integrada funcione corretamente, é necessário configurar a chave da API do Gemini como uma variável de ambiente.

### Criar o arquivo .env no diretório raiz do projeto.

#### Windows / Linux / Mac:

### Setando a chave API do Gemini ao `.env`
```bash
$ echo export GEN_API_KEY="sua_api_key_aqui" >> .env
```
### Adicionando o número do host ao `.env`
```bash
$ echo export BOT_ID=numero_do_host_aqui >> .env
```
### Run - Compilado
```bash
$ npx tsc
$ node dist/bot.js
```

### Em produção
```bash
$ npx ts-node lib/bot.ts
```