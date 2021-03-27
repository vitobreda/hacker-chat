import { constants } from "./constants.js";

export default class EventManager {
  #allUsers = new Map();
  constructor({ componentEmiter, socketClient }) {
    this.componentEmiter = componentEmiter;
    this.socketClient = socketClient;
  }

  joinRoomAndWaitForMessages(data) {
    this.socketClient.sendMessage(constants.events.socket.JOIN_ROOM, data);
    this.componentEmiter.on(constants.events.app.MESSAGE_SENT, (msg) => {
      this.socketClient.sendMessage(constants.events.socket.MESSAGE, msg);
    });
  }

  disconnectUser(user) {
    const { userName, id } = user;
    this.#allUsers.delete(id);
    this.#updateActivityLogComponenet(`${userName} left!`);
    this.#updateUsersComponent();
  }

  updateUsers(users) {
    const connectedUsers = users;
    connectedUsers.forEach(({ id, userName }) =>
      this.#allUsers.set(id, userName)
    );
    this.#updateUsersComponent();
  }

  message(message) {
    this.componentEmiter.emit(constants.events.app.MESSAGE_RECEIVED, message);
  }

  newUserConnected(message) {
    const user = message;
    this.#allUsers.set(user.id, user.userName);
    this.#updateUsersComponent();
    this.#updateActivityLogComponenet(`${user.userName} joined!`);
  }

  #emitComponentUpdate(event, message) {
    this.componentEmiter.emit(event, message);
  }

  #updateUsersComponent() {
    this.#emitComponentUpdate(
      constants.events.app.STATUS_UPDATED,
      Array.from(this.#allUsers.values())
    );
  }

  #updateActivityLogComponenet(message) {
    this.#emitComponentUpdate(
      constants.events.app.ACTIVITYLOG_UPDATED,
      message
    );
  }

  getEvents() {
    // get all classes functions and create an array
    const functions = Reflect.ownKeys(EventManager.prototype)
      .filter((fn) => fn !== "constructor")
      .map((name) => [name, this[name].bind(this)]);

    return new Map(functions);
  }
}
