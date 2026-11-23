import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
// The harness sets these paths; local runs can override them.
const inputDir = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
// Validate bytecode, immediate, and stack before opcode-specific traps.
const STACK_MAX=256,CALLS_MAX=64,MEMORY_WORDS=256,STEP_LIMIT=1_000_000,OUTPUT_MAX=65_536;
const TRAP={UNDERFLOW:2,OVERFLOW:3,DIV_ZERO:4,BAD_OPCODE:5,MEMORY:6,CALL_DEPTH:7,RET_EMPTY:8,PC:9,STEPS:10,OUTPUT:11};
const imm=new Uint8Array(256),pops=new Uint8Array(256),pushes=new Uint8Array(256),known=new Uint8Array(256);
const def=(codes,i=0,p=0,q=0)=>{for(const c of codes){imm[c]=i;pops[c]=p;pushes[c]=q;known[c]=1;}};
def([0]);def([1],1,0,1);def([2],4,0,1);def([3],0,1);def([4],0,1,2);def([5],0,2,2);def([6],0,2,3);def([7],0,3,3);
def([16,17,18,19,20,21,22,24,25,26,28,29,30,32,33,34],0,2,1);def([23,27,64],0,1,1);def([48],2);def([49,50],2,1);def([51],2);def([52]);def([65],0,2);def([80,81],0,1);def([82],0,0,1);def([83],0,1);
function execute(code,bytes){
 const d=new Int32Array(STACK_MAX),c=new Int32Array(CALLS_MAX),m=new Int32Array(MEMORY_WORDS),o=new Uint8Array(OUTPUT_MAX);let sp=0,cp=0,ip=0,ol=0,pc=0,steps=0;
 const end=(exit,trap=null)=>({stdout:o.slice(0,ol),exit,trap});
 for(;;){if(steps===STEP_LIMIT)return end(10,10);if(pc<0||pc>=code.length)return end(9,9);const op=code[pc];if(!known[op])return end(5,5);const n=imm[op];if(pc+n>=code.length)return end(9,9);steps++;const next=pc+1+n;if(sp<pops[op])return end(2,2);if(sp-pops[op]+pushes[op]>STACK_MAX)return end(3,3);pc=next;
 switch(op){case 0:return end(0);case 1:d[sp++]=(code[next-1]<<24)>>24;break;case 2:d[sp++]=code[next-4]|code[next-3]<<8|code[next-2]<<16|code[next-1]<<24;break;case 3:sp--;break;case 4:d[sp]=d[sp-1];sp++;break;case 5:{const t=d[sp-1];d[sp-1]=d[sp-2];d[sp-2]=t;break;}case 6:d[sp]=d[sp-2];sp++;break;case 7:{const a=d[sp-3];d[sp-3]=d[sp-2];d[sp-2]=d[sp-1];d[sp-1]=a;break;}case 23:d[sp-1]=-d[sp-1]|0;break;case 27:d[sp-1]=~d[sp-1];break;
 case 16:case 17:case 18:case 19:case 20:case 21:case 22:case 24:case 25:case 26:case 28:case 29:case 30:case 32:case 33:case 34:{const b=d[sp-1],a=d[sp-2];let r;switch(op){case 16:r=a+b|0;break;case 17:r=a-b|0;break;case 18:r=Math.imul(a,b);break;case 19:if(!b)return end(4,4);r=a===-2147483648&&b===-1?a:Math.trunc(a/b)|0;break;case 20:if(!b)return end(4,4);r=b===-1?0:a%b|0;break;case 21:if(!b)return end(4,4);r=Math.floor((a>>>0)/(b>>>0))|0;break;case 22:if(!b)return end(4,4);r=(a>>>0)%(b>>>0)|0;break;case 24:r=a&b;break;case 25:r=a|b;break;case 26:r=a^b;break;case 28:r=a<<(b&31);break;case 29:r=a>>(b&31);break;case 30:r=a>>>(b&31)|0;break;case 32:r=a===b?1:0;break;case 33:r=a<b?1:0;break;case 34:r=(a>>>0)<(b>>>0)?1:0;break;}sp-=2;d[sp++]=r;break;}
 case 48:case 49:case 50:{const rel=(code[next-2]|code[next-1]<<8)<<16>>16;let take=true;if(op!==48){const v=d[--sp];take=op===49?v===0:v!==0;}if(take)pc=next+rel;break;}case 51:if(cp===CALLS_MAX)return end(7,7);c[cp++]=next;pc=code[next-2]|code[next-1]<<8;break;case 52:if(!cp)return end(8,8);pc=c[--cp];break;case 64:{const a=d[sp-1];if(a<0||a>=MEMORY_WORDS)return end(6,6);d[sp-1]=m[a];break;}case 65:{const a=d[sp-1],v=d[sp-2];if(a<0||a>=MEMORY_WORDS)return end(6,6);sp-=2;m[a]=v;break;}
 case 80:{const b=Buffer.from(String(d[sp-1]));if(ol+b.length>OUTPUT_MAX)return end(11,11);sp--;o.set(b,ol);ol+=b.length;break;}case 81:if(ol===OUTPUT_MAX)return end(11,11);o[ol++]=d[--sp]&255;break;case 82:d[sp++]=ip<bytes.length?bytes[ip++]:-1;break;case 83:return end(d[--sp]&255);}
 }
}
for(const id of readdirSync(inputDir).sort()){const code=readFileSync(join(inputDir,id,'program.bin')),bytes=readFileSync(join(inputDir,id,'input.bin')),r=execute(code,bytes),dir=join(outputDir,id);mkdirSync(dir,{recursive:true});writeFileSync(join(dir,'stdout.bin'),r.stdout);writeFileSync(join(dir,'exit.txt'),`${r.exit}\n`);}
