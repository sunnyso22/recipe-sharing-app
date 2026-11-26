import { render } from "@react-email/render";

import {
  ConfirmationMessage,
  confirmationText,
} from "@/lib/mail/confirmation-message";
import { deliverMessage, fromAddress } from "@/lib/mail/mailbox";

const subject = "Confirm your email for Cookery";

const sendConfirmation = async ({
  name,
  to,
  url,
}: {
  name: string;
  to: string;
  url: string;
}) => {
  const html = await render(<ConfirmationMessage name={name} url={url} />);

  await deliverMessage({
    from: fromAddress,
    to,
    replyTo: fromAddress,
    subject,
    html,
    text: confirmationText(name, url),
    openTracking: false,
    clickTracking: false,
  });
};

export { sendConfirmation, subject };
