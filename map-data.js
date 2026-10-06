export const WORLD = { width:1536, height:1024, start:{x:770,y:612}, cell:16 };
// Walkable ground follows the approved painting; riverbanks, roofs and woodland stay solid.
export const LAND = [
 [[598,12],[786,12],[810,164],[935,251],[1005,344],[985,384],[937,420],[903,425],[898,514],[1089,518],[1090,624],[873,647],[814,741],[795,817],[824,1010],[648,1010],[625,805],[560,773],[196,759],[167,690],[186,604],[182,491],[138,447],[132,358],[603,355]],
 [[1050,537],[1268,537],[1268,620],[1050,620]],
 [[1140,168],[1250,158],[1307,203],[1318,328],[1352,410],[1342,485],[1325,636],[1405,682],[1452,769],[1430,891],[1246,906],[1200,863],[1194,720],[1230,634],[1231,511],[1234,408],[1140,309]],
];
export const SOLIDS = [
 [145,135,216,231],[370,135,215,232],[573,321,94,77],
 [113,392,125,38],[355,392,116,38],
 [226,480,18,215],[253,475,277,17],[251,673,279,21],[536,482,22,61],[536,613,22,82],
 [1110,217,66,76],[1252,238,55,58],[1265,140,49,51],
 [1210,706,47,53],[1374,786,65,67],
];
export const OBJECTS = [
 {id:'villager',kind:'villager',x:619,y:429,label:'Người trông vườn',radius:70},
 {id:'shop',kind:'shop',x:611,y:397,label:'Cửa hàng',radius:70},
 {id:'home',kind:'home',x:254,y:383,label:'Căn nhà của bạn',radius:82},
 {id:'chest',kind:'chest',x:279,y:447,label:'Rương nông trại',radius:65},
 {id:'tracks',kind:'tracks',x:956,y:531,label:'Dấu chân bên sông',radius:62},
 {id:'channel',kind:'channel',x:1024,y:596,label:'Máng nước cũ',radius:70},
 {id:'bank',kind:'bank',x:947,y:607,label:'Vật cản bên bờ sông',radius:60},
 {id:'river_berry',kind:'plot',x:972,y:576,label:'Luống quả mọng ven sông',radius:65},
 {id:'cave',kind:'cave',x:1197,y:193,label:'Tàn tích cổ',radius:65},
 {id:'north',kind:'gate',x:700,y:70,label:'Con đường phía bắc',radius:65},
 ...[[594,496],[589,674],[577,745],[802,360]].map(([x,y],i)=>({id:`wood_${i+1}`,kind:'wood',x,y,label:'Gỗ khô',radius:64})),
 ...[[1265,721],[1370,749],[1310,851],[1256,811]].map(([x,y],i)=>({id:`stone_${i+1}`,kind:'stone',x,y,label:'Đá khoáng',radius:66})),
 ...[[207,722],[800,429],[851,367]].map(([x,y],i)=>({id:`berries_${i+1}`,kind:'berries',x,y,label:'Bụi quả mọng',radius:64})),
 ...Array.from({length:12},(_,i)=>({id:`farm_${i+1}`,kind:'plot',x:289+(i%4)*55,y:517+Math.floor(i/4)*57,label:`Luống ${i+1}`,radius:45})),
];
export function pointInPolygon(x,y,vertices) {
 let inside=false;
 for(let i=0,j=vertices.length-1;i<vertices.length;j=i++) {
  const [xi,yi]=vertices[i],[xj,yj]=vertices[j];
  if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
 }
 return inside;
}
export function isWalkable(x,y) {
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<10||y<10||x>WORLD.width-10||y>WORLD.height-10)return false;
 return LAND.some(poly=>pointInPolygon(x,y,poly))&&!SOLIDS.some(([rx,ry,w,h])=>x>=rx-8&&x<=rx+w+8&&y>=ry-5&&y<=ry+h+5);
}
export function validFoot(x,y) { return isWalkable(x-7,y)&&isWalkable(x+7,y)&&isWalkable(x,y-3); }
export function nearbyPoint(x,y,maxRadius=96) {
 if(validFoot(x,y))return{x,y};
 for(let r=8;r<=maxRadius;r+=8)for(let a=0;a<Math.PI*2;a+=Math.PI/8){const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(validFoot(px,py))return{x:px,y:py};}
 return null;
}
export function findPath(start,goal) {
 const size=WORLD.cell,cols=Math.ceil(WORLD.width/size),rows=Math.ceil(WORLD.height/size);
 const toCell=p=>({x:Math.round((p.x-size/2)/size),y:Math.round((p.y-size/2)/size)});
 const center=p=>({x:p.x*size+size/2,y:p.y*size+size/2});
 const closestCell=p=>{const c=toCell(p);for(let r=0;r<7;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const t={x:c.x+dx,y:c.y+dy},w=center(t);if(validFoot(w.x,w.y))return t;}return null;};
 const from=closestCell(start),to=closestCell(goal);if(!from||!to)return[];
 const key=c=>c.y*cols+c.x,fromKey=key(from),target=key(to),queue=[from],parents=new Map([[fromKey,null]]);
 for(let i=0;i<queue.length;i++){
  const c=queue[i],k=key(c);if(k===target)break;
  for(const [dx,dy]of[[0,1],[1,0],[0,-1],[-1,0]]){
   const n={x:c.x+dx,y:c.y+dy};if(n.x<0||n.y<0||n.x>=cols||n.y>=rows)continue;
   const nk=key(n),w=center(n);if(parents.has(nk)||!validFoot(w.x,w.y))continue;
   parents.set(nk,k);queue.push(n);
  }
 }
 if(!parents.has(target))return[];
 const path=[];let k=target;while(k!==fromKey&&k!==null){path.push(center({x:k%cols,y:Math.floor(k/cols)}));k=parents.get(k);}
 path.reverse();return path;
}
