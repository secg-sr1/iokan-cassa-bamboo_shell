import test from 'node:test';import assert from 'node:assert/strict';import {addReinforcement,reinforcementOptions} from '../src/reinforcement.js';
test('removed bundled frame cannot regenerate from a legacy saved variation',()=>{const members=[];assert.equal(addReinforcement(members,{reinforcement:'reference'}),members);assert.ok(!reinforcementOptions.some(o=>o.id==='reference'));});
