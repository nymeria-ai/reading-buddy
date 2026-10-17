#!/usr/bin/env python3
"""Generate panda voice lines with OpenAI TTS and QA each one by transcribing it back.
Usage: gen_tts.py phrases.json audio/ [prefix]   (OPENAI_API_KEY in env)"""
import json,subprocess,os,re,sys,concurrent.futures as cf
KEY=os.environ["OPENAI_API_KEY"]
INSTR="דַּבְּרִי בְּעִבְרִית יִשְׂרְאֵלִית טִבְעִית, בְּמִבְטָא יִשְׂרְאֵלִי מָלֵא. בְּשִׂמְחָה וּבְחֹם, כְּמוֹ דְּמוּת מְצֻיֶּרֶת שֶׁל פַּנְדָּה שֶׁמְּעוֹדֶדֶת יֶלֶד בֶּן שֶׁבַע. בְּרוּרָה וְלֹא מַהֵר מִדַּי."
def plain(s): return re.sub(r'[\u0591-\u05C7]','',s)
def norm(s): s=plain(s); s=re.sub(r'[^\u05D0-\u05EA ]','',s); s=re.sub('[ךםןףץ]',lambda m:'כמנפצ'['ךםןףץ'.index(m.group())],s); return re.sub(r'[וי ]','',s)
def lev(a,b):
  d=list(range(len(b)+1))
  for i in range(1,len(a)+1):
    p=d[0];d[0]=i
    for j in range(1,len(b)+1): t=d[j];d[j]=min(d[j]+1,d[j-1]+1,p+(a[i-1]!=b[j-1]));p=t
  return d[len(b)]
def tts(text,out,voice):
  body=json.dumps({"model":"gpt-4o-mini-tts","voice":voice,"input":plain(text),"instructions":INSTR,"response_format":"mp3"})
  subprocess.run(["curl","-s","https://api.openai.com/v1/audio/speech","-H","Authorization: Bearer "+KEY,"-H","Content-Type: application/json","-d",body,"-o",out],check=True)
def stt(f):
  r=subprocess.run(["curl","-s","https://api.openai.com/v1/audio/transcriptions","-H","Authorization: Bearer "+KEY,"-F","model=gpt-4o-transcribe","-F","file=@"+f],capture_output=True,text=True)
  try: return json.loads(r.stdout).get("text","")
  except: return ""
def make(job):
  out,text=job;best=None
  for attempt,voice in enumerate(["coral","coral","shimmer","nova","coral","shimmer"]):
    tmp=out+f".try{attempt}.mp3";tts(text,tmp,voice);heard=stt(tmp)
    a,b=norm(text),norm(heard);score=lev(a,b)/max(len(a),1)
    if best is None or score<best[0]:
      if best: os.remove(best[1])
      best=(score,tmp,heard,voice)
    else: os.remove(tmp)
    if score<=0.1 and re.search('[\u05D0-\u05EA]',heard): break
  os.replace(best[1],out)
  return out,round(best[0],2),best[3],best[2]
if __name__=="__main__":
  P=json.load(open(sys.argv[1]));d=sys.argv[2];pre=sys.argv[3] if len(sys.argv)>3 else ""
  os.makedirs(d,exist_ok=True);jobs=[]
  for k,arr in P.items():
    if isinstance(arr,str): arr=[arr]
    for i,t in enumerate(arr): jobs.append((f"{d}/{pre}{k}-{i}.mp3",t))
  with cf.ThreadPoolExecutor(6) as ex:
    for r in ex.map(make,jobs): print(*r,sep=" | ")
