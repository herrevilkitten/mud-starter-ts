import { openStdin } from "process";
import { Client, addClient, getClient, ClientBufferText } from "../client";

const CLIENT_ID = "console";

function consoleClientSend(client: Client, text: string | string[]) {
  if (!Array.isArray(text)) {
    text = [text];
  }
  console.log(">>>", ...text);
}

function consoleClientDisconnect(client: Client) {
  console.log("Disconnecting and terminating.");
  process.exit(0);
}

export function startConsoleClient() {
  const stdin = openStdin();

  stdin.addListener("data", (data) => {
    const text = data.toString().trim();
    console.log("<<", text);
    let client = getClient(CLIENT_ID);
    if (!client) {
      client = new Client(
        CLIENT_ID,
        consoleClientSend,
        consoleClientDisconnect
      );
      addClient(client);
    }

    client.input.add(text);
  });
}
