import { randomUUID } from "crypto";
import { Twired, dispatch } from "twired";

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
   * Slightly modified from the shared greeter example to showcase
   * a dispatch-only version for an executor that doesn't return
   * values
   */
  @dispatch
  async sendBirthdayGreeting(recipient: string) {
    const eventType = "birthday";
    await this.validateEventForRecipient(recipient, eventType);
    await this.generateAndSendGreeting(recipient, eventType);
  }

  protected async validateEventForRecipient(recipient: string, event: string) {
    if (!users[recipient]) {
      throw new Error(`No user found for recipient: ${recipient}`);
    }

    if (!users[recipient]?.[event]) {
      throw new Error(`No ${event} found for recipient: ${recipient}`);
    }
  }

  @dispatch
  async generateAndSendGreeting(recipient: string, event: string) {
    const message = await this.generateGreetingMessage(recipient, event);
    await this.sendEmail(recipient, message);
  }

  async generateGreetingMessage(recipient: string, event: string) {
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
  async sendEmail(recipient: string, message: string) {
    console.log(`Sending email to ${recipient}: ${message}`);
    await this.saveEmail(randomUUID());
  }

  @dispatch
  async saveEmail(messageId: string) {
    console.log(`Saved email with id: ${messageId}`);
  }
}
