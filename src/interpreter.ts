import { Client, ClientBufferText } from "./connection/client";

export type InputProcessor = (client: Client) => void;