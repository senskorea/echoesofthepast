import { createGateway } from '../_shared/gateway-handler.ts';
Deno.serve(createGateway(name => Deno.env.get(name)));
