from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ado_service.dd_engine import DelayDiscountingSession


app = FastAPI()
sessions = {}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateSessionRequest(BaseModel):
    config: dict | None = None
    context: dict | None = None


class UpdateSessionRequest(BaseModel):
    trial_data: dict | None = None
    design: dict | None = None
    response: dict | None = None


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/ado/sessions")
def create_session(request: CreateSessionRequest):
    config = request.config or {}
    session = DelayDiscountingSession(
        grid_design=config.get("grid_design"),
        grid_param=config.get("grid_param"),
    )
    session.session_id = uuid4().hex
    sessions[session.session_id] = session
    return session.summary()


@app.post("/ado/sessions/{session_id}/update")
def update_session(session_id: str, request: UpdateSessionRequest):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Unknown ADO session")

    design = request.design
    response = request.response
    if response is None and request.trial_data is not None:
        response = {"choice": request.trial_data.get("choice")}
    if design is None and request.trial_data is not None:
        design = request.trial_data.get("ado_design")

    if design is None or response is None:
        raise HTTPException(status_code=400, detail="Missing design or response")

    return sessions[session_id].update(design, response)

