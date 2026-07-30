from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import urllib.request, json
import models, schemas, database, dependencies

router = APIRouter(prefix="/api/projects", tags=["projects"])

def transmit_to_company_network(project: models.Project):
    payload = {
        "client_project_id": project.id,
        "name": project.name,
        "description": project.description,
        "target_platforms": project.target_platforms or "Not specified",
        "target_audience": project.target_audience or "Not specified",
        "expected_timeline": project.expected_timeline or "Not specified",
        "budget_range": project.budget_range or "Not specified",
        "key_features": project.key_features or "Not specified",
        "existing_systems": project.existing_systems or "Not specified"
    }
    try:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            'http://localhost:8000/api/gateway/receive-request', 
            data=data, 
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            print(f"[A2A TRANSMIT] Successfully sent project {project.id} to Company Network. Response: {response.read().decode()}")
    except Exception as e:
        print(f"[A2A TRANSMIT] Failed to transmit project {project.id} to Company Network: {e}")

@router.post("/", response_model=schemas.ProjectResponse)
def create_project(
    project: schemas.ProjectCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(database.get_db)
):
    new_project = models.Project(
        name=project.name,
        description=project.description,
        target_platforms=project.target_platforms,
        target_audience=project.target_audience,
        expected_timeline=project.expected_timeline,
        budget_range=project.budget_range,
        key_features=project.key_features,
        existing_systems=project.existing_systems,
        user_id=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    return new_project

@router.get("/", response_model=List[schemas.ProjectResponse])
def get_projects(
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(database.get_db)
):
    projects = db.query(models.Project).filter(models.Project.user_id == current_user.id).all()
    return projects

@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(
    project_id: int,
    project_update: schemas.ProjectCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(database.get_db)
):
    project_query = db.query(models.Project).filter(
        models.Project.id == project_id, 
        models.Project.user_id == current_user.id
    )
    db_project = project_query.first()
    
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    update_data = project_update.model_dump()
    project_query.update(update_data, synchronize_session=False)
    db.commit()
    
    updated_project = project_query.first()
    
    return updated_project

@router.post("/{project_id}/transmit")
def transmit_project(
    project_id: int,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(database.get_db)
):
    project = db.query(models.Project).filter(
        models.Project.id == project_id, 
        models.Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    background_tasks.add_task(transmit_to_company_network, project)
    return {"message": "Project transmission to Company Network initiated."}
