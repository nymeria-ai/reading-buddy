import sys,base64,json,subprocess,os
KEY=os.environ["GEMINI_API_KEY"]
def judge(f,q):
  b=base64.b64encode(open(f,'rb').read()).decode()
  body={"contents":[{"parts":[{"inline_data":{"mime_type":"audio/mpeg","data":b}},{"text":q}]}],"generationConfig":{"temperature":0}}
  r=subprocess.run(["curl","-s",f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={KEY}","-H","Content-Type: application/json","-d","@-"],input=json.dumps(body),capture_output=True,text=True)
  try: return json.loads(r.stdout)["candidates"][0]["content"]["parts"][-1]["text"].strip()
  except Exception: return r.stdout[:300]
Q="This is a Hebrew audio clip. Transcribe it as exact Latin phonetic transliteration of what is actually pronounced (e.g. 'bekha' vs 'bakh', 'itkha' vs 'itakh', 'karata' vs 'karat', 'siyamta' vs 'siyamt', 'bo' vs 'boi'). Then on a new line write GENDER: M, F, or NEUTRAL according to how the listener is addressed. Output only those two lines."
if __name__=="__main__":
  for f in sys.argv[1:]: print(f,"|",judge(f,Q).replace("\n"," || "))
