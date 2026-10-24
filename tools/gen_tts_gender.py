#!/usr/bin/env python3
"""Gendered panda voice lines (ElevenLabs Shira, same settings as gen_tts_el.py).
Reads phrases.json: string = neutral (skipped unless --all), {m,f,say_m,say_f} = gendered -> audio/<kind>-<i>-m.mp3 / -f.mp3.
say_* is sent as-is (nikud kept if present); otherwise nikud is stripped like gen_tts_el.
QA per take: (1) transcribe back (gpt-4o-transcribe) and score vs text, (2) Gemini listens and labels how the child is
addressed (M/F/NEUTRAL) -> must equal the target gender. Up to 6 takes, best kept.
Usage: ELEVEN_KEY=.. OPENAI_API_KEY=.. GEMINI_API_KEY=.. gen_tts_gender.py phrases.json audio/ [only-file-substr ...]"""
import json,os,re,sys,subprocess,concurrent.futures as cf
sys.path.insert(0,os.path.dirname(__file__))
import gen_tts_el as EL
from gen_tts import norm,lev,stt,plain
from judge_gender import judge,Q
import time
def _retry(fn,*a):
  for k in range(4):
    try: return fn(*a)
    except subprocess.CalledProcessError:
      if k==3: raise
      time.sleep(3*(k+1))
def tts_raw(say,out):
  orig=EL.plain;EL.plain=lambda s:s
  try: EL.tts(say,out)
  finally: EL.plain=orig
def make(job):
  out,text,say,g=job;best=None
  for a in range(6):
    tmp=out+f".t{a}.mp3"
    if say: _retry(tts_raw,say,tmp)
    else: _retry(EL.tts,text,tmp)
    heard=stt(tmp);s=lev(norm(text),norm(heard))/max(len(norm(text)),1)
    if not re.search('[\u05D0-\u05EA]',heard): s+=1
    j=judge(tmp,Q);m=re.search(r'GENDER:\s*(\w+)',j);jg=(m.group(1) if m else '?').upper()
    ok_g = (g is None) or jg.startswith(g)
    score=s+(0 if ok_g else 5)
    if best is None or score<best[0]:
      if best: os.remove(best[1])
      best=(score,tmp,heard,j.replace('\n',' || '),ok_g)
    else: os.remove(tmp)
    if ok_g and s<=0.12: break
  os.replace(best[1],out);return out,round(best[0],2),'GENDER_OK' if best[4] else 'GENDER_FAIL',best[2],best[3]
if __name__=="__main__":
  P=json.load(open(sys.argv[1]));d=sys.argv[2];only=sys.argv[3:];jobs=[]
  for k,arr in P.items():
    if k.startswith('_'):continue
    for i,t in enumerate(arr):
      if isinstance(t,dict):
        for g in ('m','f'): jobs.append((f"{d}/{k}-{i}-{g}.mp3",t[g],t.get('say_'+g),g.upper()))
      else: jobs.append((f"{d}/{k}-{i}.mp3",t,None,None))
  if only==['--missing']: jobs=[j for j in jobs if j[3] and not os.path.exists(j[0])]
  elif only: jobs=[j for j in jobs if any(o in j[0] for o in only)]
  else: jobs=[j for j in jobs if j[3]]
  with cf.ThreadPoolExecutor(4) as ex:
    for r in ex.map(make,jobs): print(*r,sep=" | ",flush=True)
