const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@invoicehub.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const log = (msg) => console.log(msg);

const run = async () => {
  const results = [];

  try {
    log(`Testing base URL: ${BASE}`);

    // Health
    try {
      const r = await axios.get(`${BASE}/api/health`);
      results.push({ name: 'GET /api/health', ok: r.status === 200 && r.data && r.data.status === 'ok', status: r.status, body: r.data });
      log(`✔ GET /api/health => ${r.status}`);
    } catch (err) {
      results.push({ name: 'GET /api/health', ok: false, error: err.toString() });
      log(`✖ GET /api/health => ${err}`);
    }

    // Login
    let token = null;
    try {
      const r = await axios.post(`${BASE}/api/auth/login`, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, { timeout: 10000 });
      const ok = r.status === 200 && r.data && r.data.data && r.data.data.token;
      results.push({ name: 'POST /api/auth/login', ok, status: r.status, body: r.data });
      log(`✔ POST /api/auth/login => ${r.status}`);
      if (ok) token = r.data.data.token;
    } catch (err) {
      results.push({ name: 'POST /api/auth/login', ok: false, error: err.toString() });
      log(`✖ POST /api/auth/login => ${err}`);
    }

    // Protected route without token
    try {
      await axios.get(`${BASE}/api/invoices`);
      results.push({ name: 'GET /api/invoices (no token)', ok: false, note: 'Expected 401/403 but succeeded' });
      log('✖ GET /api/invoices (no token) => unexpectedly succeeded');
    } catch (err) {
      const status = err.response?.status || 'ERR';
      results.push({ name: 'GET /api/invoices (no token)', ok: status === 401 || status === 403, status, body: err.response?.data });
      log(`✔ GET /api/invoices (no token) => ${status}`);
    }

    // Protected route with token
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const r = await axios.get(`${BASE}/api/invoices`, { headers: authHeaders });
      results.push({ name: 'GET /api/invoices (with token)', ok: r.status === 200 && r.data && 'success' in r.data, status: r.status, body: r.data });
      log(`✔ GET /api/invoices (with token) => ${r.status}`);
    } catch (err) {
      results.push({ name: 'GET /api/invoices (with token)', ok: false, error: err.toString() });
      log(`✖ GET /api/invoices (with token) => ${err}`);
    }

    // Upload preview (multipart)
    const sampleFilePath = path.resolve(__dirname, '../uploads/invoices/sample-invoice.txt');
    if (fs.existsSync(sampleFilePath)) {
      try {
        const form = new FormData();
  // multer is configured with upload.single('invoice') so the field name must be 'invoice'
  form.append('invoice', fs.createReadStream(sampleFilePath));

        const r = await axios.post(`${BASE}/api/invoices/preview`, form, { headers: { ...form.getHeaders(), ...authHeaders }, maxBodyLength: Infinity });
        results.push({ name: 'POST /api/invoices/preview', ok: r.status === 200 && r.data && r.data.success === true, status: r.status, body: r.data });
        log(`✔ POST /api/invoices/preview => ${r.status}`);
      } catch (err) {
        results.push({ name: 'POST /api/invoices/preview', ok: false, error: err.toString(), body: err.response?.data });
        log(`✖ POST /api/invoices/preview => ${err}`);
      }
    } else {
      results.push({ name: 'POST /api/invoices/preview', ok: false, note: `Sample file missing at ${sampleFilePath}` });
      log(`⚠ Sample file not found: ${sampleFilePath} — skipping preview test`);
    }

    // Fetch static upload file
    const staticSampleUrl = `${BASE}/uploads/invoices/sample-invoice.txt`;
    try {
      const r = await axios.get(staticSampleUrl);
      results.push({ name: `GET ${staticSampleUrl}`, ok: r.status === 200, status: r.status, bodyPreview: (typeof r.data === 'string' ? r.data.substring(0, 200) : null) });
      log(`✔ GET /uploads/invoices/sample-invoice.txt => ${r.status}`);
    } catch (err) {
      results.push({ name: `GET ${staticSampleUrl}`, ok: false, error: err.toString() });
      log(`✖ GET /uploads/invoices/sample-invoice.txt => ${err}`);
    }

    // Try mailbox of routes that require role checks (approve/reject) - expect 403 for clerk/admin mismatch if no invoices exist
    // We'll attempt to call approve-reject on a non-existent ID to see auth enforcement
    try {
      const r = await axios.post(`${BASE}/api/invoices/000000000000000000000000/approve-reject`, { action: 'approved' }, { headers: authHeaders });
      results.push({ name: 'POST approve-reject on fake id', ok: r.status !== 200 ? true : false, status: r.status, body: r.data });
      log(`✔ POST /api/invoices/:id/approve-reject => ${r.status}`);
    } catch (err) {
      const status = err.response?.status || 'ERR';
      // We expect either 404 (not found) or 403 (no permission) if token lacks role
      results.push({ name: 'POST approve-reject on fake id', ok: [403,404].includes(status), status, body: err.response?.data });
      log(`✔ POST /api/invoices/:id/approve-reject => ${status}`);
    }

  } catch (topErr) {
    console.error('Top-level error:', topErr);
    results.push({ name: 'top-level', ok: false, error: topErr.toString() });
  }

  // Write results to docs log
  const out = [];
  out.push(`# API Endpoint Smoke Test - ${new Date().toISOString()}\n`);
  out.push('Base URL: ' + BASE + '\n');
  results.forEach(r => {
    out.push('## ' + r.name);
    out.push('- ok: ' + r.ok);
    if (r.status) out.push('- status: ' + r.status);
    if (r.note) out.push('- note: ' + r.note);
    if (r.error) out.push('- error: ' + String(r.error));
    if (r.body) out.push('- body: ```json\n' + JSON.stringify(r.body, null, 2) + '\n```');
    if (r.bodyPreview) out.push('- bodyPreview: ```\n' + r.bodyPreview + '\n```');
    out.push('\n');
  });

  const docsPath = path.resolve(__dirname, '../../docs');
  if (!fs.existsSync(docsPath)) fs.mkdirSync(docsPath, { recursive: true });
  const logPath = path.resolve(docsPath, 'api-test-log.md');
  fs.writeFileSync(logPath, out.join('\n'));
  log(`\nTest results written to ${logPath}`);
};

run().catch(err => { console.error('Run failed:', err); process.exit(1); });
