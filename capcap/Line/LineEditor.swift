import AppKit
import UniformTypeIdentifiers

/// Looks up the line's text in `Resources/<language>.lproj/Line.strings`,
/// keyed by the English text, in the language picked in capcap's settings.
func L(_ english: String) -> String {
    Localizer.string(english, table: "Line")
}

/// Press and hold on a photo opens it in capcap's own annotation editor, in
/// place of the system Markup editor Tendedero used. Confirming the edit
/// writes the result back over the file on the line, so the photo there
/// shows the marked-up version; cancelling leaves the file as it was.
@MainActor
final class LineEditor {
    static let shared = LineEditor()

    /// Called with the file once the edited image has been written back.
    var onSaved: (URL) -> Void = { _ in }

    /// Opens the editor for a file and calls back with the confirmed image,
    /// or nil when cancelled. Set by the app delegate, which owns the
    /// editor's lifetime. Returns false when the editor could not open.
    var present: (URL, @escaping (NSImage?) -> Void) -> Bool = { _, _ in false }

    func edit(_ url: URL) {
        let opened = present(url) { [weak self] image in
            guard let self, let image else { return }
            self.save(image, to: url)
        }
        if !opened { NSSound.beep() }
    }

    private func save(_ image: NSImage, to target: URL) {
        guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return }
        // Encoding a large image takes a moment, so it happens off the main thread.
        DispatchQueue.global(qos: .userInitiated).async {
            let data = LineEditor.encode(cgImage, like: target)
            DispatchQueue.main.async { self.write(data, to: target) }
        }
    }

    private func write(_ data: Data?, to target: URL) {
        guard let data else { return }
        do {
            try data.write(to: target, options: .atomic)
            onSaved(target)
        } catch {
            log.error("Could not save the edit: \(error.localizedDescription, privacy: .public)")
            NSSound.beep()
        }
    }

    /// Kept in the file's own format, so a JPEG or HEIC screenshot stays one.
    nonisolated private static func encode(_ image: CGImage, like target: URL) -> Data? {
        let type = (UTType(filenameExtension: target.pathExtension) ?? .png).identifier as CFString
        let out = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(out, type, 1, nil) else { return nil }
        CGImageDestinationAddImage(destination, image, nil)
        return CGImageDestinationFinalize(destination) ? out as Data : nil
    }
}
