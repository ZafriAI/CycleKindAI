from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import Base, engine
import routes.auth as auth
import routes.cycles as cycles
import routes.symptoms as symptoms
import routes.insights as insights
import routes.rag as rag
import routes.chat as chat

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Menstrual App API", version="0.2.0")

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
app.include_router(cycles.router, prefix="/cycles", tags=["cycles"])
app.include_router(symptoms.router, prefix="/symptoms", tags=["symptoms"])
app.include_router(insights.router, prefix="/insights", tags=["insights"])
app.include_router(rag.router, tags=["rag"])
app.include_router(chat.router, tags=["chat"])  # <-- add this line
