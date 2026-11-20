// Android のデモアプリ。iOS のデモ（apps/demo-ios）と同じ 4 画面（ログイン → 受注一覧 → 詳細、設定）。
// ビルドは packages/android の Gradle に含める（settings.gradle.kts の :demo）
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

android {
    // アプリ ID はデモ専用の仮の値（iOS のデモと同じ扱い）
    namespace = "com.example.dotwear.demo"
    compileSdk = 37
    defaultConfig {
        applicationId = "com.example.dotwear.demo"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    testOptions {
        unitTests.isIncludeAndroidResources = true
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(project(":compose"))
    implementation(platform(libs.compose.bom))
    implementation(libs.activity.compose)

    testImplementation(libs.junit)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.ext.junit)
    testImplementation(platform(libs.compose.bom))
    testImplementation(libs.compose.ui.test.junit4)
    testImplementation(libs.compose.ui.test.junit4.accessibility)
    debugImplementation(libs.compose.ui.test.manifest)

    // エミュレーターで本物の ATF（Accessibility Test Framework）を動かすテスト
    androidTestImplementation(platform(libs.compose.bom))
    androidTestImplementation(libs.compose.ui.test.junit4)
    androidTestImplementation(libs.compose.ui.test.junit4.accessibility)
    androidTestImplementation(libs.androidx.test.runner)
    androidTestImplementation(libs.androidx.test.ext.junit)
}
