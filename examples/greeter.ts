import { randomUUID } from "crypto";
import { Twired, dispatch, dispatchAwait } from "../lib/twired";

const users: Record<string, any> = {
  Jane: {
    birthday: new Date("1990-01-01"),
    email: "jane@example.com",
  },
  John: {
    anniversary: new Date("2000-01-01"),
  },
};

export class Greeter extends Twired {
  /**
   * Sample entry point to greeter, where we want to send a birthday
   * greeting to a person.
   * There are multiple steps involved, such as querying databases,
   * heavy string processing, and side effects.
   */
  @dispatch
  async sendBirthdayGreeting(recipient: string) {
    const eventType = "birthday";
    await this.validateEventForRecipient(recipient, eventType);
    const message = await this.generateGreetingMessage(recipient, eventType);
    await this.sendEmail(recipient, message);
  }

  @dispatchAwait
  private async validateEventForRecipient(recipient: string, event: string) {
    if (!users[recipient]) {
      throw new Error(`No user found for recipient: ${recipient}`);
    }

    if (!users[recipient]?.[event]) {
      throw new Error(`No ${event} found for recipient: ${recipient}`);
    }
  }

  @dispatchAwait
  private async generateGreetingMessage(recipient: string, event: string) {
    if (event === "birthday") {
      const user = users[recipient];
      const date = user[event];
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return `Happy ${age}th birthday!`;
    }

    if (event === "anniversary") {
      const user = users[recipient];
      const date = user[event];
      const now = new Date();
      const years = now.getFullYear() - date.getFullYear();
      return `Happy ${years}th anniversary!`;
    }

    throw new Error(`Event not supported: ${event}`);
  }

  @dispatch
  private async sendEmail(recipient: string, message: string) {
    console.log(`Sending email to ${recipient}: ${message}`);
    await this.saveEmail(randomUUID());
  }

  @dispatch
  private async saveEmail(messageId: string) {
    console.log(`Saved email with id: ${messageId}`);
  }
}
