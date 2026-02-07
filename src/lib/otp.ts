// OTP Service - Handles sending and verifying OTP codes
// For MVP, uses mock service. Can be upgraded to Twilio/MSG91 for production.

export interface OTPService {
  sendOTP(phone: string, code: string): Promise<boolean>;
}

// Mock OTP Service - For development/testing
// OTP is logged to console instead of sent via SMS
class MockOTPService implements OTPService {
  async sendOTP(phone: string, code: string): Promise<boolean> {
    console.log('========================================');
    console.log(`📱 MOCK OTP SERVICE`);
    console.log(`Phone: ${phone}`);
    console.log(`OTP Code: ${code}`);
    console.log('========================================');
    return true;
  }
}

// Twilio OTP Service - For production
// Note: Install twilio package when ready to use: npm install twilio
class TwilioOTPService implements OTPService {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
  }

  async sendOTP(phone: string, code: string): Promise<boolean> {
    try {
      // Dynamic import to avoid issues when Twilio is not installed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const twilio = await import('twilio' as any);
      const client = twilio.default(this.accountSid, this.authToken);

      await client.messages.create({
        body: `Your MealMate verification code is: ${code}. Valid for 10 minutes.`,
        from: this.phoneNumber,
        to: phone,
      });

      return true;
    } catch (error) {
      console.error('Twilio error:', error);
      return false;
    }
  }
}

// MSG91 OTP Service - For India
class MSG91OTPService implements OTPService {
  private authKey: string;
  private templateId: string;

  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY || '';
    this.templateId = process.env.MSG91_TEMPLATE_ID || '';
  }

  async sendOTP(phone: string, code: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: this.authKey,
        },
        body: JSON.stringify({
          template_id: this.templateId,
          mobile: phone.replace('+91', ''),
          authkey: this.authKey,
          otp: code,
        }),
      });

      const data = await response.json();
      return data.type === 'success';
    } catch (error) {
      console.error('MSG91 error:', error);
      return false;
    }
  }
}

// Factory function to get the appropriate OTP service
export function getOTPService(): OTPService {
  const service = process.env.OTP_SERVICE || 'mock';

  switch (service) {
    case 'twilio':
      return new TwilioOTPService();
    case 'msg91':
      return new MSG91OTPService();
    case 'mock':
    default:
      return new MockOTPService();
  }
}

// Helper to format phone number
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Add country code if not present (default to India +91)
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // If already has country code
  if (digits.length > 10) {
    return `+${digits}`;
  }

  return phone;
}

// Validate phone number format
export function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}
