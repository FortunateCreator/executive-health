export default function DisclaimerPage() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Medical Disclaimer</h1>
      <p className="text-sm text-neutral-400">Last updated: June 1, 2026</p>

      <div className="not-prose my-8 rounded-lg border border-red-800 bg-red-950/50 px-6 py-4">
        <p className="text-red-400 font-semibold">
          ⚠️ THIS PLATFORM IS NOT A MEDICAL DEVICE. IT IS NOT FDA-APPROVED. IT
          DOES NOT PROVIDE MEDICAL ADVICE.
        </p>
      </div>

      <h2>1. No Medical Advice</h2>
      <p>
        The content and insights provided by Executive Health Score are for
        informational purposes only. The Platform does not diagnose, treat,
        cure, or prevent any disease or medical condition.
      </p>

      <h2>2. Not a Substitute for Professional Medical Advice</h2>
      <p>
        Never disregard or delay seeking professional medical advice because of
        information you have received through this Platform. In the event of a
        medical emergency, call 911 immediately.
      </p>

      <h2>3. No Doctor-Patient Relationship</h2>
      <p>
        Use of the Platform does not create a doctor-patient relationship. No
        licensed healthcare professional reviews your data for clinical
        diagnostic purposes.
      </p>

      <h2>4. Accuracy of Information</h2>
      <p>
        AI-generated health insights may be inaccurate, incomplete, or
        misleading. Do not base medical decisions solely on outputs from this
        Platform.
      </p>

      <h2>5. Emergency</h2>
      <p>
        If you are experiencing chest pain, difficulty breathing, severe
        bleeding, suicidal thoughts, or any other medical emergency, call 911
        or your local emergency services immediately.
      </p>

      <h2>6. User Responsibility</h2>
      <p>
        You are solely responsible for your health decisions. Always consult
        a qualified healthcare professional before making changes to your
        diet, exercise, medication, or treatment plan.
      </p>

      <h2>7. No Guarantee</h2>
      <p>
        We do not guarantee that the Platform will prevent, detect, or predict
        any medical condition, disease, or health outcome.
      </p>

      <h2>8. Contact</h2>
      <p>
        If you have concerns about this disclaimer, contact us at{' '}
        <a href="mailto:concerns@executivehealthscore.com">
          concerns@executivehealthscore.com
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
