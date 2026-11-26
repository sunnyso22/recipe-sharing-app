import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Text,
} from "@react-email/components";

const pageColor = "#f6f1ea";
const cardColor = "#f3eadc";
const textColor = "#44403c";
const buttonColor = "#8c4a2f";

type ConfirmationMessageProps = {
  name: string;
  url: string;
};

const ConfirmationMessage = ({ name, url }: ConfirmationMessageProps) => {
  return (
    <Html>
      <Head />
      <Body
        style={{
          backgroundColor: pageColor,
          color: textColor,
          fontFamily: "Georgia, serif",
          margin: 0,
          padding: "32px 16px",
        }}
      >
        <Container
          style={{
            backgroundColor: cardColor,
            borderRadius: "16px",
            margin: "0 auto",
            maxWidth: "480px",
            padding: "32px",
          }}
        >
          <Text
            style={{
              color: textColor,
              fontSize: "20px",
              fontWeight: 600,
              margin: "0 0 24px",
            }}
          >
            Cookery
          </Text>
          <Text style={{ color: textColor, fontSize: "16px", margin: "0 0 12px" }}>
            {`Hello ${name},`}
          </Text>
          <Text style={{ color: textColor, fontSize: "16px", margin: "0 0 24px" }}>
            Verify your email to sign in to Cookery. This link lasts 10 minutes.
          </Text>
          <Button
            href={url}
            style={{
              backgroundColor: buttonColor,
              borderRadius: "8px",
              color: "#fffaf3",
              display: "inline-block",
              fontSize: "16px",
              padding: "12px 20px",
              textDecoration: "none",
            }}
          >
            Confirm and sign in
          </Button>
          <Text
            style={{
              color: textColor,
              fontSize: "14px",
              margin: "24px 0 0",
              wordBreak: "break-all",
            }}
          >
            {url}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const confirmationText = (name: string, url: string) => {
  return [
    `Hello ${name},`,
    "",
    "Verify your email to sign in to Cookery. This link lasts 10 minutes.",
    "",
    "Confirm and sign in",
    url,
  ].join("\n");
};

export { ConfirmationMessage, confirmationText };
