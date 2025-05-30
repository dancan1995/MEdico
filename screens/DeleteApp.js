import React from 'react';

export default function DeleteAccountPolicy() {
  return (
    <div style={{
      backgroundColor: '#121212',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      lineHeight: '1.6',
      borderRadius: '12px',
    }}>
      <h1 style={{ color: '#00d1b2' }}>Delete Your Account – MEdico App</h1>

      <p>You may request deletion of your account and all related data at any time. To do so, please:</p>

      <ul>
        <li>Open the <strong>MEdico</strong> app</li>
        <li>Navigate to the <strong>Settings</strong> screen</li>
        <li>Tap <strong>Delete My Account</strong></li>
      </ul>

      <p>Alternatively, email us at <a href="mailto:confam8@gmail.com" style={{ color: '#00d1b2' }}>confam8@gmail.com</a> with the subject line <strong>“Delete My Account”</strong>.</p>

      <p>Once your request is confirmed:</p>
      <ul>
        <li>Your profile and personal health logs will be <strong>permanently deleted</strong></li>
        <li>We do <strong>not retain</strong> any user data beyond 30 days after deletion</li>
        <li>Some logs (e.g. error reports) may remain anonymized for security auditing</li>
      </ul>

      <p>For further help, contact: <a href="mailto:confam8@gmail.com" style={{ color: '#00d1b2' }}>confam8@gmail.com</a></p>
    </div>
  );
}
