import {it,expect} from 'vitest';
import {friendlyError,responseError,ServiceError} from './service-errors';
it('does not expose raw errors to visitors',()=>{
  expect(friendlyError(new Error('upstream secret=bad'))).not.toContain('secret');
  expect(responseError(500,'constructor')).toMatchObject({code:'unavailable'});
});
it('provides all languages for service errors',()=>{
  for (const lang of ['en','ro','fr'] as const) expect(friendlyError(new ServiceError('limit'),lang)).toBeTruthy();
  expect(friendlyError(new ServiceError('unavailable'),'fr')).toContain('temporairement');
});
