# Whitespace Ignore Search

Regex search made easy. Automatically generate whitespace-tolerant patterns while keeping your specific regex logic intact.

## 🚀 Overview

Have you ever struggled to find a code snippet because of different indentation, line breaks, or extra spaces? This extension handles the complexity of regex by automatically inserting spacer patterns between characters.

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

1. Open the **Whitespace Ignore Search** panel in VS Code.
2. Enter the text you want to search for.
3. Adjust **Delimiters** or the **Spacer Pattern** (default: `[\s\r\n]*`) if needed.
4. Click **Inject** to apply the generated pattern to the global VS Code Search Panel.

## ⚙️ Configuration

- **Start/End Delimiter**: The markers for protection areas. Default is `@`.
- **Spacer Pattern**: The regex inserted between characters. Default is `[\s\r\n]*`.
- **Reset**: Click the reset button under the spacer input to revert to default settings.

---

**Developed with ❤️ for efficient coding.**