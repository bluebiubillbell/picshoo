import AppKit

enum ClipboardColorParser {
    static func normalizedHex(from text: String) -> String? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.hasPrefix("#") else { return nil }

        let digits = trimmed.dropFirst()
        guard digits.count == 6, UInt32(digits, radix: 16) != nil else { return nil }
        return "#" + digits.uppercased()
    }
}

struct ClipboardManager {
    /// Marks an image capcap itself put on the clipboard, so the line's
    /// "Hang copied images" does not hang a second copy of a capture it
    /// already hung directly.
    static let ownImagePasteboardType = NSPasteboard.PasteboardType("com.picshoo.own-image")

    static func copyToClipboard(
        image: NSImage,
        pasteboard: NSPasteboard = .general
    ) {
        pasteboard.clearContents()

        if let pngData = image.pngDataPreservingBacking() {
            pasteboard.setData(pngData, forType: .png)
        }

        if let tiffData = image.tiffDataPreservingBacking() {
            pasteboard.setData(tiffData, forType: .tiff)
        }
        pasteboard.setData(Data(), forType: ownImagePasteboardType)
    }

    static func copyToClipboard(imageOutput: EncodedClipboardImageOutput) {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setData(imageOutput.primary.data, forType: imageOutput.primary.pasteboardType)
        if let tiffData = imageOutput.tiffData {
            pasteboard.setData(tiffData, forType: .tiff)
        }
        pasteboard.setData(Data(), forType: ownImagePasteboardType)
    }

    static func copyToClipboard(text: String) {
        writeTextToClipboard(text)
    }

    static func copyColorToClipboard(hex: String) {
        writeTextToClipboard(ClipboardColorParser.normalizedHex(from: hex) ?? hex)
    }

    private static func writeTextToClipboard(_ text: String) {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(text, forType: .string)
    }
}
