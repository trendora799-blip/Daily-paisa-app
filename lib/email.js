import nodemailer from 'nodemailer';

// Create and configure the email transporter for Bravo SMTP Relay
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.BRAVO_SMTP_HOST || 'smtp.relay.bravo.com',
    port: parseInt(process.env.BRAVO_SMTP_PORT || '587', 10),
    secure: false, // true for 465, false for 587 (STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Helps with self-signed certificates on some relays
    },
  });
};

// Verify transporter connection (useful for debugging)
export async function verifyEmailConnection() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Bravo Email service is connected and ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Bravo Email service connection failed:', error.message);
    return false;
  }
}

// Send OTP Email
export async function sendOTPEmail(email, otp, userName = 'User') {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Daily Paisa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Password Reset OTP - Daily Paisa',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background-color: #f4f4f4; 
            margin: 0; 
            padding: 0; 
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: #ffffff; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
          }
          .header { 
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            color: white; 
            margin: 0; 
            font-size: 32px; 
            font-weight: 700;
          }
          .header p {
            color: rgba(255,255,255,0.9);
            margin: 10px 0 0 0;
            font-size: 16px;
          }
          .content { 
            padding: 40px 30px; 
          }
          .greeting {
            font-size: 18px;
            color: #1e293b;
            margin-bottom: 20px;
          }
          .otp-box { 
            background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%); 
            border: 3px dashed #6366f1; 
            border-radius: 12px; 
            padding: 30px; 
            text-align: center; 
            margin: 30px 0; 
          }
          .otp-code { 
            font-size: 42px; 
            font-weight: bold; 
            color: #6366f1; 
            letter-spacing: 8px; 
            font-family: 'Courier New', monospace;
            display: inline-block;
            margin: 10px 0;
          }
          .validity {
            color: #64748b;
            font-size: 14px;
            margin-top: 10px;
          }
          .warning { 
            background: #fffbeb; 
            border-left: 4px solid #f59e0b; 
            padding: 15px; 
            margin: 25px 0; 
            color: #92400e;
            border-radius: 6px;
          }
          .warning strong {
            display: block;
            margin-bottom: 5px;
          }
          .footer { 
            background: #f8fafc; 
            padding: 25px; 
            text-align: center; 
            color: #64748b; 
            font-size: 13px; 
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Daily Paisa</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <p class="greeting">Hello ${userName},</p>
            <p>We received a request to reset your password for your Daily Paisa account.</p>
            
            <div class="otp-box">
              <p style="margin: 0 0 15px 0; color: #475569; font-size: 16px; font-weight: 600;">Your One-Time Password (OTP):</p>
              <div class="otp-code">${otp}</div>
              <p class="validity">⏰ Valid for 10 minutes only</p>
            </div>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              If you didn't request this password reset, please ignore this email. Do not share this OTP with anyone.
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Daily Paisa. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Daily Paisa - Password Reset OTP
      
      Hello ${userName},
      
      Your OTP code is: ${otp}
      
      This code is valid for 10 minutes.
      
      If you didn't request this password reset, please ignore this email.
      
      © ${new Date().getFullYear()} Daily Paisa
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send OTP email via Bravo SMTP:', error);
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
                                        }
