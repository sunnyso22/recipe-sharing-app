import { Resend } from "resend";

const fromAddress = "Cookery <noreply@cookery.sunnyso22.dev>";

type OutboundMessage = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  openTracking: false;
  clickTracking: false;
};

type CapturedMailbox = {
  messages: OutboundMessage[];
  failNext: boolean;
};

let captured: CapturedMailbox | null = null;

const captureMailbox = () => {
  const box: CapturedMailbox = { messages: [], failNext: false };
  captured = box;

  return {
    messages: box.messages,
    failNextSend: () => {
      box.failNext = true;
    },
    stop: () => {
      if (captured === box) {
        captured = null;
      }
    },
  };
};

const deliverMessage = async (message: OutboundMessage) => {
  if (captured) {
    if (captured.failNext) {
      captured.failNext = false;
      throw new Error("The message could not be sent.");
    }

    captured.messages.push(message);
    return;
  }

  const key = process.env.RESEND_API_KEY?.trim();

  if (!key) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: message.from,
    to: message.to,
    replyTo: message.replyTo,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export { captureMailbox, deliverMessage, fromAddress };
export type { OutboundMessage };
