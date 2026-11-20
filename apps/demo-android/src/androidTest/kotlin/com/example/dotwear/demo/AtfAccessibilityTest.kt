// エミュレーター（実際の Android）で、Google の Accessibility Test Framework（ATF）を有効にして全画面を巡る。
// 操作のたびに、画面全体のタップ領域・読み上げる名前・コントラストなどを ATF が検査する。
// Robolectric では ATF が動かないので、JVM のテスト（src/test の AccessibilityTest）とは別にここで行う。
//   手元：エミュレーターを起動して ./gradlew :demo:connectedDebugAndroidTest
package com.example.dotwear.demo

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.accessibility.enableAccessibilityChecks
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AtfAccessibilityTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    @Before
    fun setUp() {
        compose.enableAccessibilityChecks()
    }

    @Test
    fun walkAllScreensWithAtf() {
        compose.setContent { DemoApp() }

        // ログイン
        // 最初の入力欄がメールアドレス
        compose.onAllNodes(hasSetTextAction())[0].performTextInput("taro@example.com")
        compose.onNodeWithTag("login").performClick()
        compose.waitUntil(5_000) { compose.onAllNodes(hasText("受注一覧")).fetchSemanticsNodes().isNotEmpty() }

        // 一覧 → 詳細
        compose.onNodeWithTag("order-A-1024").assertIsDisplayed().performClick()
        compose.onNodeWithTag("delete").performScrollTo().performClick()
        compose.onNodeWithText("キャンセル").performClick()
        compose.onNodeWithText("戻る").performClick()

        // 設定
        compose.onNodeWithTag("settings").performClick()
        compose.onNodeWithTag("push").performClick()
    }
}
