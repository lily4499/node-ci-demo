Awesome—here’s a **from-scratch, simplest path** that gets you all 5 steps working with a tiny Node app, a Dockerfile, and a Jenkins pipeline. Copy-paste friendly.

---

## 0) Prereqs (once)

* Docker installed where Jenkins runs.
* Jenkins running (local is fine).
* DockerHub account + a token.
* (Optional but nice) GitHub CLI `gh`.

Create DockerHub creds in Jenkins:
**Manage Jenkins → Credentials → System → Global → Add Credentials**

* Kind: *Username with password*
* ID: `dockerhub-credentials`

---

## 1) Make a tiny project

```bash
mkdir node-ci-demo && cd node-ci-demo


---

## 2) Put it on GitHub (Step 1: Code pushed)

```bash
git init
git add .
git commit -m "init: node ci demo"
# If using GitHub CLI:
gh repo create YOUR_GH_USER/node-ci-demo --public --source=. --remote=origin --push
# (or create empty repo on GitHub then:)
# git remote add origin https://github.com/YOUR_GH_USER/node-ci-demo.git
# git branch -M main
# git push -u origin main
```

---

## 3) Create a super-simple Jenkins Pipeline job (Step 2 trigger)

### A) Job

* Jenkins → **New Item** → *Pipeline* → name: `node-ci-demo`
* Scroll to **Pipeline** → Definition: *Pipeline script from SCM*

  * SCM: **Git**
  * Repository URL: `https://github.com/YOUR_GH_USER/node-ci-demo.git`
  * Branches: `*/main`
* **Build Triggers**: choose ONE:

  * **Simplest (no public URL):** check **Poll SCM** and set `H/2 * * * *`

  * **Realtime (needs public URL):** check **GitHub hook trigger for GITScm polling**

    (If Jenkins is local, expose with ngrok and set a GitHub webhook to `https://<ngrok>/github-webhook/`)
            Add webhook (GitHub UI)
                Repo → Settings → Webhooks → Add webhook
                Payload URL: https://<your-ngrok-subdomain>/github-webhook/
                Content type: application/json
                Events: “Just the push event” (or include PRs too)
                Add webhook

Click **Save**.

### B) Add `Jenkinsfile` to your repo

This runs the exact 5 steps: build → test in container → push.

```groovy
pipeline {
  agent any
  environment {
    DOCKERHUB_NAMESPACE = 'YOUR_DOCKERHUB_USER'   // <— change
    IMAGE_NAME = 'node-ci-demo'
    CREDS = 'dockerhub-creds'                      // Jenkins creds ID
    SHORT_SHA = "${env.GIT_COMMIT?.take(7) ?: 'dev'}"
    TAG = "${env.BUILD_NUMBER}-${SHORT_SHA}"
  }
  stages {
    stage('Checkout'){ steps { checkout scm } }

    stage('Build Docker image'){
      steps {
        sh "docker build -t ${DOCKERHUB_NAMESPACE}/${IMAGE_NAME}:${TAG} ."
      }
    }

    stage('Run tests inside container'){
      steps {
        sh "docker run --rm ${DOCKERHUB_NAMESPACE}/${IMAGE_NAME}:${TAG} npm test"
      }
    }

    stage('Push to DockerHub'){
      steps {
        withCredentials([usernamePassword(credentialsId: CREDS, usernameVariable: 'U', passwordVariable: 'P')]) {
          sh """
            echo \$P | docker login -u \$U --password-stdin
            docker push ${DOCKERHUB_NAMESPACE}/${IMAGE_NAME}:${TAG}
            docker tag ${DOCKERHUB_NAMESPACE}/${IMAGE_NAME}:${TAG} ${DOCKERHUB_NAMESPACE}/${IMAGE_NAME}:latest
            docker push ${DOCKERHUB_NAMESPACE}/${IMAGE_NAME}:latest
            docker logout
          """
        }
      }
    }
  }
  post {
    always { sh 'docker system prune -f || true' }
  }
}
```

Commit & push it:

```bash
git add Jenkinsfile
git commit -m "add pipeline"
git push
```

* With **Poll SCM**, Jenkins will pick it up within \~2 minutes.
* With a **webhook**, the build starts immediately.

---

## 4) What’s happening (ties to your 5 steps)

1. **Code pushed to GitHub** → you just did (`git push`).
2. **Jenkins triggers pipeline on commit**

   * Poll SCM (simple) **or** GitHub webhook (realtime).
3. **Build Docker image using Dockerfile**

   * Stage “Build Docker image”: `docker build ...`
4. **Run tests inside container**

   * Stage “Run tests…”: `docker run image npm test`
5. **Push image to DockerHub**

   * Stage “Push to DockerHub”: login, `docker push` versioned + `latest`.

---

## 5) Quick local sanity (optional)

```bash
docker build -t test/node-ci-demo:dev .
docker run --rm test/node-ci-demo:dev npm test
docker run -d -p 3000:3000 --name demo test/node-ci-demo:dev
curl -fsS http://localhost:3000 && echo "OK"
docker rm -f demo
```

---

That’s it—the **simplest** working setup.
If you want SonarQube or real-time webhooks with ngrok next, say the word and I’ll bolt them on cleanly.
