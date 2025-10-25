import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendVerificationEmail(
  to: string,
  token: string,
  name: string
) {
  const transporter = getTransporter();
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Mercado de Pulgas'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: 'Verificação de E-mail - Mercado de Pulgas',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bem-vindo ao Mercado de Pulgas!</h1>
            </div>
            <div class="content">
              <p>Olá ${name},</p>
              <p>Obrigado por se cadastrar no Mercado de Pulgas. Para ativar sua conta, clique no botão abaixo:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verificar E-mail</a>
              </p>
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              <p>Este link expira em 24 horas.</p>
              <p>Se você não criou esta conta, pode ignorar este e-mail.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Mercado de Pulgas. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendSuspiciousLoginAlert(
  to: string,
  name: string,
  details: {
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    location?: string;
  }
) {
  const transporter = getTransporter();

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Mercado de Pulgas - Segurança'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: '🔒 Alerta de Login Suspeito - Mercado de Pulgas',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .alert { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            .details { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Alerta de Segurança</h1>
            </div>
            <div class="content">
              <p>Olá ${name},</p>
              <div class="alert">
                <strong>⚠️ Detectamos uma tentativa de login suspeita em sua conta.</strong>
              </div>
              <p>Um login incomum foi detectado com as seguintes características:</p>
              <div class="details">
                <div class="detail-row">
                  <strong>Data/Hora:</strong>
                  <span>${details.timestamp.toLocaleString('pt-BR')}</span>
                </div>
                <div class="detail-row">
                  <strong>Endereço IP:</strong>
                  <span>${details.ipAddress}</span>
                </div>
                ${details.location ? `
                <div class="detail-row">
                  <strong>Localização:</strong>
                  <span>${details.location}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <strong>Dispositivo:</strong>
                  <span>${details.userAgent.substring(0, 60)}...</span>
                </div>
              </div>
              <p><strong>Se foi você:</strong> Não é necessário fazer nada. Sua conta está segura.</p>
              <p><strong>Se não foi você:</strong> Recomendamos que você:</p>
              <ul>
                <li>Altere sua senha imediatamente</li>
                <li>Revise as configurações de segurança da sua conta</li>
                <li>Ative a autenticação de dois fatores (2FA)</li>
              </ul>
              <p style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/profile?tab=security" class="button">Verificar Segurança</a>
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Mercado de Pulgas - Equipe de Segurança</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function send2FASetupEmail(
  to: string,
  name: string
) {
  const transporter = getTransporter();

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Mercado de Pulgas'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: '🔐 Autenticação de Dois Fatores Ativada',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 2FA Ativada com Sucesso</h1>
            </div>
            <div class="content">
              <p>Olá ${name},</p>
              <div class="success">
                <strong>✅ A autenticação de dois fatores foi ativada em sua conta!</strong>
              </div>
              <p>A partir de agora, além da senha, você precisará de um código de verificação do seu aplicativo autenticador para fazer login.</p>
              <p><strong>Importante:</strong></p>
              <ul>
                <li>Mantenha seu dispositivo autenticador seguro</li>
                <li>Guarde seus códigos de backup em local seguro</li>
                <li>Se perder acesso ao autenticador, entre em contato com o suporte</li>
              </ul>
              <p>Se você não realizou esta ação, entre em contato conosco imediatamente.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Mercado de Pulgas</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}
