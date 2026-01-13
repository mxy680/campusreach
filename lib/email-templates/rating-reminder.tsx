import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Link,
  Preview,
} from "@react-email/components"
import * as React from "react"

type RatingReminderEmailProps = {
  volunteerName: string
  eventTitle: string
  organizationName: string | null
  baseUrl: string
}

export function RatingReminderEmail({
  volunteerName,
  eventTitle,
  organizationName,
  baseUrl,
}: RatingReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>How was your experience at {eventTitle}?</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>CampusReach</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Hi {volunteerName},</Text>

            <Text style={paragraph}>
              Thank you for volunteering at <strong>{eventTitle}</strong>
              {organizationName ? ` with ${organizationName}` : ""}! Your time
              and effort make a real difference in the community.
            </Text>

            <Section style={ratingBox}>
              <Text style={ratingQuestion}>How was your experience?</Text>
              <Text style={ratingSubtext}>
                Your feedback helps organizations improve and helps other
                volunteers find great opportunities.
              </Text>
            </Section>

            <Section style={ctaSection}>
              <Button style={button} href={`${baseUrl}/vol`}>
                Rate This Event
              </Button>
            </Section>

            <Text style={thankYouText}>
              Thanks for being part of the CampusReach community!
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              You received this email because you signed up for this event on
              CampusReach.
            </Text>
            <Link href={`${baseUrl}/vol/settings`} style={footerLink}>
              Manage email preferences
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderRatingReminder(props: RatingReminderEmailProps): Promise<string> {
  const { render } = await import("@react-email/components")
  return await render(<RatingReminderEmail {...props} />)
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
}

const header = {
  padding: "20px 30px",
  backgroundColor: "#18181b",
}

const logo = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold" as const,
  margin: "0",
}

const content = {
  padding: "20px 30px",
}

const greeting = {
  fontSize: "18px",
  fontWeight: "600" as const,
  color: "#18181b",
  marginBottom: "16px",
}

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#525f7f",
  marginBottom: "24px",
}

const ratingBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
  textAlign: "center" as const,
}

const ratingQuestion = {
  fontSize: "18px",
  fontWeight: "600" as const,
  color: "#92400e",
  margin: "0 0 8px 0",
}

const ratingSubtext = {
  fontSize: "13px",
  color: "#b45309",
  margin: "0",
}

const ctaSection = {
  textAlign: "center" as const,
  marginBottom: "24px",
}

const button = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
}

const thankYouText = {
  fontSize: "14px",
  color: "#6b7280",
  textAlign: "center" as const,
}

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
}

const footer = {
  padding: "0 30px",
}

const footerText = {
  fontSize: "12px",
  color: "#8898aa",
  lineHeight: "20px",
}

const footerLink = {
  fontSize: "12px",
  color: "#525f7f",
}
