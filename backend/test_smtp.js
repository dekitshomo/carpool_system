require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const emailService = require('./src/services/emailService');
const smtpClient = require('./src/services/smtpClient');

async function testSmtp() {
  const targetEmail = process.argv[2] || '07240066.sherubtse@rub.edu.bt';
  const sampleName = 'Deki Tshomo';
  const sampleCode = '613218';
  const sampleToken = 'test_token_' + Date.now();

  console.log('\n======================================================');
  console.log('🧪 TESTING GMAIL SMTP & CARPOOL SYSTEM EMAIL TEMPLATE');
  console.log('======================================================');
  console.log(`Target Email:   ${targetEmail}`);
  console.log(`Recipient Name: ${sampleName}`);
  console.log(`Code to Send:   ${sampleCode}`);
  console.log(`SMTP Host:      ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
  console.log(`SMTP Port:      ${process.env.SMTP_PORT || 465}`);
  console.log(`SMTP User:      ${process.env.SMTP_USER ? process.env.SMTP_USER : '⚠️ NOT SET (Open backend/.env to set)'}`);
  console.log(`SMTP Pass:      ${process.env.SMTP_PASS ? '******** (configured)' : '⚠️ NOT SET (Open backend/.env to set)'}`);
  console.log('------------------------------------------------------');

  if (!smtpClient.isConfigured()) {
    console.log('\n⚠️  SMTP credentials are not configured yet in backend/.env!');
    console.log('👉 To send real emails to your Gmail account:');
    console.log('   1. Open https://myaccount.google.com/apppasswords');
    console.log('   2. Generate a 16-character App Password (e.g. abcd efgh ijkl mnop)');
    console.log('   3. Put your Gmail in SMTP_USER and the 16-character password in SMTP_PASS in backend/.env');
    console.log('   4. Re-run: node backend/test_smtp.js ' + targetEmail);
    console.log('------------------------------------------------------\n');
  }

  console.log('Dispatching Carpool System verification email...');
  try {
    const result = await emailService.sendVerificationEmail({
      toEmail: targetEmail,
      name: sampleName,
      code: sampleCode,
      token: sampleToken
    });

    console.log('\nRESULT:');
    console.log(JSON.stringify(result, null, 2));

    if (result.live_sent) {
      console.log('\n🎉 SUCCESS! The email has been sent directly to ' + targetEmail);
      console.log('Check your Gmail inbox on your phone or web browser!');
    } else {
      console.log('\nℹ️ Email was recorded in local database (Simulated Mailbox).');
      console.log('Reason: ' + result.reason);
    }
  } catch (err) {
    console.error('\n❌ Error sending email:', err.message);
  }
}

testSmtp();
