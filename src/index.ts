import { config } from "dotenv";

config();

import { Client, getAllClients } from "./connection/client";
import { startConsoleClient } from "./connection/console/console-connection";
import { GameUpdater } from "./game";
import { InputProcessor } from "./interpreter";

const state = {
  mainLoop: {
    ticksPerSecond: 1,
  },
  running: true,
};

async function waitFor(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function mainLoop(updateGame: GameUpdater, processInput: InputProcessor) {
  const millisecondsPerTick = 1000 / state.mainLoop.ticksPerSecond;
  console.log("Starting mainLoop:", millisecondsPerTick);
  let inLoop = false;
  let mainLoopId = setInterval(() => {
    if (!state.running) {
      // The MUD is shutting down, so end the interval and exit the callback
      clearInterval(mainLoopId);
      return;
    }
    if (inLoop) {
      // A previous iteration of the loop is still going, so skip this tick
      return;
    }
    inLoop = true;

    // Process input for clients
    for (let [clientId, client] of getAllClients()) {
      console.log("Processing input ", clientId);
      processInput(client);
    }

    updateGame();

    // Send output
    for (let [clientId, client] of getAllClients()) {
      console.log("Processing output", clientId);
      client.flush();
    }

    inLoop = false;
  }, millisecondsPerTick);
}

async function main() {
  const updateGame = () => {};
  const processInput = (client: Client) => {
    const input = client.input.get();
    if (!input) {
      return;
    }
    console.log("Received:", input);
  };

  mainLoop(updateGame, processInput);
  startConsoleClient();
}

main();
