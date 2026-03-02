import React, { useState } from 'react';
import { X, Bell } from 'lucide-react';

interface ComingSoonModalProps {
    featureName: string;
    onClose: () => void;
    host: string;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ featureName, onClose, host }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const resp = await fetch(`${host}/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, feature: featureName }),
            });
            const data = await resp.json();

            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.error || 'Failed to submit email.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
            <div style={{
                background: 'var(--bg-glass)', border: '1px solid rgba(255,255,255,0.1)',
                padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px',
                position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '15px', right: '15px', background: 'transparent',
                        border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                    }}
                >
                    <X size={20} />
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '16px' }}>
                        <Bell size={32} color="var(--accent-cyan)" />
                    </div>
                    <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>{featureName} is Coming Soon!</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
                        We are working hard to bring this feature to you. Subscribe to get notified the moment it goes live.
                    </p>

                    {success ? (
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }}>
                            ✓ You&apos;re on the list! We will notify you at <strong>{email}</strong>.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '8px',
                                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--text-main)', outline: 'none'
                                }}
                            />
                            {error && <div style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'left' }}>{error}</div>}

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    background: 'var(--accent-cyan)', color: 'var(--bg-card)',
                                    fontWeight: 'bold', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1, transition: 'all 0.2s ease'
                                }}
                            >
                                {loading ? 'Please wait...' : 'Notify Me'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComingSoonModal;
