# Use Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY backend .

# Expose the FastAPI port
EXPOSE 8000

# Run the backend
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
