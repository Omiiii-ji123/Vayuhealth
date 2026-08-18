import { useEffect, useState } from 'react';
import { User, Save, RefreshCw, HeartPulse, PlusCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Loader, ErrorState } from '../components/Common';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { getUserByEmail, updateUser, createUser } from '../api/users';
import { updateHealthProfile } from '../api/auth';

export default function Profile() {
  const { user, updateLocalUser } = useAuth();
  const { data: remoteUser, error, loading, refetch } = useAsync(
    () => getUserByEmail(user?.email),
    [user?.email],
    { skip: !user?.email }
  );

  const [account, setAccount] = useState({ name: '', email: '', city: '', state: '', district: '' });
  const [health, setHealth] = useState({ age: '', conditions: '', allergies: '', sensitivity: 'normal' });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(null);
  const [saveErr, setSaveErr] = useState(null);

  useEffect(() => {
    const src = remoteUser || user;
    if (src) {
      setAccount({
        name: src.name || '',
        email: src.email || user?.email || '',
        city: src.city || '',
        state: src.state || '',
        district: src.district || '',
      });
      setHealth({
        age: src.age || '',
        conditions: src.conditions || '',
        allergies: src.allergies || '',
        sensitivity: src.sensitivity || 'normal',
      });
    }
  }, [remoteUser, user]);

  const saveAccount = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveErr(null);
    setSavedMsg(null);
    try {
      await updateUser(user.email, account);
      updateLocalUser(account);
      setSavedMsg('Account details saved.');
      refetch();
    } catch (err) {
      setSaveErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveHealth = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveErr(null);
    setSavedMsg(null);
    try {
      await updateHealthProfile(user.id || user.email, health);
      setSavedMsg('Health profile saved.');
    } catch (err) {
      setSaveErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  const syncRecord = async () => {
    setSaving(true);
    setSaveErr(null);
    setSavedMsg(null);
    try {
      await createUser({ ...account, email: user.email });
      setSavedMsg('User record synced with the backend.');
      refetch();
    } catch (err) {
      setSaveErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Profile" subtitle="Manage your account and health profile.">
      {loading ? (
        <Card className="section-card"><Loader label="Loading profile..." /></Card>
      ) : error ? (
        <Card className="section-card"><ErrorState message={error.message} onRetry={refetch} /></Card>
      ) : null}

      {savedMsg && <div className="banner banner--success">{savedMsg}</div>}
      {saveErr && <div className="banner banner--error">{saveErr}</div>}

      <div className="grid-2col">
        <Card className="section-card">
          <div className="card-head">
            <h3 className="section-title"><User size={16} /> Account Information</h3>
          </div>
          <form className="form-grid" onSubmit={saveAccount}>
            <label>
              Name
              <input value={account.name} onChange={(e) => setAccount((a) => ({ ...a, name: e.target.value }))} />
            </label>
            <label>
              Email
              <input value={account.email} disabled />
            </label>
            <label>
              City
              <input value={account.city} onChange={(e) => setAccount((a) => ({ ...a, city: e.target.value }))} />
            </label>
            <label>
              State
              <input value={account.state} onChange={(e) => setAccount((a) => ({ ...a, state: e.target.value }))} />
            </label>
            <label>
              District
              <input value={account.district} onChange={(e) => setAccount((a) => ({ ...a, district: e.target.value }))} />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                <Save size={14} /> Save account
              </button>
              <button type="button" className="btn btn--ghost" onClick={syncRecord} disabled={saving}>
                <PlusCircle size={14} /> Sync user record
              </button>
            </div>
          </form>
        </Card>

        <Card className="section-card">
          <div className="card-head">
            <h3 className="section-title"><HeartPulse size={16} /> Health Profile</h3>
          </div>
          <form className="form-grid" onSubmit={saveHealth}>
            <label>
              Age
              <input type="number" min="0" value={health.age} onChange={(e) => setHealth((h) => ({ ...h, age: e.target.value }))} />
            </label>
            <label>
              Sensitivity level
              <select value={health.sensitivity} onChange={(e) => setHealth((h) => ({ ...h, sensitivity: e.target.value }))}>
                <option value="normal">Normal</option>
                <option value="sensitive">Sensitive group</option>
                <option value="high-risk">High risk</option>
              </select>
            </label>
            <label>
              Existing conditions
              <textarea rows={2} value={health.conditions} onChange={(e) => setHealth((h) => ({ ...h, conditions: e.target.value }))} placeholder="e.g. asthma, COPD" />
            </label>
            <label>
              Allergies
              <textarea rows={2} value={health.allergies} onChange={(e) => setHealth((h) => ({ ...h, allergies: e.target.value }))} placeholder="e.g. pollen, dust" />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                <RefreshCw size={14} /> Save health profile
              </button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
