import assert from 'node:assert/strict';
import test from 'node:test';
import {createExperienceStorageCoordinator} from '../src/persistence/experienceStorageCoordinator.ts';
import {EXPERIENCE_STORAGE_KEY,normalizeExperienceSnapshot} from '../src/persistence/experiencePersistence.ts';

function storage() {
  const memory=new Map<string,string>(); let failNext=false;
  return {
    memory,
    fail:()=>{failNext=true;},
    adapter:{
      getItem:async (key:string)=>memory.get(key)??null,
      setItem:async(key:string,value:string)=>{
        if(failNext){failNext=false;throw new Error('Injected quota failure');}
        memory.set(key,value);
      }
    }
  };
}
test('My Moscow saved places and visited progress survive serialized rapid edits',async()=>{
  const s=storage(), coordinator=createExperienceStorageCoordinator(s.adapter);
  const baseline=await coordinator.hydrate();
  const first={...baseline,savedIds:['romanov-chambers']};
  const second={...first,visitedIds:['old-english-court']};
  await Promise.all([coordinator.persist(first),coordinator.persist(second)]);
  assert.deepEqual(JSON.parse(s.memory.get(EXPERIENCE_STORAGE_KEY)!).visitedIds,['old-english-court']);
  assert.deepEqual((await coordinator.hydrate()).savedIds,['romanov-chambers']);
});
test('failed write blocks subsequent writes until explicit retry and does not fake success',async()=>{
  const s=storage(), coordinator=createExperienceStorageCoordinator(s.adapter);
  const initial=await coordinator.hydrate();
  const next={...initial,visitedIds:['romanov-chambers']};
  s.fail();await assert.rejects(coordinator.persist(next),/Injected quota failure/);
  assert.equal(s.memory.has(EXPERIENCE_STORAGE_KEY),false);
  await assert.rejects(coordinator.persist(next),/explicit retry/);
  await coordinator.persist(next,true);
  assert.deepEqual((await coordinator.hydrate()).visitedIds,['romanov-chambers']);
});
test('foreign same-origin changes are not silently overwritten',async()=>{
  const s=storage(), coordinator=createExperienceStorageCoordinator(s.adapter);
  const initial=await coordinator.hydrate();
  s.memory.set(EXPERIENCE_STORAGE_KEY,JSON.stringify({...initial,savedIds:['romanov-chambers']}));
  await assert.rejects(coordinator.persist({...initial,visitedIds:['old-english-court']}),/externally/);
  assert.deepEqual(JSON.parse(s.memory.get(EXPERIENCE_STORAGE_KEY)!).savedIds,['romanov-chambers']);
});
test('invalid JSON remains untouched instead of resetting progress',async()=>{
  const s=storage();s.memory.set(EXPERIENCE_STORAGE_KEY,'{broken');
  const coordinator=createExperienceStorageCoordinator(s.adapter);
  await assert.rejects(coordinator.hydrate());
  await assert.rejects(coordinator.persist(normalizeExperienceSnapshot(null)),/safely hydrated/);
  assert.equal(s.memory.get(EXPERIENCE_STORAGE_KEY),'{broken');
});
