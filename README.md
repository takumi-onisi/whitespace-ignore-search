# Whitespace Ignore Search

Regex search made easy. Automatically generate whitespace-tolerant patterns while keeping your specific regex logic intact.

## 💡 The Inspiration

For developers who use **Adobe Dreamweaver**, the **"Ignore Whitespace"** search option is an indispensable feature for its reliability and ease of use. 

This extension brings that same powerful search experience to **VS Code**. It allows you to search across different formatting styles without the hassle of manual regex coding, making it the perfect bridge for developers who value the efficiency of both tools.

## 🚀 Overview

Have you ever struggled to find a code snippet because of different indentation, line breaks, or extra spaces? This extension handles the complexity of regex by automatically inserting spacer patterns between characters.

## 🏁 How to Start

You can launch the search panel using the following command:

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS) to open the **Command Palette**.
2. Type **"Whitespace Ignore Search"** and select the command.
3. The dedicated search panel will open in a new tab.

## ✨ Key Features

### 1. Auto-Spacer Insertion
It converts raw text into a regex that ignores whitespaces and line breaks.
- **Input:** `const a = 1`
- **Output:** `c[\s]*o[\s]*n[\s]*s[\s]*t[\s]*a[\s]*=[\s]*1`

### 2. Regex Protection Area
Want to use actual Regex? Wrap it with delimiters (default: `@`). Inside these areas, characters are not escaped and no spacers are inserted.
- **Input:** `class=@.*-active@`
- **Output:** `c[\s]*l[\s]*a[\s]*s[\s]*s[\s]*=.*-active`

### 3. Smart Escaping & Double Delimiters
- **Auto-Escape:** Outside protected areas, meta characters like `.?+*` are automatically escaped (e.g., `.` becomes `\.`).
- **Literal Delimiters:** If you need to search for the delimiter character itself, simply **double it**.
  - **Input:** `email: @[a-z]+@@gmail.com@`
  - **Result:** The `@@` is treated as a literal `@` inside the pattern.

## 📖 Practical Examples

| Input | Generated Regex (Example) | Description |
| :--- | :--- | :--- |
| `<div>` | `d[\s]*i[\s]*v[\s]*>[\s]*` | Find tags regardless of formatting |
| `@<.*?>@` | `<.*?>` | Pure Regex search |
| `id=@id-[0-9]+@` | `i[\s]*d[\s]*=[\s]*id-[0-9]+` | Literal string + Regex pattern |
| `price: @@100` | `p[\s]*r[\s]*i[\s]*c[\s]*e[\s]*:[\s]*@[\s]*1[\s]*0[\s]*0` | Searching for a literal `@` |

## 🛠 Usage

1. Open the panel via the **Command Palette**.
2. Enter the text you want to search for in the **Input** area.
3. Preview the generated pattern in real-time.
4. Adjust **Delimiters** or the **Spacer Pattern** (default: `[\s\r\n]*`) if needed.
5. Click **Search** to apply the generated pattern to the global VS Code Search Panel.

## ⚙️ Configuration

- **Start/End Delimiter**: The markers for protection areas. Default is `@`.
- **Spacer Pattern**: The regex inserted between characters. Default is `[\s\r\n]*`.
- **Reset**: Click the reset button under the spacer input to revert to default settings.

---

**Developed with ❤️ for efficient coding.**