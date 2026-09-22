import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import SEO from '@/components/SEO';
import { useLanguage } from '@/lib/i18n';
import { loadAllPostcards } from '@/lib/data-loader';
import { createArchive, POSTCARDS_STORAGE_KEY, DELETED_POSTCARDS_STORAGE_KEY } from '@/lib/postcard-data';
import { restoreArchive } from '@/lib/archive-restore';
import { friendlyError } from '@/lib/service-errors';

export default function Settings() {
  const {lang,t}=useLanguage();
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const exportArchive=async () => {
    setBusy(true);
    try {
      const archive=createArchive(await loadAllPostcards());
      const url=URL.createObjectURL(new Blob([JSON.stringify(archive,null,2)],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='geostories-backup.json';a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice('Your archive download has started. Keep it somewhere safe.');
    } catch(error) {setNotice(friendlyError(error,lang));}
    finally {setBusy(false);}
  };
  const importArchive=async (file?:File) => {
    if (!file) return;
    setBusy(true);
    try {
      if (file.size>50*1024*1024) {setNotice('This backup is too large. Choose a JSON file smaller than 50 MB.');return;}
      const count=restoreArchive(JSON.parse(await file.text()));
      setNotice(`Restored ${count} postcards. Open the archive to see them.`);
    } catch(error) {setNotice(error instanceof DOMException ? friendlyError(error,lang) : 'This is not a supported GeoStories backup. Choose an exported JSON archive with valid postcards and assets.');}
    finally {setBusy(false);}
  };
  const reset=() => {
    if (!window.confirm('Remove locally saved postcards and creations from this browser? Export a backup first. Learning progress will stay.')) return;
    try {
      const keys=Object.keys(localStorage).filter(k=>k===POSTCARDS_STORAGE_KEY || k===DELETED_POSTCARDS_STORAGE_KEY || k.startsWith('eop-asset-'));
      keys.forEach(k=>localStorage.removeItem(k));setNotice('Local postcards and creations cleared. The original archive is still available.');
    } catch(error) {setNotice(friendlyError(error,lang));}
  };
  return <div className="eop-root min-h-screen">
    <SEO title="Your work & backups - GeoStories" description="Save and restore your GeoStories postcard archive." />
    <header className="eop-nav"><Link to="/" className="eop-logo">Echoes of the Past</Link><nav className="eop-nav-links"><LanguageSwitcher/><Link to="/learn" className="eop-nav-link">{t('nav_learn')}</Link><Link to="/" className="eop-nav-link">{t('nav_archive')}</Link></nav></header>
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <h1 className="text-3xl font-semibold">Your work & backups</h1>
      <p>Online services are managed by the platform. You do not need API keys or a cloud account.</p>
      <section className="rounded-xl border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">Data Management</h2>
        <p>Postcard changes and saved creations stay in this browser. They are not automatically published or synced to another device. Download a backup before clearing browser data. Lesson progress is not included in this backup.</p>
        <button disabled={busy} onClick={exportArchive} className="rounded-lg border px-4 py-3 disabled:opacity-50">Download Complete Archive (JSON)</button>
        <div><label htmlFor="restore-archive" className="block mb-2 font-medium">Import / Restore Backup</label><input id="restore-archive" type="file" accept=".json,application/json" disabled={busy} onChange={e=>{void importArchive(e.target.files?.[0]);e.target.value='';}}/></div>
        <p role="status" aria-live="polite">{busy ? 'Please wait…' : notice}</p>
      </section>
      <section className="rounded-xl border p-6 space-y-3"><h2 className="text-xl font-semibold">Clear local work</h2><p>This affects only this browser. Export your work first.</p><button onClick={reset} disabled={busy} className="rounded-lg border border-red-300 px-4 py-3 text-red-800">Reset local archive</button></section>
      <Link to="/learn" className="underline">Read the quick guide</Link>
    </main>
  </div>;
}
