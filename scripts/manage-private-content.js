#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Git Submodule 기반 private content 관리 도구
 */

class PrivateContentManager {
  constructor() {
    this.privateDir = path.join(process.cwd(), 'private');
    this.isSubmodule = fs.existsSync('.gitmodules');
  }

  // Submodule 상태 확인
  checkSubmoduleStatus() {
    if (!this.isSubmodule) {
      console.log('Git Submodule이 설정되지 않았습니다.');
      console.log('scripts/setup-submodule.sh를 실행하여 설정하세요.');
      return false;
    }

    try {
      const status = execSync('git submodule status', { encoding: 'utf8' });
      console.log('Submodule 상태:');
      console.log(status);
      return true;
    } catch (error) {
      console.error('Submodule 상태 확인 실패:', error.message);
      return false;
    }
  }

  // Private content 업데이트
  updatePrivateContent() {
    if (!this.checkSubmoduleStatus()) return;

    try {
      console.log('Private content를 업데이트합니다...');
      execSync('git submodule update --remote private', { stdio: 'inherit' });
      console.log('Private content 업데이트 완료');
    } catch (error) {
      console.error('업데이트 실패:', error.message);
    }
  }

  // Private content 커밋 및 푸시
  commitPrivateContent(message) {
    if (!fs.existsSync(this.privateDir)) {
      console.log('private 디렉토리가 없습니다.');
      return;
    }

    try {
      console.log('Private content를 커밋합니다...');
      
      // private 디렉토리로 이동하여 커밋
      process.chdir(this.privateDir);
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
      execSync('git push', { stdio: 'inherit' });
      
      // 메인 디렉토리로 돌아가서 submodule 업데이트
      process.chdir('..');
      execSync('git add private', { stdio: 'inherit' });
      execSync(`git commit -m "Update private content: ${message}"`, { stdio: 'inherit' });
      
      console.log('Private content 커밋 완료');
    } catch (error) {
      console.error('커밋 실패:', error.message);
      process.chdir('..');
    }
  }

  // 새로운 면접 자료 생성
  createInterviewContent(topic, type = 'algorithms') {
    const filePath = path.join(this.privateDir, 'interview', type, `${topic}-interview-prep.md`);
    
    if (fs.existsSync(filePath)) {
      console.log(`파일이 이미 존재합니다: ${filePath}`);
      return;
    }

    const template = `# ${topic} 면접 대비

## 핵심 개념

### 정의


### 시간/공간 복잡도


## 면접 질문과 답변

### Q1: 


**답변:**


### Q2: 


**답변:**


## 실무 적용 사례


## 체크리스트

- [ ] 기본 개념 이해
- [ ] 코드 구현 능력
- [ ] 복잡도 분석
- [ ] 실무 경험 연결
`;

    fs.writeFileSync(filePath, template);
    console.log(`✅ 면접 자료 생성: ${filePath}`);
  }

  // 사용법 출력
  showUsage() {
    console.log(`
📚 Private Content Manager 사용법:

기본 명령어:
  node scripts/manage-private-content.js status     # Submodule 상태 확인
  node scripts/manage-private-content.js update     # Private content 업데이트
  node scripts/manage-private-content.js commit "메시지"  # Private content 커밋
  node scripts/manage-private-content.js create <topic> [type]  # 새 면접 자료 생성

예시:
  node scripts/manage-private-content.js create "binary-search"
  node scripts/manage-private-content.js create "system-design" system-design
  node scripts/manage-private-content.js commit "Add new algorithm notes"
`);
  }
}

// CLI 실행
if (require.main === module) {
  const manager = new PrivateContentManager();
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  switch (command) {
    case 'status':
      manager.checkSubmoduleStatus();
      break;
    case 'update':
      manager.updatePrivateContent();
      break;
    case 'commit':
      if (!arg1) {
        console.log('커밋 메시지가 필요합니다.');
        break;
      }
      manager.commitPrivateContent(arg1);
      break;
    case 'create':
      if (!arg1) {
        console.log('주제명이 필요합니다.');
        break;
      }
      manager.createInterviewContent(arg1, arg2);
      break;
    default:
      manager.showUsage();
  }
}

module.exports = PrivateContentManager;
