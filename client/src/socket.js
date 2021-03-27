import Event from "events";

export default class SocketClient {
  #ServerConnection;
  #serverListener = new Event();

  constructor({ host, port, protocol }) {
    this.host = host;
    this.port = port;
    this.protocol = protocol;
  }

  sendMessage(event, message) {
    this.#ServerConnection.write(JSON.stringify({ event, message }));
  }

  attachEvents(events) {
    this.#ServerConnection.on("data", (data) => {
      try {
        data
          .toString()
          .split("\n")
          .filter((line) => !!line)
          .map(JSON.parse)
          .map(({ event, message }) => {
            this.#serverListener.emit(event, message);
          });
      } catch (error) {
        console.log("invalid!", data.toString(), error);
      }
    });

    this.#ServerConnection.on("end", () => {
      console.log("I disconnected!");
    });

    this.#ServerConnection.on("error", (error) => {
      console.log("DEU RUIM", error);
    });

    for (const [key, value] of events) {
      this.#serverListener.on(key, value);
    }
  }

  async createConnection() {
    const options = {
      port: this.port,
      host: this.host,
      headers: {
        Connection: "Upgrade",
        Upgrade: "websocket",
      },
    };

    const http = await import(this.protocol);
    const req = http.request(options);
    req.end();

    return new Promise((resolve) => {
      //listen to the event once
      req.once("upgrade", (req, socket) => resolve(socket));
    });
  }

  async initialize() {
    this.#ServerConnection = await this.createConnection();
    console.log("I connected to the server!!");
  }
}
