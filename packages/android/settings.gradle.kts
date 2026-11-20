// Dotwear の Android ライブラリ（Gradle のマルチモジュール）。ADR-009・ADR-019
//   :icons    dev.dotwear:dotwear-icons    アイコンだけ（Compose UI だけに依存。Material 3 には依存しない）
//   :compose  dev.dotwear:dotwear-compose  UI 一式（:icons に依存）
// 生成物（src/generated/）は `pnpm generate android` で作る。git には入れない（ADR-014）
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "dotwear-android"
include(":icons")
include(":compose")

// Kit（ADR-023）は非公開のリポジトリにだけある。フォルダがないとき（公開用リポジトリ）は入れない
if (file("kit").exists()) include(":kit")

// デモアプリはリポジトリの apps/ に置き、同じ Gradle のビルドに入れる（ライブラリの変更がすぐ反映されるように）
include(":demo")
project(":demo").projectDir = file("../../apps/demo-android")
