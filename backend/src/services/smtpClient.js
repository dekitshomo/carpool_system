const tls = require('node:tls');
const net = require('node:net');

/**
 * Zero-dependency SMTP client supporting implicit TLS (465) and STARTTLS (587).
 */
class SmtpClient {
  getConfig() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number.parseInt(process.env.SMTP_PORT, 10) || 465;
    const user = (process.env.SMTP_USER || '').trim();
    const pass = (process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');
    const displayName = 'Carpool System';

    return { host, port, user, pass, displayName };
  }

  isConfigured() {
    const { user, pass } = this.getConfig();
    return Boolean(user && pass);
  }

  async sendMail({ to, subject, html, text }) {
    const config = this.getConfig();

    if (!config.user || !config.pass) {
      return {
        sent: false,
        reason: 'SMTP credentials not configured in backend/.env (SMTP_USER / SMTP_PASS are empty)'
      };
    }

    return new Promise((resolve) => {
      let socket;
      let state = 'greeting';
      let responseBuffer = '';
      let responseLines = [];
      let settled = false;

      const finish = (result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(result);
      };

      const timeout = setTimeout(() => {
        if (socket) socket.destroy();
        finish({
          sent: false,
          reason: 'SMTP connection timed out after 15s. Check network connectivity or firewall.'
        });
      }, 15000);

      const send = (command) => {
        socket.write(`${command}\r\n`);
      };

      const beginAuthentication = () => {
        state = 'auth';
        send('AUTH LOGIN');
      };

      const onSocketError = (err) => {
        const errorCode = err.code ? ` (${err.code})` : '';
        const errorDetails = [
          `host=${config.host}`,
          `port=${config.port}`,
          `phase=${state}`
        ].join(', ');
        const hint = ['ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH'].includes(err.code)
          ? ' Check outbound SMTP access, or try SMTP_PORT=587.'
          : err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN'
            ? ' Check SMTP_HOST and DNS connectivity.'
            : '';

        finish({
          sent: false,
          reason: `SMTP connection failed${errorCode} (${errorDetails}): ${err.message}.${hint}`
        });
      };

      const onClose = () => {
        if (!settled) {
          finish({ sent: false, reason: 'SMTP connection closed before the email was accepted.' });
        }
      };

      const attachSocketHandlers = (activeSocket) => {
        activeSocket.on('data', onData);
        activeSocket.on('error', onSocketError);
        activeSocket.on('close', onClose);
      };

      const encodeHeader = (value) => {
        const safeValue = String(value || '').replace(/[\r\n]+/g, ' ').trim();
        return /^[\x20-\x7e]*$/.test(safeValue)
          ? safeValue
          : `=?UTF-8?B?${Buffer.from(safeValue, 'utf8').toString('base64')}?=`;
      };

      const wrapBase64 = (value) => Buffer.from(String(value || ''), 'utf8')
        .toString('base64')
        .match(/.{1,76}/g)
        ?.join('\r\n') || '';

      const sendMessage = () => {
        const safeFrom = `${encodeHeader(config.displayName)} <${config.user}>`;
        const safeTo = String(to || '').replace(/[\r\n]+/g, '').trim();
        const boundary = `alt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const plainText = text || html || '';
        const htmlBody = html || text || '';
        const message = [
          `From: ${safeFrom}`,
          `To: ${safeTo}`,
          `Subject: ${encodeHeader(subject)}`,
          `Date: ${new Date().toUTCString()}`,
          `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@gmail.com>`,
          'MIME-Version: 1.0',
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          'Content-Type: text/plain; charset=UTF-8',
          'Content-Transfer-Encoding: base64',
          '',
          wrapBase64(plainText),
          `--${boundary}`,
          'Content-Type: text/html; charset=UTF-8',
          'Content-Transfer-Encoding: base64',
          '',
          wrapBase64(htmlBody),
          `--${boundary}--`
        ].join('\r\n').replace(/(^|\r\n)\./g, '$1..');

        state = 'message';
        socket.write(`${message}\r\n.\r\n`);
      };

      const promoteToTls = () => {
        const plainSocket = socket;
        plainSocket.removeListener('data', onData);
        plainSocket.removeListener('error', onSocketError);
        plainSocket.removeListener('close', onClose);

        state = 'ehloTls';
        socket = tls.connect({
          socket: plainSocket,
          servername: config.host,
          rejectUnauthorized: true
        });
        attachSocketHandlers(socket);
        socket.once('secureConnect', () => send('EHLO localhost'));
      };

      const handleResponse = (code, response) => {
        if (code >= 400) {
          const hint = code === 535
            ? ' (Gmail requires a 16-character App Password with 2-Step Verification enabled)'
            : '';
          finish({ sent: false, reason: `SMTP Error ${code}: ${response}${hint}` });
          if (socket && !socket.destroyed) socket.end();
          return;
        }

        switch (state) {
          case 'greeting':
            if (code !== 220) break;
            state = 'ehlo';
            send('EHLO localhost');
            return;
          case 'ehlo':
            if (code !== 250) break;
            if (config.port === 587) {
              state = 'starttls';
              send('STARTTLS');
            } else {
              beginAuthentication();
            }
            return;
          case 'starttls':
            if (code !== 220) break;
            promoteToTls();
            return;
          case 'ehloTls':
            if (code !== 250) break;
            beginAuthentication();
            return;
          case 'auth':
            if (code !== 334) break;
            state = 'authUser';
            send(Buffer.from(config.user).toString('base64'));
            return;
          case 'authUser':
            if (code !== 334) break;
            state = 'authPass';
            send(Buffer.from(config.pass).toString('base64'));
            return;
          case 'authPass':
            if (code !== 235) break;
            state = 'mailFrom';
            send(`MAIL FROM:<${config.user}>`);
            return;
          case 'mailFrom':
            if (code !== 250) break;
            state = 'rcptTo';
            send(`RCPT TO:<${to}>`);
            return;
          case 'rcptTo':
            if (code !== 250 && code !== 251) break;
            state = 'data';
            send('DATA');
            return;
          case 'data':
            if (code !== 354) break;
            sendMessage();
            return;
          case 'message':
            if (code !== 250) break;
            send('QUIT');
            finish({
              sent: true,
              message: 'Email accepted by the SMTP server and dispatched to recipient'
            });
            socket.end();
            return;
          default:
            break;
        }

        finish({
          sent: false,
          reason: `Unexpected SMTP response in ${state} state: ${response}`
        });
        if (socket && !socket.destroyed) socket.end();
      };

      function onData(data) {
        responseBuffer += data.toString('utf8');
        let lineEnd;

        while ((lineEnd = responseBuffer.indexOf('\n')) !== -1) {
          const line = responseBuffer.slice(0, lineEnd).replace(/\r$/, '');
          responseBuffer = responseBuffer.slice(lineEnd + 1);
          responseLines.push(line);

          const match = line.match(/^(\d{3})([- ])?/);
          if (!match || match[2] === '-') continue;

          const response = responseLines.join('\n');
          responseLines = [];
          handleResponse(Number(match[1]), response);
          if (settled) return;
        }
      }

      if (config.port === 465) {
        socket = tls.connect({
          host: config.host,
          port: config.port,
          servername: config.host,
          rejectUnauthorized: true
        });
      } else {
        socket = net.connect({ host: config.host, port: config.port });
      }

      attachSocketHandlers(socket);
    });
  }
}

module.exports = new SmtpClient();
