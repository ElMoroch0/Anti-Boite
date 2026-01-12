from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid

app = FastAPI()

# ---------------------------
# CORS pour autoriser ton frontend
# ---------------------------
origins = [
    "http://localhost:5500",  # adresse de ton frontend si tu utilises Live Server ou similaire
    "http://127.0.0.1:5500",
    "http://localhost:3000",  # si tu utilises un autre port
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Stockage temporaire en mémoire
# ---------------------------
visits = 0
interactions = {}

# ---------------------------
# Modèles pour le POST
# ---------------------------
class Visit(BaseModel):
    session_id: str | None = None

class Interaction(BaseModel):
    session_id: str
    object_name: str

# ---------------------------
# Routes
# ---------------------------
@app.post("/visit")
def record_visit(visit: Visit):
    global visits
    visits += 1

    # Générer un session_id si inexistant
    if not visit.session_id:
        session_id = str(uuid.uuid4())
    else:
        session_id = visit.session_id

    print(f"Nouvelle visite: session_id={session_id}, total={visits}")
    return {"session_id": session_id, "total_visits": visits}

@app.post("/interact")
def record_interaction(interaction: Interaction):
    object_name = interaction.object_name
    if object_name not in interactions:
        interactions[object_name] = 0
    interactions[object_name] += 1

    print(f"Interaction: {object_name}, total={interactions[object_name]}")
    return {"object_name": object_name, "total": interactions[object_name]}

# ---------------------------
# Route test GET (optionnelle)
# ---------------------------
@app.get("/")
def read_root():
    return {"message": "Backend FastAPI actif ✅"}
