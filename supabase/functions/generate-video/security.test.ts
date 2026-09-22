import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
it('retires all legacy endpoints without an upstream request',()=>{
  for(const name of ['generate-video','generate-story','analyse-postcard-image','format-postcard-json']) {
    const source=readFileSync(new URL(`../${name}/index.ts`,import.meta.url),'utf8');
    expect(source).toContain('status: 410');expect(source).not.toContain('fetch(');
  }
});
