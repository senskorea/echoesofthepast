import { Component, type ReactNode } from 'react';
export default class PageErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError() {return {failed:true};}
  render() {
    if (!this.state.failed) return this.props.children;
    return <main role="alert" className="mx-auto max-w-xl p-8 space-y-4">
      <h1 className="text-2xl font-semibold">This page could not be displayed</h1>
      <p>Try reloading, or return to the archive. Avoid clearing browser data if you have work saved here.</p>
      <button className="border rounded px-4 py-2" onClick={()=>window.location.reload()}>Reload page</button>
      <a className="block underline" href={import.meta.env.BASE_URL}>Return to the archive</a>
    </main>;
  }
}
