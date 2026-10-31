// Builds Picshoo's icons from menu.png, a single tag on the line.
//   swift scripts/make-icons.swift
// The drawing (club blue on white) becomes the app icon, laid out like Woo's:
// a rounded square of 824 on a 1024 canvas. It also becomes the menu bar
// template, its ink turned into alpha.
import AppKit

let root = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : FileManager.default.currentDirectoryPath)

func bitmap(_ size: Int) -> NSBitmapImageRep {
    NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8,
                     samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB,
                     bytesPerRow: 0, bitsPerPixel: 0)!
}

func png(_ rep: NSBitmapImageRep, _ url: URL) {
    try! rep.representation(using: .png, properties: [:])!.write(to: url)
}

// App icon
let art = NSImage(contentsOf: root.appendingPathComponent("menu.png"))!
let iconset = root.appendingPathComponent("build/AppIcon.iconset")
try? FileManager.default.removeItem(at: iconset)
try! FileManager.default.createDirectory(at: iconset, withIntermediateDirectories: true)
for (points, scales) in [(16, [1, 2]), (32, [1, 2]), (128, [1, 2]), (256, [1, 2]), (512, [1, 2])] {
    for scale in scales {
        let px = points * scale
        let rep = bitmap(px)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
        NSGraphicsContext.current?.imageInterpolation = .high
        let k = CGFloat(px) / 1024
        let tile = NSRect(x: 100 * k, y: 100 * k, width: 824 * k, height: 824 * k)
        let shape = NSBezierPath(roundedRect: tile, xRadius: 185 * k, yRadius: 185 * k)
        NSGraphicsContext.saveGraphicsState()
        shape.addClip()
        art.draw(in: tile)
        NSGraphicsContext.restoreGraphicsState()
        // The white tile gets Woo's thin grey rule, so it keeps its edge on a
        // light Dock or Finder window.
        let edge = NSBezierPath(roundedRect: tile.insetBy(dx: 3 * k, dy: 3 * k), xRadius: 182 * k, yRadius: 182 * k)
        edge.lineWidth = max(1, 6 * k)
        NSColor(srgbRed: 0xE6 / 255, green: 0xE6 / 255, blue: 0xE6 / 255, alpha: 1).setStroke()
        edge.stroke()
        NSGraphicsContext.restoreGraphicsState()
        let name = scale == 1 ? "icon_\(points)x\(points).png" : "icon_\(points)x\(points)@2x.png"
        png(rep, iconset.appendingPathComponent(name))
    }
}

// Menu bar template: ink becomes opaque black, paper becomes clear, cropped
// to the drawing with a little air around it.
let source = NSBitmapImageRep(data: try! Data(contentsOf: root.appendingPathComponent("menu.png")))!
let w = source.pixelsWide, h = source.pixelsHigh
var minX = w, minY = h, maxX = 0, maxY = 0
var ink = [UInt8](repeating: 0, count: w * h)
for y in 0..<h {
    for x in 0..<w {
        let c = source.colorAt(x: x, y: y)!.usingColorSpace(.deviceRGB)!
        let lightness = (c.redComponent + c.greenComponent + c.blueComponent) / 3
        let a = UInt8(max(0, min(255, (1 - lightness) * 255 * 1.6)))
        ink[y * w + x] = a
        if a > 40 { minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y) }
    }
}
let side = max(maxX - minX, maxY - minY) + 40
let ox = (minX + maxX) / 2 - side / 2, oy = (minY + maxY) / 2 - side / 2
let mask = bitmap(side)
for y in 0..<side {
    for x in 0..<side {
        let sx = ox + x, sy = oy + y
        let a = (sx >= 0 && sy >= 0 && sx < w && sy < h) ? ink[sy * w + sx] : 0
        mask.setColor(NSColor(deviceRed: 0, green: 0, blue: 0, alpha: CGFloat(a) / 255), atX: x, y: y)
    }
}
for px in [22, 44] {
    let rep = bitmap(px)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current?.imageInterpolation = .high
    mask.draw(in: NSRect(x: 0, y: 0, width: px, height: px))
    NSGraphicsContext.restoreGraphicsState()
    png(rep, root.appendingPathComponent(px == 22 ? "design/MenuBarIcon.png" : "design/MenuBarIcon@2x.png"))
}
print("ok")
