#!/usr/bin/env bash
# 처음 한 번만 실행: GitHub Actions가 비밀번호(액세스 키) 없이 AWS에 로그인할 수 있게 설정합니다.
#   사용법: bash scripts/setup-aws-github.sh <GitHub아이디>/<저장소이름>
#   예)     bash scripts/setup-aws-github.sh myname/fastapi-movie-19
# 만드는 것:
#   - GitHub OIDC 공급자 (이미 있으면 건너뜀)
#   - IAM 역할 movie-app-github-deploy : 해당 저장소 main 브랜치에서만 사용 가능,
#     권한은 "보안 그룹의 SSH 규칙 추가/삭제" 하나뿐
set -euo pipefail

REPO="${1:?사용법: bash scripts/setup-aws-github.sh <GitHub아이디>/<저장소이름>}"
PROFILE="${AWS_PROFILE:-movie-deploy}"
REGION=ap-southeast-2
SG_ID=sg-0988d21181365c482
ROLE=movie-app-github-deploy
AWS="aws --profile $PROFILE --region $REGION"

ACCOUNT=$($AWS sts get-caller-identity --query Account --output text)
PROVIDER_ARN="arn:aws:iam::$ACCOUNT:oidc-provider/token.actions.githubusercontent.com"

if ! $AWS iam get-open-id-connect-provider --open-id-connect-provider-arn "$PROVIDER_ARN" >/dev/null 2>&1; then
  echo "▶ GitHub OIDC 공급자 생성"
  $AWS iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com >/dev/null
fi

TRUST=$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "$PROVIDER_ARN" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:$REPO:ref:refs/heads/main"
      }
    }
  }]
}
JSON
)

POLICY=$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["ec2:AuthorizeSecurityGroupIngress", "ec2:RevokeSecurityGroupIngress"],
    "Resource": "arn:aws:ec2:$REGION:$ACCOUNT:security-group/$SG_ID"
  }]
}
JSON
)

if $AWS iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
  echo "▶ 역할이 이미 있어 신뢰 정책만 갱신"
  $AWS iam update-assume-role-policy --role-name "$ROLE" --policy-document "$TRUST"
else
  echo "▶ IAM 역할 생성"
  $AWS iam create-role --role-name "$ROLE" --assume-role-policy-document "$TRUST" \
    --description "GitHub Actions deploy for $REPO" >/dev/null
fi
$AWS iam put-role-policy --role-name "$ROLE" --policy-name ssh-ingress-only --policy-document "$POLICY"

echo
echo "완료. GitHub Secret AWS_ROLE_ARN 에 아래 값을 넣으세요:"
$AWS iam get-role --role-name "$ROLE" --query Role.Arn --output text
