pipeline {
  agent any

  environment {
    // >>>> CHANGE THESE <<<<
    DOCKERHUB_NAMESPACE = 'laly9999'        // your DockerHub username/org
    IMAGE_NAME         = 'node-ci-demo'     // repo/image name
    REGISTRY           = 'https://index.docker.io/v1/'
    // Jenkins Credentials ID storing DockerHub username/password:
    DOCKERHUB_CREDS_ID = 'dockerhub-credentials'
    // Tag using both build number and short git commit
    SHORT_SHA = "${env.GIT_COMMIT?.take(7) ?: 'local'}"
  }

  //triggers {
    // GitHub webhook will hit /github-webhook/ endpoint; also poll as a fallback 
    // Poll SCM (simple)  :  With Poll SCM, Jenkins will pick it up within ~2 minutes.
    //pollSCM('H/2 * * * *')
    // GitHub webhook (realtime) :  With a webhook, the build starts immediately.
  //}

//   options {
//     timestamps()
//     ansiColor('xterm')
//   }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Image') {
      steps {
        script {
          IMAGE_TAG = "${env.BUILD_NUMBER}-${env.SHORT_SHA}"
          dockerImage = docker.build("${DOCKERHUB_NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG}")
        }
      }
    }

    stage('Run Tests (inside container)') {
      steps {
        script {
          // Run the test command inside the built image
          sh "docker run --rm ${DOCKERHUB_NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG} npm test"
        }
      }
    }

    stage('Push Image') {
      steps {
        script {
          withCredentials([usernamePassword(credentialsId: DOCKERHUB_CREDS_ID,
                                            usernameVariable: 'DOCKERHUB_USER',
                                            passwordVariable: 'DOCKERHUB_PASS')]) {
            sh "echo \$DOCKERHUB_PASS | docker login -u \$DOCKERHUB_USER --password-stdin"
            sh "docker push ${DOCKERHUB_NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG}"
            // also tag "latest"
            sh "docker tag ${DOCKERHUB_NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG} ${DOCKERHUB_NAMESPACE}/${IMAGE_NAME}:latest"
            sh "docker push ${DOCKERHUB_NAMESPACE}/${IMAGE_NAME}:latest"
            sh "docker logout"
          }
        }
      }
    }
  }

  post {
    always {
      sh 'docker system prune -f || true'
    }
  }
}
