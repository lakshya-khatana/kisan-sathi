# ---- 1) build the React app
FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund
COPY frontend/ .
RUN npm run build

# ---- 2) Django + gunicorn, serving the API and the built React app
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
COPY --from=web /web/dist /app/frontend_dist
RUN DJANGO_DEBUG=True python manage.py collectstatic --noinput
RUN useradd -m app && chown -R app /app
USER app
EXPOSE 8000
# If DJANGO_SUPERUSER_USERNAME / _EMAIL / _PASSWORD are set, the admin account is created on first start (ignored if it already exists).
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py createcachetable && (python manage.py createsuperuser --noinput || true) && gunicorn smartfarm.wsgi --bind 0.0.0.0:${PORT:-8000} --workers 2 --threads 4 --timeout 120 --access-logfile -"]
