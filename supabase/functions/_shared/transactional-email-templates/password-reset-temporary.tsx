import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Agenda UCP'

interface PasswordResetTemporaryProps {
  name?: string
  tempPassword?: string
}

const PasswordResetTemporaryEmail = ({
  name,
  tempPassword,
}: PasswordResetTemporaryProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu contraseña temporal de {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Hola, ${name}` : 'Recuperación de contraseña'}
        </Heading>
        <Text style={text}>
          Recibimos una solicitud para recuperar el acceso a tu cuenta de{' '}
          {SITE_NAME}. Generamos una contraseña temporal con la cual podrás
          iniciar sesión nuevamente.
        </Text>

        <Section style={passwordBox}>
          <Text style={passwordLabel}>Tu contraseña temporal</Text>
          <Text style={passwordValue}>{tempPassword ?? '••••••••••••'}</Text>
        </Section>

        <Text style={text}>
          Por seguridad, te recomendamos iniciar sesión y cambiarla inmediatamente
          desde tu perfil, en la opción <strong>Cambiar contraseña</strong>.
        </Text>

        <Text style={warning}>
          Si tú no solicitaste este cambio, contacta de inmediato al área de
          soporte institucional. Tu contraseña anterior ya no es válida.
        </Text>

        <Text style={footer}>
          Este es un mensaje automático de {SITE_NAME}. Por favor, no respondas a
          este correo.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PasswordResetTemporaryEmail,
  subject: 'Tu contraseña temporal de Agenda UCP',
  displayName: 'Recuperación de contraseña (temporal)',
  previewData: { name: 'Juan Pérez', tempPassword: 'Ab3#xY9!kQ2m' },
} satisfies TemplateEntry

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 28px',
}

const h1: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#0f172a',
  margin: '0 0 20px',
}

const text: React.CSSProperties = {
  fontSize: '15px',
  color: '#334155',
  lineHeight: '1.6',
  margin: '0 0 18px',
}

const passwordBox: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '24px 0',
}

const passwordLabel: React.CSSProperties = {
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  color: '#64748b',
  margin: '0 0 8px',
}

const passwordValue: React.CSSProperties = {
  fontFamily: '"SF Mono", Menlo, Consolas, monospace',
  fontSize: '20px',
  fontWeight: 700,
  color: '#0f172a',
  letterSpacing: '0.04em',
  margin: 0,
}

const warning: React.CSSProperties = {
  fontSize: '13px',
  color: '#9a3412',
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '6px',
  padding: '12px 14px',
  lineHeight: '1.5',
  margin: '0 0 24px',
}

const footer: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '32px 0 0',
  borderTop: '1px solid #e2e8f0',
  paddingTop: '16px',
}
