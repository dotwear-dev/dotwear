#!/usr/bin/env bash
# iOS シミュレーターでテストする（PixelRoundtripTests を @2x・@3x の実機相当で動かし、スナップショットも撮る）。
# 手元と CI で入っているシミュレーターが違うので、名前を決め打ちせず、使える iPhone の最初の 1 台を選ぶ
set -euo pipefail
cd "$(dirname "$0")/.."
device_id=$(xcrun simctl list devices available -j \
  | python3 -c 'import json,sys; d=json.load(sys.stdin)["devices"]; print(next(x["udid"] for k,v in sorted(d.items(), reverse=True) if "iOS" in k for x in v if x["name"].startswith("iPhone")))')
echo "iOS シミュレーター: ${device_id}"
# プロダクトが複数あるとき、すべてのテストを含むスキームは "<パッケージ名>-Package" になる
# -quiet だと失敗の理由が出ないので、全体の出力から必要な行だけを残す（CI のログで原因を読めるように）。
# pipefail により、xcodebuild が失敗すればこのスクリプトも失敗する
xcodebuild test -scheme Dotwear-Package -destination "id=${device_id}" "$@" 2>&1 \
  | { grep -E "error:|監査の指摘|Test Case .*(passed|failed)|Executed|\*\* TEST" || true; }
