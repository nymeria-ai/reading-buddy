#!/usr/bin/env python3
"""Panda voice: ElevenLabs eleven_v3, ONE voice for every line (Shira, native Hebrew), playful tag,
slight pitch-up for a sweeter cartoon sound. Each take is QA'd by transcribing it back; retried up to 5x.
Usage: ELEVEN_KEY=... OPENAI_API_KEY=... gen_tts_el.py phrases.json audio/"""
import json,subprocess,os,re,sys,concurrent.futures as cf
sys.path.insert(0,os.path.dirname(__file__));from gen_tts import plain,norm,lev,stt
EK=os.environ["ELEVEN_KEY"];VOICE="1WOvbtTEb49xcgFUMDu9";PITCH=1.08
def tts(text,out):
  body=json.dumps({"text":"[playful] "+plain(text),"model_id":"eleven_v3","language_code":"he","voice_settings":{"stability":0.5,"similarity_boost":0.75,"style":0.5}})
  raw=out+".raw.mp3"
  subprocess.run(["curl","-s",f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128","-H","xi-api-key: "+EK,"-H","Content-Type: application/json","-d",body,"-o",raw],check=True)
  subprocess.run(["ffmpeg","-y","-loglevel","error","-i",raw,"-af",f"asetrate=44100*{PITCH},aresample=44100,atempo={1/PITCH:.4f}","-b:a","96k",out],check=True);os.remove(raw)
def make(job):
  out,text=job;best=None
  for a in range(5):
    tmp=out+f".t{a}.mp3";tts(text,tmp);heard=stt(tmp)
    s=lev(norm(text),norm(heard))/max(len(norm(text)),1)
    if not re.search('[\u05D0-\u05EA]',heard): s+=1
    if best is None or s<best[0]:
      if best: os.remove(best[1])
      best=(s,tmp,heard)
    else: os.remove(tmp)
    if s<=0.08: break
  os.replace(best[1],out);return out,round(best[0],2),best[2]
if __name__=="__main__":
  P=json.load(open(sys.argv[1]));d=sys.argv[2];jobs=[]
  for k,arr in P.items():
    for i,t in enumerate(arr if isinstance(arr,list) else [arr]): jobs.append((f"{d}/{k}-{i}.mp3",t))
  with cf.ThreadPoolExecutor(4) as ex:
    for r in ex.map(make,jobs): print(*r,sep=" | ")
