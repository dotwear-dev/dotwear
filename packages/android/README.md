# Dotwear for Jetpack Compose

Pixel-perfect pixel-art icons and pixel-style components for Compose. minSdk 24.

> The Android libraries are not published to Maven Central yet. To try them now, build from this repository
> (`packages/android`, modules `:icons` and `:compose`) or publish them to your local Maven repository:
>
> ```sh
> pnpm install && pnpm --filter @dotwear/android run build
> cd packages/android && ./gradlew publishToMavenLocal
> ```

```kotlin
dependencies {
    implementation("dev.dotwear:dotwear-compose:<version>") // UI + icons
    // or only the icons (no Material 3 dependency):
    implementation("dev.dotwear:dotwear-icons:<version>")
}
```

```kotlin
DotwearTheme {
    DotwearIcon(DotwearIcons.Save, scale = 2, contentDescription = "Save")
    DotwearButton(onClick = ::save) { Text("Save") }
    DotwearSwitch(checked = wifi, onCheckedChange = { wifi = it }, label = { Text("Wi-Fi") })
    DotwearTextField(value = email, onValueChange = { email = it }, label = "Email")
    DotwearCard { Text("Sales") }
}
```

### Font

`DotwearTheme` sets the bundled pixel font [DotGothic16](https://github.com/fontworks-fonts/DotGothic16) (SIL Open Font License 1.1) on the whole `MaterialTheme.typography`, so plain `Text` uses it too. It is also available as `DotwearFont.family`. The license text ships in the library at `assets/licenses/DotGothic16-OFL.txt`; include it in your app's open source notices. The font is drawn on a 16px grid, so it is crisp at 16sp on integer densities and may blur with a custom font scale.

On screens with a fractional density (1.5×, 2.625×, …) one cell is rounded down to a whole number of pixels, so edges stay crisp. TalkBack, font scaling and 48dp touch targets work like the standard components.

Docs: https://dotwear.dev · License: MIT
