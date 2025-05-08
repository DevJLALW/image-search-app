# 🖼️ Image Search App (Google Cloud Vision + Google Cloud Vertex AI AutoML model + Gemini API)

This application allows users to:

- Upload **images** and detect objects using **Google Cloud Vision**, **Vertex AI AutoML**, and **Gemini API**.
- Search images using **tags** (object labels) saved in Firestore from above results.
- Upload **videos** and perform **label detection** using **Google Video Intelligence API**.

---

## 🔧 Features

1. **Image Upload & Object Detection**
   - Vision API: Object localization
   - Vertex AI: AutoML object detection
   - Gemini: Multimodal vision using Gemini 2.0

2. **Image Search**
   - Search previously uploaded images using tag-based metadata from detections.

3. **Video Analysis**
   - Upload a video and detect labels using Google Cloud's Video Intelligence API.

---

## 🚀 Pre-requisites

Before running the app, make sure to set up the following:

1. ✅ Enable APIs in GCP:
   - [Vertex AI API](https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com)
   - [Cloud Vision API](https://console.cloud.google.com/flows/enableapi?apiid=vision.googleapis.com)
   - [Video Intelligence API](https://console.cloud.google.com/flows/enableapi?apiid=videointelligence.googleapis.com)

2. 🔑 Create **Gemini API key** from:
   - [Google AI studio](https://aistudio.google.com/apikey)

3. 🔗 Link GCP project to Firebase:
   - Use [Firebase Console](https://console.firebase.google.com/) to associate your GCP project.

4. 🛠️ Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)

5. 🧠 Upload and train your model in Vertex AI:
   - [Vertex AI Training Guide](https://cloud.google.com/vertex-ai/docs/training/overview)
   - PASCAL VOC 2008 dataset: https://www.kaggle.com/datasets/sulaimannadeem/pascal-voc-2008

6. 🪣 Create a Cloud Storage bucket (used for image storage)

7. 🔐 Create and update **Secret Manager** entries for:
   - `GCS_BUCKET_NAME`
   - `VERTEX_PROJECT_ID`
   - `VERTEX_ENDPOINT_ID`
   - `VERTEX_LOCATION` (e.g., `us-central1`)
   - `GEMINI_API_KEY`

8. 📄 Update PROJECT_ID in [app.yaml](./app.yaml) as your GCP project number

9. 🔥 Create Firestore database (used to store image metadata and search results)
   -  Create a default database in GCP Firestore: Ensure it is set up with a native structure.
  
10. Enable App Engine in GCP. Make sure the service account that is created has Secret Manager Admin and Storage Admin roles. 

---

## 🛠️ Deployment Steps

```bash
# In Google Cloud SDK shell
gcloud init                    # Select the appropriate Google account and project
gcloud app create              # Choose the region where the app will be deployed
# In VS Code, go to root directory
gcloud app deploy app.yaml --quiet  # Deploy the app
gcloud app browse              # Open the deployed application URL
