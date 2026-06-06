export default function PrivacyPolicyPage() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-neutral-400">Last updated: June 1, 2026</p>

      <h2>1. Information We Collect</h2>
      <p>
        We collect the following categories of information:
      </p>
      <ul>
        <li><strong>Account data:</strong> name and email address provided during registration.</li>
        <li><strong>Health data:</strong> sleep metrics, stress levels, nutrition logs, and vital sign readings you provide.</li>
        <li><strong>Usage data:</strong> interactions with the Platform, features accessed, and time spent.</li>
        <li><strong>Device information:</strong> browser type, operating system, and IP address.</li>
      </ul>

      <h2>2. How We Use Information</h2>
      <p>
        We use your information to:
      </p>
      <ul>
        <li>Generate personalized health insights and wellness recommendations.</li>
        <li>Improve our AI models and platform features.</li>
        <li>Personalize your experience.</li>
        <li>Send service updates and administrative messages.</li>
        <li>Comply with legal obligations.</li>
      </ul>
      <p>
        We <strong>NEVER</strong> sell your health data to third parties.
      </p>

      <h2>3. Data Storage & Security</h2>
      <p>
        All data is encrypted at rest using AES-256 encryption. Data in transit
        is protected by TLS 1.3. Our servers are located in the United States.
      </p>

      <h2>4. Data Retention</h2>
      <p>
        We retain your data for as long as your account remains active. Upon
        account deletion, your personal data is anonymized within 90 days.
      </p>

      <h2>5. Third-Party Services</h2>
      <p>
        We rely on the following third-party services to operate the Platform:
      </p>
      <ul>
        <li><strong>Supabase:</strong> database and authentication services.</li>
        <li><strong>DeepSeek:</strong> AI model provider for health insights.</li>
      </ul>
      <p>
        Each third-party service maintains its own independent privacy policy.
      </p>

      <h2>6. Cookies</h2>
      <p>
        We use functional cookies only, strictly necessary for authentication
        and session management. We do not use tracking cookies or advertising
        cookies.
      </p>

      <h2>7. Your Rights</h2>
      <p>
        You have the right to access, correct, export, or delete your personal
        data. To exercise these rights, contact us at{' '}
        <a href="mailto:privacy@executivehealthscore.com">
          privacy@executivehealthscore.com
        </a>
        .
      </p>

      <h2>8. Children&rsquo;s Privacy</h2>
      <p>
        The Platform is not intended for users under the age of 18. We do not
        knowingly collect personal information from minors.
      </p>

      <h2>9. International Transfers</h2>
      <p>
        Your data is processed and stored in the United States. By using the
        Platform, you consent to this transfer and processing.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We will provide at least 30 days&rsquo; notice before material changes
        to this Privacy Policy take effect.
      </p>

      <h2>11. Contact</h2>
      <p>
        For privacy-related inquiries, contact us at{' '}
        <a href="mailto:privacy@executivehealthscore.com">
          privacy@executivehealthscore.com
        </a>
        .
      </p>

      <hr className="my-8 border-neutral-700" />

      <div className="not-prose text-sm text-neutral-400 leading-relaxed">
        <p className="font-semibold text-neutral-300 mb-2">Executive Health Score Inc.</p>
        <p>Registered Address: 548 Market Street, Suite 51874, San Francisco, CA 94104</p>
        <p>Contact: <a href="mailto:legal@executivehealthscore.com" className="text-blue-400 underline">legal@executivehealthscore.com</a></p>
        <p>Jurisdiction: California, United States</p>
      </div>
    </div>
  );
}
