import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file_storage, subfolder: str = "food") -> str:
    """
    Saves an uploaded file safely, verifying extension, content-type and size.
    Returns relative public URL path (e.g. /uploads/food/abc-123.jpg).
    """
    if not file_storage or file_storage.filename == "":
        raise ValueError("No file provided")
        
    filename = secure_filename(file_storage.filename)
    if not allowed_file(filename):
        raise ValueError("Invalid file extension. Supported formats: JPG, JPEG, PNG, WEBP.")
        
    # Check mime type
    if file_storage.content_type not in ALLOWED_MIME_TYPES:
        raise ValueError("Invalid image content type.")
        
    ext = filename.rsplit(".", 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    
    upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], subfolder)
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, unique_filename)
    file_storage.save(file_path)
    
    # Return relative URL
    return f"/api/v1/uploads/{subfolder}/{unique_filename}"
