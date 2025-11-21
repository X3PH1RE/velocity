# Velocity Smart-Traffic Testbed - Docker Configuration
# 
# Build: docker build -t velocity .
# Run:   docker run -p 5000:5000 velocity
# 
# Or with docker-compose:
#   docker-compose up

FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY server.py .
COPY public/ public/

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5000/status')" || exit 1

# Run the application
CMD ["python", "server.py"]


