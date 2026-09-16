FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY seed.py ./

# The repo keeps some files at mode 600; the container runs as a non-root user,
# so normalise read/execute bits for all.
RUN chmod -R a+rX /app

# SQLite is stored on a mounted volume so data survives pod restarts.
RUN mkdir -p /data
ENV CASHIER_DATABASE_URL=sqlite:////data/cashier.db

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
