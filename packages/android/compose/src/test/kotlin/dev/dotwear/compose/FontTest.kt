// 同梱のフォント（ADR-026）。ジェネレーターが src/generated/res/font にコピーしたものが、リソースとして読めること
package dev.dotwear.compose

import androidx.core.content.res.ResourcesCompat
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import android.content.Context
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class FontTest {
    private val context = ApplicationProvider.getApplicationContext<Context>()

    @Test
    fun bundledFontLoads() {
        assertNotNull(ResourcesCompat.getFont(context, R.font.dotgothic16_regular))
    }

    @Test
    fun licenseIsBundledWithTheFont() {
        // OFL はフォントと一緒に配る決まり（assets/licenses に入れる）
        val text = context.assets.open("licenses/DotGothic16-OFL.txt").bufferedReader().use { it.readText() }
        assert(text.contains("SIL Open Font License"))
    }

    @Test
    fun everyWeightUsesTheSameFont() {
        // 太字を合成させないため、100〜900 のすべての太さに同じ書体を割り当てている
        assertEquals(9, (DotwearFont.family as androidx.compose.ui.text.font.FontListFontFamily).fonts.size)
    }
}
