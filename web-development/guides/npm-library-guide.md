# `npm`에 라이브러리 배포하기

## 1. 배포 전 필수 준비 사항

라이브러리 배포를 시작하기 전에 `package.json` 파일에 다음 사항이 올바르게 설정되어 있는지 확인해야 합니다.

*   **`"name"`**: 라이브러리의 고유한 이름입니다. 이미 존재하는 이름은 사용할 수 없습니다. 스코프 패키지(`@username/package-name` 형태)를 사용하면 고유성을 보장할 수 있습니다.
*   **`"version"`**: 현재 라이브러리의 버전입니다. 배포할 때마다 버전을 올려주어야 합니다.
*   **`"main"`**: 라이브러리의 메인 진입점 파일입니다. JavaScript로 작성된 라이브러리라면 `index.js`와 같은 파일을 가리킵니다.
*   **`"files"` 또는 `.npmignore`**: 불필요한 파일을 배포에 포함시키지 않도록 설정합니다. `.gitignore` 파일이 있을 경우 `.npmignore` 파일이 우선하며, 특정 파일만 포함하려면 `package.json`의 `"files"` 속성을 사용할 수 있습니다.
*   **`"private": false`**: 공개 저장소에 배포하려면 이 속성이 `false`이거나 아예 없어야 합니다. `true`인 경우 배포가 불가능합니다.
*   **TypeScript 라이브러리**: TypeScript로 작성된 라이브러리라면 빌드 후 생성되는 `d.ts` 파일을 `package.json`의 `"types"` 속성에 명시해야 타입 정보가 포함됩니다.

## 2. npm 계정 로그인

터미널에서 다음 명령어를 실행해 npm 계정에 로그인합니다.

```bash
npm login
```

명령어 실행 후 npm 웹사이트의 로그인 페이지가 열리면 인증 절차를 완료합니다.
2단계 인증(2FA)을 사용 중이라면 일회용 비밀번호를 입력해야 할 수 있습니다.

## 3. 버전 업데이트
배포할 때마다 패키지 버전을 올려야 합니다. npm version 명령어를 사용하면 package.json의 version을 자동으로 업데이트하고, Git 태그를 생성합니다.

```bash
npm version patch   # 하위 호환 가능한 버그 수정 (0.0.1 -> 0.0.2)
npm version minor   # 하위 호환 가능한 기능 추가 (0.1.0 -> 0.2.0)
npm version major   # 하위 호환되지 않는 변경 (1.0.0 -> 2.0.0)
```

> 팁: `npm version` 명령어를 사용하면 Git 커밋 및 태그가 자동으로 생성되므로, `git push --tags`를 추가로 실행하여 원격 저장소에 태그를 푸시하는 것이 좋습니다.

## 4. 패키지 배포
버전 업데이트가 완료되면 다음 명령어로 라이브러리를 npm에 배포합니다.

```bash
npm publish
```

- 스코프 패키지: `@my-username/my-package`와 같이 스코프가 있는 패키지는 기본적으로 비공개로 설정됩니다. 공개로 배포하려면 `-–access public` 플래그를 추가해야 합니다.
- 비공개 패키지: 유료 계정으로 비공개 패키지를 배포하려면 별도의 `--access` 플래그 없이 `npm publish`를 실행합니다.

## 5. 참고 자료
- npm 공식 문서 - 패키지 생성 및 배포: https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/
- TypeScript 라이브러리 배포: https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html
- `.npmignore`와 `files` 속성: https://docs.npmjs.com/cli/v9/using-npm/developers/