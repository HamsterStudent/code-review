const core = require('@actions/core');
const github = require('@actions/github');
const { WebClient } = require('@slack/web-api');

// Slack 클라이언트 설정
const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

async function main() {
  try {
    const selectedReviewer = selectRandomReviewer();

    if (!selectedReviewer) {
      core.setFailed('No reviewer selected.');
      return;
    }

    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

    // GitHub PR에 리뷰어 추가
    await octokit.rest.pulls.requestReviewers({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: github.context.issue.number,
      reviewers: [selectedReviewer.githubName],
    });

    console.log(`Assigned reviewer: ${selectedReviewer.githubName}`);

    // Slack으로 메시지 전송
    await sendDirectMessage(selectedReviewer);
    console.log(`Sent message to Slack user: ${selectedReviewer.slackUserId}`);

  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

function selectRandomReviewer() {
  const prCreator = github.context.payload.pull_request.user.login;
  const candidateReviewers = getCandidates().filter(
    (person) => person.githubName !== prCreator // PR 작성자 제외
  );

  // 후보자 배열이 비어있는지 확인
  if (candidateReviewers.length === 0) {
    core.setFailed('No candidates available for review.');
    return null;
  }

  return candidateReviewers[Math.floor(Math.random() * candidateReviewers.length)];
}

function getCandidates() {
  const reviewersEnv = process.env.REVIEWERS || "[]";
  const reviewers = JSON.parse(reviewersEnv);  // JSON 파싱

  // 리뷰어 배열의 각 항목이 올바르게 형성되어 있는지 확인
  return reviewers.filter(person => person.githubName);  // githubName이 있는 사람만 반환
}

async function sendDirectMessage(reviewer) {
  try {
    // Slack 메시지 전송
    await slackClient.chat.postMessage({
      text: createMessage(github.context, reviewer),  // 메시지 내용
      channel: reviewer.slackUserId,     // Slack 사용자 ID
    });
    console.log(`Message sent to ${reviewer.slackUserId}`);
  } catch (error) {
    console.error('Failed to send message to Slack:', error);
  }
}

function createMessage(context, reviewer) {
  return `리뷰어로 할당되었습니다! \n - PR 제목: ${context.payload.pull_request.title} \n - 리뷰어: ${reviewer.githubName} \n - PR 바로가기: ${context.payload.pull_request.html_url}`;
}

main().catch((error) => core.setFailed(error.message));
