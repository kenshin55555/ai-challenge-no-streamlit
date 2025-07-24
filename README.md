# ADK-only version of the challenge, to facilitate testing due to some weird behavior with the agent itself while attempting to handle questions


- Set  th env variabls in your terminal : 

GOOGLE_GENAI_USE_VERTEXAI=FALSE
GOOGLE_CLOUD_PROJECT='[your_own_test_project]'
GOOGLE_CLOUD_LOCATION='us-central1'
GOOGLE_API_KEY= '[you_own_api_key]'
MODEL=gemini-2.0-flash-exp

- To deploy in cloud run the command : 

```
gcloud run deploy trader-agent-service --source . --region $GOOGLE_CLOUD_LOCATION --project $GOOGLE_CLOUD_PROJECT --allow-unauthenticated --set-env-vars="GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT,GOOGLE_CLOUD_LOCATION=$GOOGLE_CLOUD_LOCATION,GOOGLE_GENAI_USE_VERTEXAI=$GOOGLE_GENAI_USE_VERTEXAI,MODEL=$MODEL,GOOGLE_API_KEY=$GOOGLE_API_KEY"
```

References: 

1. https://google.github.io/adk-docs/deploy/cloud-run/
2. https://github.com/google/adk-python/blob/main/src/google/adk/cli/fast_api.py