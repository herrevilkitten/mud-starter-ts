import { Writable } from "stream";

export enum ClientState {
  ACTIVE,
  IDLE,
  AFK,
}

export interface ClientBufferText {
  text: string;
  timestamp: number;
}

export class ClientBuffer {
  buffer: ClientBufferText[] = [];
  timestamp = Date.now();

  add(input: string | string[]): number {
    if (Array.isArray(input)) {
      this.buffer.push(
        ...input.map((text) => ({ text, timestamp: Date.now() }))
      );
    } else {
      this.buffer.push({ text: input, timestamp: Date.now() });
    }
    this.timestamp = Date.now();
    return this.buffer.length;
  }

  clear() {
    this.buffer.length = 0;
  }

  get() {
    return this.buffer.shift();
  }
}

export class Client {
  clientId = "";
  state = ClientState.ACTIVE;
  input = new ClientBuffer();
  output = new ClientBuffer();
  sendCallback: ClientSendCallback;
  disconnectCallback: ClientDisconnectCallback;

  constructor(
    clientId: string,
    sendCallback: ClientSendCallback,
    disconnectCallback: ClientDisconnectCallback
  ) {
    this.clientId = clientId;
    this.sendCallback = sendCallback;
    this.disconnectCallback = disconnectCallback;
  }

  flush() {
    this.send(this.output);
    this.output.clear();
  }

  send(buffer: string | string[] | ClientBuffer) {
    let output: string[] = [];
    if (buffer instanceof ClientBuffer) {
      output.push(...buffer.buffer.map((buffer) => buffer.text));
      buffer.clear();
    } else if (Array.isArray(buffer)) {
      output.push(...buffer);
    } else {
      if (buffer === "") {
        return;
      }
      output.push(buffer);
    }

    if (output.length === 0) {
      return;
    }

    this.sendCallback(this, output);
  }

  disconnect() {
    this.disconnectCallback(this);
  }
}

export class ClientStream extends Writable {
  client: Client;
  constructor(client: Client) {
    super();
    this.client = client;
  }

  _write(
    chunk: any,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    this.client.send(chunk.toString());
    callback();
  }
}

class ClientMap extends Map<string, Client> {}

const CLIENTS = new ClientMap();

export function getAllClients() {
  return CLIENTS;
}

export function getClient(clientId: string) {
  return CLIENTS.get(clientId);
}

export function addClient(client: Client) {
  CLIENTS.set(client.clientId, client);
}

//export type ClientManager = (world: World) => void;

export type ClientSendCallback = (
  client: Client,
  text: string | string[]
) => boolean | void;

export type ClientDisconnectCallback = (client: Client) => boolean | void;
