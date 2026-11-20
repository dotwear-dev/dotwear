// コンポーネントの見た目のスナップショット（Roborazzi）。xxhdpi（3 倍）と hdpi（1.5 倍）で撮る。
// にじみの有無は ShapePixelTest が厳密に確かめるので、こちらは見た目が意図せず変わっていないかに気づくための補助。
//   撮り直す：./gradlew :compose:recordRoborazziDebug   比べる：./gradlew :compose:verifyRoborazziDebug
package dev.dotwear.compose

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.github.takahirom.roborazzi.captureRoboImage
import dev.dotwear.icons.DotwearIcon
import dev.dotwear.icons.DotwearIcons
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class ComponentSnapshotTest {
    private fun snap(name: String, content: @Composable () -> Unit) {
        captureRoboImage("src/test/snapshots/$name.png") {
            DotwearTheme {
                Column(
                    Modifier.background(Dotwear.colors.background).padding(16.dp).width(360.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) { content() }
            }
        }
    }

    @Test
    @Config(qualifiers = "xxhdpi")
    fun buttons() = snap("buttons-xxhdpi") { Buttons() }

    @Test
    @Config(qualifiers = "hdpi")
    fun buttonsHdpi() = snap("buttons-hdpi") { Buttons() }

    @Test
    @Config(qualifiers = "xxhdpi")
    fun toggles() = snap("toggles-xxhdpi") {
        DotwearSwitch(checked = true, onCheckedChange = {}, label = { Text("Wi-Fi") })
        DotwearSwitch(checked = false, onCheckedChange = {}, label = { Text("Bluetooth") })
        DotwearCheckbox(checked = true, onCheckedChange = {}, label = { Text("同意する") })
        DotwearCheckbox(checked = false, onCheckedChange = {}, label = { Text("通知を受け取る") })
        DotwearSwitch(checked = true, onCheckedChange = {}, enabled = false, label = { Text("無効") })
    }

    @Test
    @Config(qualifiers = "xxhdpi")
    fun textFields() = snap("text-fields-xxhdpi") {
        DotwearTextField(value = "", onValueChange = {}, label = "メールアドレス", placeholder = "メールアドレスを入力")
        DotwearTextField(value = "山田 太郎", onValueChange = {}, label = "名前")
        DotwearTextField(value = "taro@", onValueChange = {}, label = "メール", error = "メールアドレスの形式が正しくありません")
        DotwearTextField(value = "編集できません", onValueChange = {}, label = "無効", enabled = false)
    }

    @Test
    @Config(qualifiers = "xxhdpi")
    fun cards() = snap("cards-xxhdpi") {
        DotwearCard {
            Text("今月の売上")
            Text("¥1,234,000")
        }
        DotwearCard(variant = DotwearCardVariant.Flat) { Text("flat のカード") }
    }

    @Composable
    private fun Buttons() {
        for (size in DotwearButtonSize.entries) {
            // 大きいボタンは 1 行に 4 つ入らないので、折り返して並べる（文字が縦に折り返さないように）
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                for (variant in DotwearButtonVariant.entries) {
                    DotwearButton(onClick = {}, variant = variant, size = size) { Text("保存") }
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DotwearButton(onClick = {}, enabled = false) { Text("無効") }
            DotwearButton(onClick = {}, variant = DotwearButtonVariant.Secondary) {
                DotwearIcon(DotwearIcons.Save)
                Text("保存")
            }
        }
    }
}
