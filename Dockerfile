# ==============================================================================
# STAGE 1: Base Image
#
# Use an official, slim Python image as the foundation. This provides the
# necessary runtime environment while keeping the final image size small.
# ==============================================================================
FROM python:3.11-slim

# ==============================================================================
# Environment Variables
#
# Set environment variables for the container.
# - PYTHONUNBUFFERED: Ensures that Python output is sent directly to the
#   terminal without being buffered, which is essential for proper logging in
#   containerized environments like Cloud Run.
# - PYTHONPATH: Tells Python where to look for modules. Setting it to the app
#   directory ensures that local imports (e.g., from 'stocks_agent') work correctly.
# ==============================================================================
ENV PYTHONUNBUFFERED True
ENV PYTHONPATH /app

# ==============================================================================
# Working Directory
#
# Set the default working directory for subsequent commands.
# ==============================================================================
WORKDIR /app

# ==============================================================================
# Install Dependencies
#
# Copy the requirements file and install packages. This is done in a separate
# step before copying the application code to leverage Docker's layer caching.
# If requirements.txt doesn't change, this layer won't be rebuilt, speeding up
# subsequent builds.
# ==============================================================================
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ==============================================================================
# User and Permissions Setup (Security Best Practice)
#
# Create a non-root user to run the application. Running containers as a
# non-root user is a critical security best practice to limit the potential
# impact of a container compromise.
# ==============================================================================
RUN adduser --disabled-password --gecos "" myuser && \
    chown -R myuser:myuser /app

# ==============================================================================
# Copy Application Code
#
# Copy the rest of the application source code into the container.
# ==============================================================================
COPY . .

# Switch to the non-root user for all subsequent commands.
USER myuser

# ==============================================================================
# Expose Port
#
# Inform Docker that the container listens on the specified network port at
# runtime. Cloud Run will automatically provide the PORT environment variable,
# which defaults to 8080.
# ==============================================================================
EXPOSE 8080

# ==============================================================================
# Entrypoint Command
#
# Define the command to run the application.
# - "sh -c": This is used to ensure that the $PORT environment variable
#   provided by Cloud Run is correctly interpreted at runtime.
# - uvicorn: The ASGI server that runs the FastAPI application.
# - --host 0.0.0.0: Binds the server to all available network interfaces,
#   which is necessary for it to be accessible from outside the container.
# ==============================================================================
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]