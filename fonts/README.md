# fonts/

ライセンスを確認したピクセルフォントだけを置く（CLAUDE.md・ADR-026）。配布物に含めるときは、ライセンス文も一緒に入れる。

| フォント | ライセンス | 入手元 | 使うところ |
|---|---|---|---|
| DotGothic16（`DotGothic16/`） | SIL OFL 1.1（`DotGothic16/OFL.txt`。Reserved Font Name なし） | https://github.com/google/fonts/tree/main/ofl/dotgothic16（元は https://github.com/fontworks-fonts/DotGothic16） | Dotwear の標準の文字（`typography.family`） |

- DotGothic16 は 16px を 1 マスとして描かれている。くっきり見えるのは 16px の整数倍のときだけ。
