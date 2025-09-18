#!/bin/bash

# Git Submodule 설정 스크립트
# 사용법: ./scripts/setup-submodule.sh

echo "🔧 Git Submodule 설정을 시작합니다..."

# 1. GitHub에서 private 저장소 생성 확인
echo "📋 다음 단계를 수행해주세요:"
echo "1. GitHub에서 'learn-cs-private' 저장소를 private으로 생성"
echo "2. 저장소 URL을 복사 (SSH 권장: git@github.com:lledellebell/learn-cs-private.git)"
echo ""

read -p "저장소를 생성했나요? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ 저장소 생성 후 다시 실행해주세요."
    exit 1
fi

read -p "저장소 URL을 입력하세요: " repo_url
if [[ -z "$repo_url" ]]; then
    echo "❌ 저장소 URL이 필요합니다."
    exit 1
fi

# 2. 기존 private 디렉토리를 임시로 백업
if [ -d "private" ]; then
    echo "📦 기존 private 디렉토리를 백업합니다..."
    mv private private_backup_$(date +%Y%m%d_%H%M%S)
fi

# 3. private 저장소에 초기 내용 푸시
echo "📤 private 저장소에 초기 내용을 푸시합니다..."
temp_dir=$(mktemp -d)
cd "$temp_dir"

git clone "$repo_url" .
cp -r "$OLDPWD/private_backup_"*/* . 2>/dev/null || echo "새로운 private 저장소입니다."

git add .
git commit -m "Initial private content setup" || echo "이미 커밋된 내용입니다."
git push origin main || git push origin master

cd "$OLDPWD"
rm -rf "$temp_dir"

# 4. 메인 저장소에 submodule 추가
echo "🔗 메인 저장소에 submodule을 추가합니다..."
git submodule add "$repo_url" private

# 5. .gitmodules 파일 확인
echo "📄 .gitmodules 파일이 생성되었습니다."
cat .gitmodules

# 6. 사용법 안내
echo ""
echo "✅ Git Submodule 설정이 완료되었습니다!"
echo ""
echo "📚 사용법:"
echo "  # private 내용 업데이트"
echo "  cd private"
echo "  git pull origin master"
echo "  cd .."
echo "  git add private"
echo "  git commit -m 'Update private content'"
echo ""
echo "  # private 내용 수정"
echo "  cd private"
echo "  # 파일 수정..."
echo "  git add ."
echo "  git commit -m 'Add new private content'"
echo "  git push"
echo "  cd .."
echo "  git add private"
echo "  git commit -m 'Update private submodule'"
echo ""
echo "  # 다른 환경에서 클론할 때"
echo "  git clone --recursive <master-repo-url>"
echo "  # 또는"
echo "  git clone <master-repo-url>"
echo "  git submodule update --init --recursive"
