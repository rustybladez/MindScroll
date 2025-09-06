# 🧠 MindScroll - Facebook Time Manager

A Chrome extension designed to help you break free from mindless Facebook scrolling by reminding you of your purpose and time spent.

## Features

- **Purpose Tracking**: Set your intention before browsing Facebook
- **Time Reminders**: Get prompted to leave after your set interval (default: 10 minutes)
- **Attention-Grabbing Alerts**: Visually prominent reminders that break the scrolling trance
- **Session Management**: Tracks your time and purposes across visits
- **Customizable Settings**: Adjust reminder intervals and preferences

## How It Works

1. **Purpose Modal**: When you visit Facebook (or after 30+ minutes), you'll be asked why you're visiting
2. **Time Tracking**: The extension tracks how long you spend scrolling
3. **Smart Reminders**: After your set interval, you'll get a prominent reminder to leave
4. **Easy Exit**: Option to close Facebook or continue for 5 more minutes

## Installation

### Load as Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `MindScroll` folder containing the extension files
5. The extension should now appear in your extensions list

### First Use

1. Click the MindScroll icon in your browser toolbar
2. Set your preferred reminder interval (default: 10 minutes)
3. Visit Facebook - you'll be prompted to set your purpose
4. The extension will remind you when your time is up!

## Usage

### Setting Your Purpose

- When visiting Facebook, a modal will ask for your purpose
- Choose from presets (Messages, Notifications, Birthdays, Just browsing)
- Or type your own custom purpose
- This helps maintain mindful browsing

### Managing Reminders

- Reminders appear after your set interval
- Choose to leave Facebook or continue for 5 more minutes
- Timer resets when you choose to continue

### Extension Settings

- Click the extension icon to access settings
- Adjust reminder interval (1-60 minutes)
- View your current session purpose
- Reset the current timer

## File Structure

```
MindScroll/
├── manifest.json          # Extension configuration
├── popup.html            # Settings popup interface
├── popup.js              # Settings popup logic
├── content.js            # Facebook page interaction
├── content.css           # Modal styling
├── background.js         # Extension background service
├── icons/                # Extension icons (create these)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Customization

### Reminder Intervals

- Adjust in the popup settings (1-60 minutes)
- Settings persist across browser sessions

### Visual Styling

- Edit `content.css` to customize modal appearance
- Change colors, animations, and layout

### Purpose Presets

- Modify preset buttons in `content.js` (lines with `data-purpose`)
- Add/remove/change preset options

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**:
  - `storage` - Save settings and session data
  - `activeTab` - Interact with current tab
  - `scripting` - Inject content scripts
- **Host Permissions**: `*://*.facebook.com/*` - Only runs on Facebook

## Privacy

- **No Data Collection**: All data stays on your device
- **Local Storage Only**: Uses Chrome's local storage API
- **No Network Requests**: Extension works completely offline
- **Facebook Only**: Only activates on Facebook domains

## Development

### Making Changes

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the MindScroll extension
4. Test your changes on Facebook

### Debugging

- Use browser developer tools
- Check the extension console in `chrome://extensions/`
- Console logs are available in content script context

## Contributing

Feel free to:

- Report bugs or issues
- Suggest new features
- Submit pull requests
- Share feedback on effectiveness

## Future Enhancements

- Support for other social media platforms (Instagram, Twitter, etc.)
- Statistics and usage analytics
- Achievement system for mindful browsing
- Negative motivation messages (as mentioned in original idea)
- Time-based restrictions (block after certain daily limits)

## License

Open source - feel free to modify and distribute!

## Motivation

_"The first principle is that you must not fool yourself — and you are the easiest person to fool."_ - Richard Feynman

This extension helps you stay honest about your social media usage and maintain intentional browsing habits.

---

**Remember**: The goal isn't to eliminate Facebook entirely, but to use it more mindfully and purposefully! 🎯
