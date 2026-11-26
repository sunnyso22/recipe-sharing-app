import { render } from "@react-email/render";

import { deliverMessage, fromAddress } from "@/lib/mail/mailbox";
import { ResetMessage, resetText } from "@/lib/mail/reset-message";

const subject = "Reset your Cookery password";

const sendReset = async ({
  name,
  to,
  url,
}: {
  name: string;
  to: string;
  url: string;
}) => {
  const html = await render(<ResetMessage name={name} url={url} />);

  await deliverMessage({
    from: fromAddress,
    to,
    replyTo: fromAddress,
    subject,
    html,
    text: resetText(name, url),
    openTracking: false,
    clickTracking: false,
  });
};

export { sendReset, subject };
