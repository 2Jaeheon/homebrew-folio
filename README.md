# homebrew-folio

Folio 설치용 Homebrew tap입니다.

```bash
brew tap moduggagi/folio
brew trust moduggagi/folio
brew install --cask folio
```

직접 받기: [Folio.zip](https://github.com/MODUGGAGI/homebrew-folio/releases/latest/download/Folio.zip)

## 릴리스

`MODUGGAGI/folio`에서 `scripts/release.sh 1.2.0`을 실행합니다. 이 저장소의 `release` workflow가 빌드, Developer ID 서명, 공증, staple, Release 업로드, `Casks/folio.rb` 갱신을 합니다.

`build` job만 folio 코드를 실행하고 서명 비밀값을 받지 않습니다. `sign` job은 이 저장소의 스크립트만 실행합니다.

비밀값: `FOLIO_DEPLOY_KEY`, `DEVELOPER_ID_P12`, `DEVELOPER_ID_P12_PASSWORD`, `ASC_KEY_P8`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `SPARKLE_ED_PRIVATE_KEY`.
