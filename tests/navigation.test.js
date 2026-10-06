import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD,OBJECTS,validFoot,nearbyPoint,findPath} from '../map-data.js';
test('all first-map quest, farm and economy locations are reachable from shoreline',()=>{
 assert.ok(validFoot(WORLD.start.x,WORLD.start.y));
 for(const object of OBJECTS){const p=nearbyPoint(object.x,object.y,object.radius-4);assert.ok(p,`${object.id} needs a walkable approach`);assert.ok(Math.hypot(object.x-p.x,object.y-p.y)<=object.radius,object.id);const path=findPath(WORLD.start,p);assert.ok(path.length>0,`${object.id} needs a connected route`);assert.ok(path.every(p=>validFoot(p.x,p.y)),`${object.id} route must avoid solid terrain`);}
});
test('river and house walls block foot movement; bridge is traversable',()=>{
 assert.equal(validFoot(1050,700),false);assert.equal(validFoot(250,230),false);assert.equal(validFoot(1150,575),true);
 assert.equal(validFoot(-1,400),false);assert.equal(validFoot(NaN,400),false);
});
