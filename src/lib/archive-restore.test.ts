import {beforeEach,it,expect,vi} from 'vitest';
import {restoreArchive} from './archive-restore';
import {POSTCARDS_STORAGE_KEY} from './postcard-data';
const values=new Map<string,string>();
let writes=0;
let failAt=0;
beforeEach(()=>{
  writes=0;failAt=0;values.clear();
  vi.stubGlobal('localStorage',{getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>{if(++writes===failAt) throw new DOMException('full','QuotaExceededError');values.set(k,v);},removeItem:(k:string)=>values.delete(k)});
});
const card={id:'one',title:'Postcard',latitude:1,longitude:1};
it('validates the entire archive before replacing any stored work',()=>{
  values.set(POSTCARDS_STORAGE_KEY,JSON.stringify([card]));
  expect(()=>restoreArchive([card,{...card,id:'bad',latitude:200}])).toThrow();
  expect(writes).toBe(0);
});
it('rolls back earlier writes if storage fills during restore',()=>{
  const original=JSON.stringify([card]);values.set(POSTCARDS_STORAGE_KEY,original);failAt=2;
  expect(()=>restoreArchive([{...card,id:'two',assets:{story:{type:'text',content:'Hello'}}}])).toThrow();
  expect(values.get(POSTCARDS_STORAGE_KEY)).toBe(original);expect(values.has('eop-asset-two-story')).toBe(false);
});
it('removes legacy keys from restored video URLs',()=>{
  restoreArchive([{...card,assets:{video:{type:'video',content:'https://media.example/video?key=secret'}}}]);
  expect(values.get('eop-asset-one-video')).not.toContain('secret');
});
