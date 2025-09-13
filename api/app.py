from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import Base, engine
import routes.auth as auth
import routes.cycles as cycles
import routes.symptoms as symptoms
import routes.insights as insights
import routes.phases as phases
import routes.rag as rag
import routes.chat as chat
import routes.me as me 


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Menstrual App API", version="0.2.0")
app.include_router(me.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(cycles.router, tags=["cycles"])     # /cycles/, /cycles/{cycle_id}
app.include_router(symptoms.router, tags=["symptoms"]) # /symptoms/, /symptoms/{log_id}
app.include_router(insights.router, tags=["insights"])
app.include_router(phases.router, tags=["phases"])
app.include_router(rag.router, tags=["rag"])
app.include_router(chat.router, tags=["chat"])