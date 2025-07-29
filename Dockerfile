# 1. Start with an official Python base image.
# Using a "slim" version keeps the final container size smaller.
FROM python:3.11-slim

# 2. Set environment variables for the container.
# This ensures Python output is sent straight to the container logs.
ENV PYTHONUNBUFFERED True
# The ADK uses this variable to find agent modules.
ENV PYTHONPATH /app

# 3. Set the working directory inside the container.
WORKDIR /app

# 4. Copy the dependencies list and install packages.
# This step is done separately to leverage Docker's layer caching.
# If requirements.txt doesn't change, Docker won't re-run this step on subsequent builds, making them faster.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN adduser --disabled-password --gecos "" myuser && \
    chown -R myuser:myuser /app

# 5. Copy your application code into the container.
# This copies everything from your project folder into the /app directory in the container.
COPY . .

USER myuser

# 6. Expose the port.
# Cloud Run will automatically provide a PORT environment variable, which defaults to 8080.
# Our CMD instruction will use this variable.
EXPOSE 8080

# 7. Define the command to run your application.
# This command starts the Uvicorn server, telling it to run the 'app' object
# from your 'main.py' file. It listens on all network interfaces (0.0.0.0)
# on the port specified by the PORT environment variable.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]