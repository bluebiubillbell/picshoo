import AppKit
import CoreText
import SwiftUI

/// Picshoo's look, taken from Woo (woo.bingyu.uno): the Chelsea palette in
/// light mode, Mercedes in dark, Product Sans, and capcap's own rounded
/// corners.
///
/// Chelsea: white surfaces on a #f7f7f7 page, club blue as the one accent,
/// navy ink, thin grey rules. Mercedes: #1e1e1e surfaces on black, mint
/// #6fe7c6 as the accent, near-white ink. Every colour here is dynamic, so it
/// follows the system appearance like AppKit's own.
enum WooTheme {
    // MARK: Palette

    /// Club blue in light mode, Mercedes mint in dark. Selection borders, the
    /// selected tool, primary buttons.
    static let accent = dynamic("woo.accent", light: 0x001489, dark: 0x6FE7C6)
    /// The accent's pressed / hover shade.
    static let accentDark = dynamic("woo.accentDark", light: 0x000D5C, dark: 0x55D2B2)
    /// Text and icons drawn on an accent fill: white on blue, black on mint.
    static let onAccent = dynamic("woo.onAccent", light: 0xFFFFFF, dark: 0x000000)
    /// Primary ink: headings, selected labels.
    static let ink = dynamic("woo.ink", light: 0x140A47, dark: 0xF0F3F4)
    /// Body text.
    static let body = dynamic("woo.body", light: 0x404446, dark: 0xD5D8DA)
    /// Secondary text and micro-labels.
    static let muted = dynamic("woo.muted", light: 0x6C7075, dark: 0x8A9095)
    /// Cards, toolbars, panels.
    static let surface = dynamic("woo.surface", light: 0xFFFFFF, dark: 0x1E1E1E)
    /// The ground under surfaces.
    static let page = dynamic("woo.page", light: 0xF7F7F7, dark: 0x000000)
    /// Inset or raised panels inside a surface.
    static let inset = dynamic("woo.inset", light: 0xF2F2F2, dark: 0x151515)
    /// Thin rules and borders.
    static let line = dynamic("woo.line", light: 0xE6E6E6, dark: 0x2E2E2E)
    /// Big-event yellow, Woo's tertiary accent.
    static let gold = NSColor(hex: 0xF5E06B)

    // The settings window's palette. Its views take the ink at lower alphas
    // for secondary text, rules and tinted fills, so one ink per palette
    // carries the whole hierarchy: navy on Chelsea, near-white on Mercedes.

    static let settingsInk = dynamic("woo.settingsInk", light: 0x140A47, dark: 0xF0F3F4)
    static let settingsPage = dynamic("woo.settingsPage", light: 0xF7F7F7, dark: 0x000000)
    static let settingsSurface = dynamic("woo.settingsSurface", light: 0xFFFFFF, dark: 0x1E1E1E)

    /// Whether the system is in dark mode right now.
    static var systemIsDark: Bool { AdaptiveChrome.isDark(NSApp.effectiveAppearance) }

    /// The appearance the settings window is built in: the system's.
    static var systemAppearance: NSAppearance {
        NSAppearance(named: systemIsDark ? .darkAqua : .aqua)!
    }

    // MARK: Type

    /// Product Sans for Latin text; Chinese falls through to PingFang.
    /// Product Sans ships two weights, so medium and lighter read as
    /// regular and semibold and heavier as bold.
    static func font(ofSize size: CGFloat, weight: NSFont.Weight = .regular) -> NSFont {
        let name = weight.rawValue >= NSFont.Weight.semibold.rawValue ? "ProductSans-Bold" : "ProductSans-Regular"
        return NSFont(name: name, size: size) ?? NSFont.systemFont(ofSize: size, weight: weight)
    }

    static func swiftUIFont(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        let bold = weight == .semibold || weight == .bold || weight == .heavy || weight == .black
        return .custom(bold ? "ProductSans-Bold" : "ProductSans-Regular", size: size)
    }

    /// Makes the bundled fonts available to the app. Called once at launch.
    static func registerFonts() {
        guard let urls = Bundle.main.urls(forResourcesWithExtension: "ttf", subdirectory: "Fonts") else { return }
        CTFontManagerRegisterFontURLs(urls as CFArray, .process, true, nil)
    }

    // MARK: Helpers

    static func dynamic(_ name: String, light: UInt32, dark: UInt32) -> NSColor {
        NSColor(name: NSColor.Name(name)) { appearance in
            AdaptiveChrome.isDark(appearance) ? NSColor(hex: dark) : NSColor(hex: light)
        }
    }
}

extension NSColor {
    convenience init(hex: UInt32, alpha: CGFloat = 1) {
        self.init(srgbRed: CGFloat((hex >> 16) & 0xFF) / 255,
                  green: CGFloat((hex >> 8) & 0xFF) / 255,
                  blue: CGFloat(hex & 0xFF) / 255,
                  alpha: alpha)
    }
}
