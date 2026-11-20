import AppKit
import AVFoundation
import Carbon
import CoreImage

/// Takes a photo with the camera, like Photo Booth without the effects, and
/// hangs it on the line. ⌘⇧6 opens a live, mirrored preview. Space, Return
/// or the shutter button takes the photo, which flies from the preview up to
/// the line. Escape closes the preview without taking one.
@MainActor
final class CameraCapture: NSObject {
    static let shared = CameraCapture()

    private var panel: CameraPanel?
    private var session: AVCaptureSession?
    private var grabber: CameraFrameGrabber?
    private var focusRestorer: SourceAppFocusRestorer?
    private var shooting = false
    private let sessionQueue = DispatchQueue(label: "picshoo.camera.session")

    var isActive: Bool { panel != nil }

    /// Opens the camera, asking for access the first time. While it is open,
    /// the shortcut just brings it forward again.
    func start() {
        if let panel {
            NSApp.activate(ignoringOtherApps: true)
            panel.makeKeyAndOrderFront(nil)
            return
        }
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            open()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    MainActor.assumeIsolated {
                        if granted { CameraCapture.shared.open() }
                    }
                }
            }
        default:
            showDenied()
        }
    }

    // MARK: Opening and closing

    private func open() {
        guard panel == nil else { return }
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device) else {
            ToastWindow.show(message: L10n.cameraUnavailable, duration: 2.0)
            return
        }

        let session = AVCaptureSession()
        session.beginConfiguration()
        if session.canSetSessionPreset(.high) { session.sessionPreset = .high }
        guard session.canAddInput(input) else {
            session.commitConfiguration()
            ToastWindow.show(message: L10n.cameraUnavailable, duration: 2.0)
            return
        }
        session.addInput(input)
        let grabber = CameraFrameGrabber()
        let output = AVCaptureVideoDataOutput()
        output.alwaysDiscardsLateVideoFrames = true
        output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
        output.setSampleBufferDelegate(grabber, queue: grabber.queue)
        if session.canAddOutput(output) { session.addOutput(output) }
        session.commitConfiguration()

        let dimensions = CMVideoFormatDescriptionGetDimensions(device.activeFormat.formatDescription)
        let aspect = dimensions.width > 0 && dimensions.height > 0
            ? CGFloat(dimensions.width) / CGFloat(dimensions.height)
            : 16.0 / 9.0

        let mouse = NSEvent.mouseLocation
        let screen = NSScreen.screens.first { NSMouseInRect(mouse, $0.frame, false) } ?? NSScreen.main
        let panel = CameraPanel(session: session, aspect: aspect, screen: screen)
        panel.onShoot = { [weak self] in self?.shoot() }
        panel.onCancel = { [weak self] in self?.close() }

        self.session = session
        self.grabber = grabber
        self.panel = panel
        shooting = false
        focusRestorer = SourceAppFocusRestorer.captureFrontmostApplication()

        NSApp.activate(ignoringOtherApps: true)
        panel.makeKeyAndOrderFront(nil)
        sessionQueue.async { session.startRunning() }
    }

    private func close(restoringFocus: Bool = true) {
        guard let panel else { return }
        panel.orderOut(nil)
        self.panel = nil
        if let session {
            sessionQueue.async { session.stopRunning() }
        }
        session = nil
        grabber = nil
        if restoringFocus { focusRestorer?.restore() }
        focusRestorer = nil
    }

    // MARK: Taking the photo

    private func shoot() {
        guard !shooting, let panel else { return }
        // Mirrored, so the photo matches the preview, as Photo Booth keeps it.
        guard let image = grabber?.snapshot(mirrored: true) else {
            NSSound.beep()
            return
        }
        shooting = true
        Self.playShutter()
        panel.flash()
        let from = panel.previewFrameOnScreen
        // A moment of the flash, then the photo leaves the preview for the line.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) { [weak self] in
            MainActor.assumeIsolated {
                self?.close()
                let photo = NSImage(cgImage: image, size: NSSize(width: image.width, height: image.height))
                LineController.shared.hang(image: photo, from: from)
            }
        }
    }

    private static let shutterSound = NSSound(
        contentsOfFile: "/System/Library/Components/CoreAudio.component/Contents/SharedSupport/SystemSounds/system/Shutter.aif",
        byReference: true)

    /// The camera shutter, unless the line's sounds are turned off.
    private static func playShutter() {
        guard !UserDefaults.standard.bool(forKey: "soundOff") else { return }
        shutterSound?.stop()
        shutterSound?.play()
    }

    // MARK: Access

    private func showDenied() {
        NSApp.activate(ignoringOtherApps: true)
        let alert = NSAlert()
        alert.messageText = L10n.cameraDeniedTitle
        alert.informativeText = L10n.cameraDeniedMessage
        alert.addButton(withTitle: L10n.recordingMicrophoneOpenSettings)
        alert.addButton(withTitle: L10n.shortcutCancel)
        guard alert.runModal() == .alertFirstButtonReturn,
              let url = URL(string: "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Camera")
        else { return }
        NSWorkspace.shared.open(url)
    }
}

/// Keeps the newest camera frame, so a press of the shutter takes exactly
/// what the preview shows at that moment, with no delay.
private final class CameraFrameGrabber: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate, @unchecked Sendable {
    let queue = DispatchQueue(label: "picshoo.camera.frames")
    private let lock = NSLock()
    private var latest: CVPixelBuffer?
    private static let context = CIContext()

    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer,
                       from connection: AVCaptureConnection) {
        guard let buffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        lock.lock()
        latest = buffer
        lock.unlock()
    }

    func snapshot(mirrored: Bool) -> CGImage? {
        lock.lock()
        let buffer = latest
        lock.unlock()
        guard let buffer else { return nil }
        var image = CIImage(cvPixelBuffer: buffer)
        if mirrored { image = image.oriented(.upMirrored) }
        return Self.context.createCGImage(image, from: image.extent)
    }
}

// MARK: - The panel

/// The camera window: the live preview on a Woo card, with the shutter
/// below it. It can be dragged anywhere by its background.
private final class CameraPanel: NSPanel {
    var onShoot: (() -> Void)?
    var onCancel: (() -> Void)?

    private let previewHost = NSView()
    private let flashLayer = CALayer()

    private static let inset: CGFloat = 8
    private static let barHeight: CGFloat = 64

    init(session: AVCaptureSession, aspect: CGFloat, screen: NSScreen?) {
        let visible = screen?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        var width = min(640, visible.width * 0.6)
        var height = width / aspect
        let maxHeight = visible.height * 0.6
        if height > maxHeight {
            height = maxHeight
            width = height * aspect
        }
        width = width.rounded()
        height = height.rounded()
        let size = NSSize(width: width + Self.inset * 2, height: height + Self.inset + Self.barHeight)
        let origin = NSPoint(x: visible.midX - size.width / 2,
                             y: visible.minY + (visible.height - size.height) * 0.55)

        super.init(contentRect: NSRect(origin: origin, size: size),
                   styleMask: [.borderless, .fullSizeContentView],
                   backing: .buffered, defer: false)
        isOpaque = false
        backgroundColor = .clear
        hasShadow = true
        level = .floating
        isMovableByWindowBackground = true
        hidesOnDeactivate = false
        isReleasedWhenClosed = false
        collectionBehavior = [.moveToActiveSpace, .fullScreenAuxiliary]

        let root = CameraChromeView(frame: NSRect(origin: .zero, size: size))
        root.wantsLayer = true
        root.layer?.cornerRadius = 18
        root.layer?.borderWidth = 1
        root.layer?.masksToBounds = true
        contentView = root

        // The live picture, mirrored like a mirror.
        previewHost.frame = NSRect(x: Self.inset, y: Self.barHeight, width: width, height: height)
        previewHost.wantsLayer = true
        previewHost.layer?.backgroundColor = NSColor.black.cgColor
        previewHost.layer?.cornerRadius = 12
        previewHost.layer?.masksToBounds = true
        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.videoGravity = .resizeAspectFill
        preview.frame = previewHost.bounds
        preview.autoresizingMask = [.layerWidthSizable, .layerHeightSizable]
        if let connection = preview.connection, connection.isVideoMirroringSupported {
            connection.automaticallyAdjustsVideoMirroring = false
            connection.isVideoMirrored = true
        }
        previewHost.layer?.addSublayer(preview)
        flashLayer.backgroundColor = NSColor.white.cgColor
        flashLayer.opacity = 0
        flashLayer.frame = previewHost.bounds
        previewHost.layer?.addSublayer(flashLayer)
        root.addSubview(previewHost)

        let shutter = ShutterButton(frame: NSRect(x: size.width / 2 - 24, y: (Self.barHeight - 48) / 2,
                                                  width: 48, height: 48))
        shutter.toolTip = L10n.takePhoto
        shutter.target = self
        shutter.action = #selector(shutterClicked)
        root.addSubview(shutter)

        let close = CloseButton(frame: NSRect(x: Self.inset + 6, y: (Self.barHeight - 28) / 2, width: 28, height: 28))
        close.toolTip = L10n.shortcutCancel
        close.target = self
        close.action = #selector(closeClicked)
        root.addSubview(close)

        initialFirstResponder = root
    }

    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { true }

    /// Where the preview sits on screen, for the photo's flight to the line.
    var previewFrameOnScreen: CGRect {
        convertToScreen(previewHost.convert(previewHost.bounds, to: nil))
    }

    func flash() {
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        flashLayer.opacity = 0.9
        CATransaction.commit()
        let fade = CABasicAnimation(keyPath: "opacity")
        fade.fromValue = 0.9
        fade.toValue = 0
        fade.duration = 0.25
        flashLayer.opacity = 0
        flashLayer.add(fade, forKey: "flash")
    }

    override func keyDown(with event: NSEvent) {
        let plain = event.modifierFlags.intersection([.command, .control, .option]).isEmpty
        let code = Int(event.keyCode)
        if code == kVK_Escape {
            onCancel?()
        } else if plain, [kVK_Space, kVK_Return, kVK_ANSI_KeypadEnter].contains(code) {
            if !event.isARepeat { onShoot?() }
        } else {
            super.keyDown(with: event)
        }
    }

    override func cancelOperation(_ sender: Any?) {
        onCancel?()
    }

    override func performKeyEquivalent(with event: NSEvent) -> Bool {
        if event.modifierFlags.intersection([.command, .control, .option, .shift]) == .command,
           event.charactersIgnoringModifiers?.lowercased() == "w" {
            onCancel?()
            return true
        }
        return super.performKeyEquivalent(with: event)
    }

    @objc private func shutterClicked() { onShoot?() }
    @objc private func closeClicked() { onCancel?() }
}

/// The card behind the preview, in Woo's surface colour with a thin rule,
/// following light and dark mode.
private final class CameraChromeView: NSView {
    override var wantsUpdateLayer: Bool { true }
    override var acceptsFirstResponder: Bool { true }

    override func updateLayer() {
        layer?.backgroundColor = AdaptiveChrome.resolvedCGColor(WooTheme.surface, for: effectiveAppearance)
        layer?.borderColor = AdaptiveChrome.resolvedCGColor(WooTheme.line, for: effectiveAppearance)
    }
}

/// A round accent button with a camera in it, darker while hovered or held.
private final class ShutterButton: NSButton {
    private var hovering = false

    override init(frame: NSRect) {
        super.init(frame: frame)
        isBordered = false
        title = ""
        refusesFirstResponder = true
        setButtonType(.momentaryChange)
    }

    required init?(coder: NSCoder) { fatalError() }

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        trackingAreas.forEach(removeTrackingArea)
        addTrackingArea(NSTrackingArea(rect: bounds, options: [.mouseEnteredAndExited, .activeAlways, .inVisibleRect],
                                       owner: self))
    }

    override func mouseEntered(with event: NSEvent) { hovering = true; needsDisplay = true }
    override func mouseExited(with event: NSEvent) { hovering = false; needsDisplay = true }
    override var mouseDownCanMoveWindow: Bool { false }

    override func draw(_ dirtyRect: NSRect) {
        let ring = NSBezierPath(ovalIn: bounds.insetBy(dx: 1.5, dy: 1.5))
        ring.lineWidth = 3
        WooTheme.accent.setStroke()
        ring.stroke()
        let fill = NSBezierPath(ovalIn: bounds.insetBy(dx: 6, dy: 6))
        (isHighlighted || hovering ? WooTheme.accentDark : WooTheme.accent).setFill()
        fill.fill()

        let config = NSImage.SymbolConfiguration(pointSize: 15, weight: .semibold)
        guard let symbol = NSImage(systemSymbolName: "camera.fill", accessibilityDescription: nil)?
            .withSymbolConfiguration(config) else { return }
        let tinted = NSImage(size: symbol.size, flipped: false) { rect in
            symbol.draw(in: rect)
            WooTheme.onAccent.set()
            rect.fill(using: .sourceAtop)
            return true
        }
        let s = symbol.size
        tinted.draw(in: NSRect(x: bounds.midX - s.width / 2, y: bounds.midY - s.height / 2, width: s.width, height: s.height))
    }
}

/// A small round button with an × that closes the camera.
private final class CloseButton: NSButton {
    private var hovering = false

    override init(frame: NSRect) {
        super.init(frame: frame)
        isBordered = false
        title = ""
        refusesFirstResponder = true
        setButtonType(.momentaryChange)
    }

    required init?(coder: NSCoder) { fatalError() }

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        trackingAreas.forEach(removeTrackingArea)
        addTrackingArea(NSTrackingArea(rect: bounds, options: [.mouseEnteredAndExited, .activeAlways, .inVisibleRect],
                                       owner: self))
    }

    override func mouseEntered(with event: NSEvent) { hovering = true; needsDisplay = true }
    override func mouseExited(with event: NSEvent) { hovering = false; needsDisplay = true }
    override var mouseDownCanMoveWindow: Bool { false }

    override func draw(_ dirtyRect: NSRect) {
        let circle = NSBezierPath(ovalIn: bounds)
        (hovering || isHighlighted ? WooTheme.line : WooTheme.inset).setFill()
        circle.fill()

        let config = NSImage.SymbolConfiguration(pointSize: 11, weight: .semibold)
        guard let symbol = NSImage(systemSymbolName: "xmark", accessibilityDescription: nil)?
            .withSymbolConfiguration(config) else { return }
        let tinted = NSImage(size: symbol.size, flipped: false) { rect in
            symbol.draw(in: rect)
            WooTheme.body.set()
            rect.fill(using: .sourceAtop)
            return true
        }
        let s = symbol.size
        tinted.draw(in: NSRect(x: bounds.midX - s.width / 2, y: bounds.midY - s.height / 2, width: s.width, height: s.height))
    }
}
