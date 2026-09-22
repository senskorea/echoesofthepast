import { expect, it } from 'vitest';
import { failedTutorTurn, tutorHistory, type TutorMessage } from './tutor-history';
import { DEFAULT_SMART_TUTOR_CONTEXT } from '../data/learning-content';
it('retries a failed turn with the same history instead of resending errors to AI',()=>{
 const history: TutorMessage[]=[{role:'assistant',content:'Hello'}];
 const failed=failedTutorTurn([...history,{role:'user',content:'Question'}],'Provider unavailable');
 expect(tutorHistory(failed)).toBe(tutorHistory(history));
 expect(failed.at(-1)?.content).toBe('Provider unavailable');
});
it('keeps long conversations within the gateway prompt limit',()=>{
 const messages: TutorMessage[]=Array.from({length:20},()=>({role:'assistant',content:'x'.repeat(8000)}));
 const history=tutorHistory(messages);
 expect(history.length).toBeLessThanOrEqual(6000);
 expect((DEFAULT_SMART_TUTOR_CONTEXT+history+'q'.repeat(4000)+'context'.repeat(100)).length).toBeLessThan(16000);
});
