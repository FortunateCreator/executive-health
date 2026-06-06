export default function TermsOfServicePage() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Terms of Service</h1>
      <p className="text-sm text-neutral-400">Last updated: June 1, 2026</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using Executive Health Score (&ldquo;the Platform&rdquo;),
        you agree to be bound by these Terms of Service. If you do not agree to
        these Terms, do not use the Platform.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Executive Health Score is an AI-powered health assessment and wellness
        tracking platform. It is <strong>NOT</strong> a medical device. It is{' '}
        <strong>NOT</strong> FDA-approved. The Platform is provided for
        informational purposes only.
      </p>

      <h2>3. User Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account
        credentials. You must be at least 18 years of age to use the Platform.
        Each individual is limited to one account.
      </p>

      <h2>4. User Data & Privacy</h2>
      <p>
        You retain ownership of your health data. We process your data to
        generate insights and improve the Platform. For more information, please
        see our Privacy Policy.
      </p>

      <h2>5. Acceptable Use</h2>
      <p>
        You agree not to misuse the Platform. Prohibited activities include,
        but are not limited to: unauthorized access, scraping, reverse
        engineering, or using the Platform for any illegal purpose.
      </p>

      <h2>6. Disclaimers</h2>
      <p>
        The Platform is provided for informational purposes only. It does not
        constitute medical advice, diagnosis, or treatment. Always consult a
        qualified healthcare professional regarding any medical concerns.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, Executive Health Score shall
        not be liable for any indirect, incidental, special, consequential, or
        punitive damages arising out of your use of the Platform.
      </p>

      <h2>8. Termination</h2>
      <p>
        We may suspend or terminate your account for violations of these Terms.
        You may delete your account at any time through your account settings.
      </p>

      <h2>9. Changes to These Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. We will provide
        at least 30 days&rsquo; notice before changes take effect, via email or
        a notification on the Platform.
      </p>

      <h2>10. Contact</h2>
      <p>
        If you have questions about these Terms, contact us at{' '}
        <a href="mailto:legal@executivehealthscore.com">
          legal@executivehealthscore.com
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
