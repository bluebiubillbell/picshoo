import AppKit

/// The line's settings, which used to live only in its menu bar submenu.
/// The pane rebuilds itself whenever a line setting or the language
/// changes, so it always matches the line, however the change was made.
@MainActor
final class LineSettingsPane: NSView {
    private let stack = NSStackView()
    private var line: LineController { LineController.shared }

    init() {
        super.init(frame: .zero)
        translatesAutoresizingMaskIntoConstraints = false
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor, constant: 4),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 22),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -22),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -22),
        ])
        rebuild()
        for name in [Notification.Name.lineSettingsDidChange, .languageDidChange] {
            NotificationCenter.default.addObserver(self, selector: #selector(rebuild), name: name, object: nil)
        }
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    deinit { NotificationCenter.default.removeObserver(self) }

    @objc private func rebuild() {
        for view in stack.arrangedSubviews { view.removeFromSuperview() }

        addCard([
            toggleRow(L("Handle screenshots"), hint: L("Screenshots hang instantly and skip the Desktop"),
                      isOn: line.handlesScreenshots, action: #selector(handleScreenshotsToggled(_:))),
            toggleRow(L("Hang copied images"), hint: L("Images you copy hang on the line too"),
                      isOn: line.hangsCopiedImages, action: #selector(hangCopiedToggled(_:))),
        ])

        addCard([
            sectionTitle(L("Bring the line down")),
            toggleRow(L("When the pointer rests in the menu bar"), hint: nil,
                      isOn: LineController.opensFromMenuBar, action: #selector(menuBarRevealToggled(_:))),
            toggleRow(L("When something new hangs"), hint: nil,
                      isOn: LineController.peeksAtNew, action: #selector(peekToggled(_:))),
        ], dividers: false)

        let sizes: [(Layout.Size, String)] = [(.small, L("Small")), (.medium, L("Medium")), (.large, L("Large"))]
        let sizePopup = popup(sizes.map(\.1), selected: sizes.firstIndex { $0.0 == line.size } ?? 1,
                              action: #selector(sizeChanged(_:)))
        let keepTitles = [L("As many as fit")] + Line.keepChoices.map { String(format: L("%d photos"), $0) }
        let keepIndex = line.keepOnLine.flatMap { Line.keepChoices.firstIndex(of: $0) }.map { $0 + 1 } ?? 0
        let keepPopup = popup(keepTitles, selected: keepIndex, action: #selector(keepChanged(_:)))
        addCard([
            controlRow(L("Size"), hint: nil, control: sizePopup),
            controlRow(L("Keep on line"), hint: nil, control: keepPopup),
            toggleRow(L("Sounds"), hint: nil, isOn: line.soundOn, action: #selector(soundToggled(_:))),
        ])

        let shortcutValue = NSTextField(labelWithString: Shortcut.current?.display ?? L("None"))
        shortcutValue.font = WooTheme.font(ofSize: 12, weight: .medium)
        shortcutValue.textColor = WooTheme.settingsInk.withAlphaComponent(0.7)
        let change = button(L("Change Shortcut"), action: #selector(changeShortcut))
        let shortcutControls = NSStackView(views: [shortcutValue, change])
        shortcutControls.spacing = 10
        addCard([
            controlRow(L("Shortcut"), hint: L("Shows or hides the line from any app"), control: shortcutControls),
        ])

        var folderRows: [NSView] = [
            controlRow(L("Also watch folders"), hint: L("New images in these folders hang on the line too"),
                       control: addFolderButton()),
        ]
        for (index, folder) in LineController.extraFolders.enumerated() {
            let remove = button(L("Stop Watching"), action: #selector(stopWatching(_:)))
            remove.tag = index
            let row = controlRow(FileManager.default.displayName(atPath: folder.path), hint: folder.path,
                                 control: remove, primary: false)
            row.toolTip = folder.path
            folderRows.append(row)
        }
        folderRows.append(controlRow(L("Open screenshots folder"), hint: line.screenshotsFolder?.path,
                                     control: button(L("Open"), action: #selector(openScreenshotsFolder))))
        addCard(folderRows)
    }

    // MARK: Actions

    @objc private func handleScreenshotsToggled(_ sender: NSSwitch) { line.handlesScreenshots = sender.state == .on }
    @objc private func hangCopiedToggled(_ sender: NSSwitch) { line.hangsCopiedImages = sender.state == .on }
    @objc private func menuBarRevealToggled(_ sender: NSSwitch) { LineController.opensFromMenuBar = sender.state == .on }
    @objc private func peekToggled(_ sender: NSSwitch) { LineController.peeksAtNew = sender.state == .on }
    @objc private func soundToggled(_ sender: NSSwitch) { line.soundOn = sender.state == .on }
    @objc private func changeShortcut() { line.recordShortcut() }
    @objc private func addFolder() { line.addExtraFolder() }
    @objc private func openScreenshotsFolder() { line.openScreenshotsFolder() }

    @objc private func sizeChanged(_ sender: NSPopUpButton) {
        let sizes: [Layout.Size] = [.small, .medium, .large]
        guard sizes.indices.contains(sender.indexOfSelectedItem) else { return }
        line.size = sizes[sender.indexOfSelectedItem]
    }

    @objc private func keepChanged(_ sender: NSPopUpButton) {
        let index = sender.indexOfSelectedItem
        line.keepOnLine = index == 0 ? nil : Line.keepChoices[index - 1]
    }

    @objc private func stopWatching(_ sender: NSButton) {
        let folders = LineController.extraFolders
        guard folders.indices.contains(sender.tag) else { return }
        line.removeExtraFolder(folders[sender.tag])
    }

    // MARK: Building

    private func addFolderButton() -> NSButton {
        let add = button(L("Add Folder…"), action: #selector(addFolder))
        add.isEnabled = LineController.extraFolders.count < LineController.maxExtraFolders
        return add
    }

    /// A rounded card like the other settings panes, with a divider
    /// between its rows.
    private func addCard(_ rows: [NSView], dividers: Bool = true) {
        let card = NSView()
        card.translatesAutoresizingMaskIntoConstraints = false
        card.wantsLayer = true
        card.layer?.cornerRadius = 12
        card.layer?.cornerCurve = .continuous
        card.layer?.backgroundColor = WooTheme.settingsInk.withAlphaComponent(0.04).cgColor
        card.layer?.borderColor = WooTheme.settingsInk.withAlphaComponent(0.06).cgColor
        card.layer?.borderWidth = 1

        let inner = NSStackView()
        inner.orientation = .vertical
        inner.alignment = .leading
        inner.spacing = 0
        inner.translatesAutoresizingMaskIntoConstraints = false
        card.addSubview(inner)
        NSLayoutConstraint.activate([
            inner.topAnchor.constraint(equalTo: card.topAnchor, constant: 4),
            inner.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 14),
            inner.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -14),
            inner.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -4),
        ])
        for (index, row) in rows.enumerated() {
            if dividers && index > 0 {
                let divider = NSView()
                divider.wantsLayer = true
                divider.layer?.backgroundColor = WooTheme.settingsInk.withAlphaComponent(0.06).cgColor
                divider.translatesAutoresizingMaskIntoConstraints = false
                divider.heightAnchor.constraint(equalToConstant: 1).isActive = true
                inner.addArrangedSubview(divider)
                divider.widthAnchor.constraint(equalTo: inner.widthAnchor).isActive = true
            }
            inner.addArrangedSubview(row)
            row.widthAnchor.constraint(equalTo: inner.widthAnchor).isActive = true
        }
        stack.addArrangedSubview(card)
        card.widthAnchor.constraint(equalTo: stack.widthAnchor).isActive = true
    }

    private func sectionTitle(_ text: String) -> NSView {
        let label = NSTextField(labelWithString: text)
        label.font = WooTheme.font(ofSize: 11, weight: .semibold)
        label.textColor = WooTheme.settingsInk.withAlphaComponent(0.5)
        let row = NSView()
        row.translatesAutoresizingMaskIntoConstraints = false
        label.translatesAutoresizingMaskIntoConstraints = false
        row.addSubview(label)
        NSLayoutConstraint.activate([
            label.topAnchor.constraint(equalTo: row.topAnchor, constant: 10),
            label.bottomAnchor.constraint(equalTo: row.bottomAnchor, constant: -2),
            label.leadingAnchor.constraint(equalTo: row.leadingAnchor),
        ])
        return row
    }

    private func toggleRow(_ title: String, hint: String?, isOn: Bool, action: Selector) -> NSView {
        let toggle = NSSwitch()
        toggle.state = isOn ? .on : .off
        toggle.controlSize = .small
        toggle.target = self
        toggle.action = action
        toggle.setAccessibilityLabel(title)
        return controlRow(title, hint: hint, control: toggle)
    }

    /// A title, an optional hint under it, and a control on the right.
    private func controlRow(_ title: String, hint: String?, control: NSView, primary: Bool = true) -> NSView {
        let titleLabel = NSTextField(labelWithString: title)
        titleLabel.font = WooTheme.font(ofSize: primary ? 13 : 12, weight: primary ? .semibold : .medium)
        titleLabel.textColor = WooTheme.settingsInk.withAlphaComponent(0.94)
        titleLabel.lineBreakMode = .byTruncatingMiddle
        titleLabel.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)

        let text = NSStackView(views: [titleLabel])
        text.orientation = .vertical
        text.alignment = .leading
        text.spacing = 2
        text.translatesAutoresizingMaskIntoConstraints = false
        if let hint {
            let hintLabel = NSTextField(labelWithString: hint)
            hintLabel.font = WooTheme.font(ofSize: 11)
            hintLabel.textColor = WooTheme.settingsInk.withAlphaComponent(0.58)
            hintLabel.lineBreakMode = .byTruncatingMiddle
            hintLabel.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
            text.addArrangedSubview(hintLabel)
        }

        let row = NSView()
        row.translatesAutoresizingMaskIntoConstraints = false
        control.translatesAutoresizingMaskIntoConstraints = false
        control.setContentCompressionResistancePriority(.required, for: .horizontal)
        control.setContentHuggingPriority(.required, for: .horizontal)
        row.addSubview(text)
        row.addSubview(control)
        NSLayoutConstraint.activate([
            text.leadingAnchor.constraint(equalTo: row.leadingAnchor),
            text.topAnchor.constraint(equalTo: row.topAnchor, constant: 10),
            text.bottomAnchor.constraint(equalTo: row.bottomAnchor, constant: -10),
            text.trailingAnchor.constraint(lessThanOrEqualTo: control.leadingAnchor, constant: -12),
            control.trailingAnchor.constraint(equalTo: row.trailingAnchor),
            control.centerYAnchor.constraint(equalTo: row.centerYAnchor),
        ])
        return row
    }

    private func popup(_ titles: [String], selected: Int, action: Selector) -> NSPopUpButton {
        let popup = NSPopUpButton(frame: .zero, pullsDown: false)
        popup.addItems(withTitles: titles)
        popup.selectItem(at: selected)
        popup.controlSize = .small
        popup.font = WooTheme.font(ofSize: 12)
        popup.target = self
        popup.action = action
        return popup
    }

    private func button(_ title: String, action: Selector) -> NSButton {
        let button = NSButton(title: title, target: self, action: action)
        button.bezelStyle = .rounded
        button.controlSize = .small
        button.font = WooTheme.font(ofSize: 12)
        return button
    }
}
