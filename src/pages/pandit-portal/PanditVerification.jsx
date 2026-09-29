/**
 * PanditVerification — verification status display and submit flow.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { usePanditPortal } from '../../context/PanditPortalContext.jsx';
import { panditPortalApi } from '../../api/panditPortal.js';

const VER_TYPES = [
  { type: 'PHONE',      label: 'Phone Number',          icon: '📞', desc: 'Verified via OTP sent to your mobile number.' },
  { type: 'EMAIL',      label: 'Email Address',          icon: '📧', desc: 'Verified via link sent to your email.' },
  { type: 'IDENTITY',   label: 'Identity (Aadhaar/PAN)', icon: '🪪', desc: 'Government-issued photo ID document.' },
  { type: 'ADDRESS',    label: 'Address Proof',          icon: '📮', desc: 'Utility bill, bank statement or rental agreement.' },
  { type: 'CREDENTIAL', label: 'Credentials',            icon: '📜', desc: 'Religious training certificates or references.' },
  { type: 'BACKGROUND', label: 'Background Check',       icon: '🔍', desc: 'Optional police verification or background check.' },
];

const STATUS_CONFIG = {
  VERIFIED: { badge: 'pp-badge--green',  icon: '✅', label: 'Verified'   },
  PENDING:  { badge: 'pp-badge--yellow', icon: '⏳', label: 'Pending'    },
  FAILED:   { badge: 'pp-badge--red',    icon: '❌', label: 'Rejected'   },
  undefined:{ badge: 'pp-badge--gray',   icon: '○',  label: 'Not started'},
};

const PROVIDER_STATUS_CONFIG = {
  ACTIVE:               { badge: 'pp-badge--green',  label: 'Active — visible to customers' },
  PENDING_VERIFICATION: { badge: 'pp-badge--yellow', label: 'Under Review — not yet visible' },
  INACTIVE:             { badge: 'pp-badge--gray',   label: 'Inactive' },
  SUSPENDED:            { badge: 'pp-badge--red',    label: 'Suspended' },
};

export default function PanditVerification() {
  const { provider, refresh } = usePanditPortal();

  const verifications = provider?.verifications || [];
  const getStatus = (type) => verifications.find(v => v.type === type)?.status;
  const getRemark = (type) => verifications.find(v => v.type === type)?.remarks;

  const handleSubmit = async () => {
    try {
      await panditPortalApi.submit();
      await refresh();
      alert('Your profile has been submitted for verification. We will review it within 1-2 business days.');
    } catch (e) { alert(e.message); }
  };

  const pStatus   = provider?.status || 'PENDING_VERIFICATION';
  const pConfig   = PROVIDER_STATUS_CONFIG[pStatus] || PROVIDER_STATUS_CONFIG.INACTIVE;
  const vStatus   = provider?.verificationStatus || 'UNVERIFIED';
  const canSubmit = pStatus !== 'ACTIVE';

  return (
    <div className="pp-content">
      <div className="pp-page-title">✅ Verify Your Profile</div>
      <div className="pp-page-sub">Verification builds customer trust and is required to be bookable</div>

      {/* Overall status */}
      <div className="pp-card" style={{ marginBottom: 24, borderLeft: `4px solid ${pStatus === 'ACTIVE' ? '#22c55e' : 'var(--gold)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6 }}>
              Profile Status
            </div>
            <span className={`pp-badge ${pConfig.badge}`}>{pConfig.label}</span>
          </div>
          {vStatus === 'VERIFIED' && (
            <div style={{ fontSize: '2.5rem' }}>✅</div>
          )}
        </div>

        {pStatus === 'PENDING_VERIFICATION' && (
          <div style={{ marginTop: 14, fontSize: '0.84rem', color: '#7a5c1e', background: '#fffbee', border: '1px solid #f0e8c8', borderRadius: 10, padding: '10px 14px' }}>
            🔍 Your profile is under review by the PanditJi team. This typically takes 1–2 business days. You will be notified once approved.
          </div>
        )}
      </div>

      {/* Verification checklist */}
      <div className="pp-card" style={{ marginBottom: 24 }}>
        <div className="pp-card__title">Verification Checklist</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {VER_TYPES.map(({ type, label, icon, desc }) => {
            const status = getStatus(type);
            const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG[undefined];
            const remark = getRemark(type);
            return (
              <div key={type} style={{
                display: 'flex', gap: 14, padding: '14px 16px',
                background: status === 'VERIFIED' ? '#f0fdf4' : '#faf8f4',
                border: `1px solid ${status === 'VERIFIED' ? '#bbf7d0' : '#e8e4da'}`,
                borderRadius: 12,
              }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)' }}>{label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 2 }}>{desc}</div>
                  {remark && status === 'FAILED' && (
                    <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: 6, background: '#fee2e2', borderRadius: 6, padding: '4px 8px' }}>
                      ⚠️ {remark}
                    </div>
                  )}
                </div>
                <span className={`pp-badge ${cfg.badge}`} style={{ alignSelf: 'flex-start', flexShrink: 0 }}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* How verification works */}
      <div className="pp-card" style={{ marginBottom: 24 }}>
        <div className="pp-card__title">How Verification Works</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ['01', 'Submit your profile', 'Complete all required sections and click "Submit for Verification".'],
            ['02', 'Team review', 'The PanditJi team reviews your profile, documents, and information.'],
            ['03', 'Verification', 'Each document type is verified separately. You get notified of each step.'],
            ['04', 'Go Live', 'Once approved, your profile becomes visible to customers in your service area.'],
          ].map(([n, title, desc]) => (
            <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--grad-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{n}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-dark)' }}>{title}</div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit / completion prompt */}
      {canSubmit && (
        <div className="pp-card" style={{ borderLeft: '4px solid var(--saffron)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8 }}>
            Ready to submit?
          </div>
          <div style={{ fontSize: '0.84rem', color: '#888', marginBottom: 16 }}>
            Make sure your profile is complete before submitting. A complete profile gets verified faster.
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/pandit-portal/onboarding" className="pp-btn pp-btn--ghost">
              Complete Profile First
            </Link>
            <button className="pp-btn pp-btn--primary" onClick={handleSubmit}>
              🙏 Submit for Verification
            </button>
          </div>
        </div>
      )}

      {pStatus === 'ACTIVE' && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '20px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🎉</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: '#15803d', marginBottom: 6 }}>
            Your profile is verified and live!
          </div>
          <div style={{ fontSize: '0.84rem', color: '#166534' }}>
            Customers in your service areas can now find and book you.
          </div>
        </div>
      )}
    </div>
  );
}
