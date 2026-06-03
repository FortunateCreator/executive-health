'use client';

export default function AssistantPage() {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>AI Health Assistant</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Ask questions about your health score and get personalized recommendations.
      </p>
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--border)',
        }}
      >
        <p style={{ color: 'var(--text-muted)' }}>Assistant coming in next phase.</p>
      </div>
    </div>
  );
}
